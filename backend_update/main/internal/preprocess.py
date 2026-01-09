import shlex
from typing import List, Dict


def parse_raw_query(raw_input: str, filters_config: Dict) -> List[Dict]:
    """
    Parses a raw input string into structured query clauses,
    where each clause may contain text and multiple-word filters.
    """
    print("DEBUGGING for parse_raw_query:")
    print("Raw Input:", raw_input)
    print("Filters Config:", filters_config)
    print("----")
    print()
    result = []
    clauses = raw_input.split("|")
    filter_map = {v["shortened_field_name"]: k for k, v in filters_config.items() if "shortened_field_name" in v}

    for clause in clauses:
        parts = shlex.split(clause.strip())
        current_text = []
        current_filters = {}

        i = 0
        while i < len(parts):
            part = parts[i]
            if part.startswith("-") and part[1:] in filter_map:
                key = filter_map[part[1:]]
                i += 1
                value_parts = []
                while i < len(parts) and not parts[i].startswith("-"):
                    value_parts.append(parts[i])
                    i += 1
                current_filters[key] = " ".join(value_parts)
            else:
                current_text.append(part)
                i += 1

        result.append({
            "text": " ".join(current_text),
            "filters": current_filters
        })

    return result
