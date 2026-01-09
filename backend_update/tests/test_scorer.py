import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from main.internal.search.scorer import get_standardized_scores, get_combine_score
import math


def test_get_standardized_scores_range_and_order():
    scores = [0.1, 0.5, 2.0]
    std = get_standardized_scores(scores)
    assert len(std) == len(scores)
    # all values >= 10 (per implementation)
    assert all(s >= 10 for s in std)
    # preserve order: highest raw -> highest standardized
    assert std[2] > std[1] > std[0]


def test_get_combine_score_harmonic_mean():
    s = get_combine_score([10.0, 20.0])
    # harmonic mean of 10 and 20 is 2 / (1/10 + 1/20) = 13.333...
    assert math.isclose(s, 13.3333333, rel_tol=1e-6)
