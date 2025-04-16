import shlex

def parse_raw_query(raw_input: str, filters_config: list) -> list[dict]:
    """
    Converts a raw query string into structured QueryClause-style dicts.
    """
    result = []
    clauses = raw_input.split("|")

    for clause in clauses:
        clause = clause.strip()
        filter_map = {f['shortened_field_name']: f['field_name'] for f in filters_config}
        parts = shlex.split(clause)

        current_text = []
        current_filters = {}
        i = 0
        while i < len(parts):
            part = parts[i]
            if part.startswith("-") and part[1:] in filter_map:
                key = filter_map[part[1:]]
                i += 1
                if i < len(parts):
                    current_filters[key] = parts[i]
            else:
                current_text.append(part)
            i += 1

        result.append({
            "text": " ".join(current_text),
            "filters": current_filters
        })

    return result
