# Notice — provenance & attribution

Cairn is a continuation (fork) of:

- **[OyaAIProd/todo](https://github.com/OyaAIProd/todo)** — the repository this
  project was forked from on 2026-06-06
- which is itself a fork of **[viraj-sh/todo](https://github.com/viraj-sh/todo)**
  by Viraj Sharma, the original author of the codebase and the "Cairn" UI

The full upstream commit history is preserved in this repository (everything up
to and including `01f7b22`). Both upstream projects are licensed under
**AGPL-3.0**, and this repository remains AGPL-3.0 (see [LICENSE](LICENSE)).

GitHub does not allow forks of public repositories to be made private, which is
why this lives as a standalone private repository rather than a GitHub-linked
fork — this file, the repo description, the README and the intact git history
carry the lineage instead.

Major divergences from upstream (see git log for the rest):
- MongoDB/Beanie backend ported to PostgreSQL/SQLAlchemy 2.0
- Password reset flow wired end-to-end (was a UI mock)
- Quick Notes floating notebook, project subtitles, Phosphor notebook branding
