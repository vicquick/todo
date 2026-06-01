def normalize_tags(tags: list[str] | None) -> list[str]:
    if not tags:
        return []
    normalized = []
    for tag in tags:
        cleaned = tag.strip().lower()
        if cleaned:
            normalized.append(cleaned)
    return list(dict.fromkeys(normalized))
