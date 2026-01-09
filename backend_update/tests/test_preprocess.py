import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from main.internal.preprocess import parse_raw_query


def get_filters_config_example():
    return {
        "ocr": {"shortened_field_name": "ocr"},
        "location_displayed": {"shortened_field_name": "l"},
        "transcript": {"shortened_field_name": "tr"},
        "date": {"shortened_field_name": "d"}
    }


def test_parse_raw_query_simple():
    cfg = get_filters_config_example()
    q = "breakfast with family"
    parsed = parse_raw_query(q, cfg)
    assert isinstance(parsed, list)
    assert len(parsed) == 1
    assert parsed[0]["text"] == "breakfast with family"
    assert parsed[0]["filters"] == {}


def test_parse_raw_query_flags_and_quotes():
    cfg = get_filters_config_example()
    q = "people -l 'Dublin' -ocr \"IRELAND GUINNESS\""
    parsed = parse_raw_query(q, cfg)
    assert len(parsed) == 1
    assert parsed[0]["text"].startswith("people")
    # filters keys should be dataset config keys (not shortened tokens)
    assert "location_displayed" in parsed[0]["filters"]
    assert parsed[0]["filters"]["location_displayed"] == "Dublin"
    assert "ocr" in parsed[0]["filters"]
    assert parsed[0]["filters"]["ocr"] == "IRELAND GUINNESS"


def test_parse_raw_query_two_clauses():
    cfg = get_filters_config_example()
    q = "prepare food | eat dessert -l cafe"
    parsed = parse_raw_query(q, cfg)
    assert len(parsed) == 2
    assert parsed[0]["text"].strip() == "prepare food"
    assert parsed[1]["text"].startswith("eat dessert")
    assert "location_displayed" in parsed[1]["filters"]
    assert parsed[1]["filters"]["location_displayed"] == "cafe"
