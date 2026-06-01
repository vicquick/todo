import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  aiSettingsApi, privacyApi, mcpApi,
  AISettings, PrivacySettings, MCPConfig,
} from "../api/aiMock";

type Ctx = {
  ready: boolean;
  ai: AISettings;
  privacy: PrivacySettings;
  mcp: MCPConfig;

  updateAI: (patch: Partial<AISettings>) => Promise<void>;
  testAI: () => Promise<{ ok: boolean; message: string }>;

  updatePrivacy: (patch: Partial<PrivacySettings>) => Promise<void>;

  updateMCP: (patch: Partial<MCPConfig>) => Promise<void>;
  toggleMCPTool: (toolId: string, enabled: boolean) => Promise<void>;
  checkMCP: () => Promise<void>;
};

const AICtx = createContext<Ctx | null>(null);

export function AIProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [ai, setAI] = useState<AISettings | null>(null);
  const [privacy, setPrivacy] = useState<PrivacySettings | null>(null);
  const [mcp, setMcp] = useState<MCPConfig | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [a, p, m] = await Promise.all([aiSettingsApi.get(), privacyApi.get(), mcpApi.get()]);
      if (!alive) return;
      setAI(a); setPrivacy(p); setMcp(m); setReady(true);
    })();
    return () => { alive = false; };
  }, []);

  const updateAI = useCallback(async (patch: Partial<AISettings>) => {
    setAI(await aiSettingsApi.update(patch));
  }, []);
  const testAI = useCallback(async () => {
    const res = await aiSettingsApi.testConnection();
    setAI(await aiSettingsApi.get());
    return { ok: res.ok, message: res.message };
  }, []);
  const updatePrivacy = useCallback(async (patch: Partial<PrivacySettings>) => {
    setPrivacy(await privacyApi.update(patch));
  }, []);
  const updateMCP = useCallback(async (patch: Partial<MCPConfig>) => {
    setMcp(await mcpApi.update(patch));
  }, []);
  const toggleMCPTool = useCallback(async (id: string, enabled: boolean) => {
    setMcp(await mcpApi.setToolEnabled(id, enabled));
  }, []);
  const checkMCP = useCallback(async () => {
    setMcp(await mcpApi.checkConnection());
  }, []);

  const value = useMemo<Ctx>(() => ({
    ready,
    ai: ai ?? {
      enabled: false, providerId: "anthropic", baseUrl: "", model: "",
      apiKey: "", lastConnectedAt: null, connectionStatus: "unknown",
    },
    privacy: privacy ?? { saveHistory: false, allowDataModification: false, allowExternalMcp: false },
    mcp: mcp ?? { enabled: false, serverUrl: "", serverStatus: "disconnected", lastCheckedAt: null, tools: [] },
    updateAI, testAI, updatePrivacy, updateMCP, toggleMCPTool, checkMCP,
  }), [ready, ai, privacy, mcp, updateAI, testAI, updatePrivacy, updateMCP, toggleMCPTool, checkMCP]);

  return <AICtx.Provider value={value}>{children}</AICtx.Provider>;
}

export function useAI() {
  const ctx = useContext(AICtx);
  if (!ctx) throw new Error("useAI must be used inside AIProvider");
  return ctx;
}
