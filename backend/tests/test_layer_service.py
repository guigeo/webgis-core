import pytest

from app.services.layers import InvalidFeatureQueryError, parse_bbox


@pytest.mark.parametrize(
    ("value", "expected"),
    [
        ("-47,-24,-46,-23", (-47.0, -24.0, -46.0, -23.0)),
        (" -47.5, -24.2, -45.9, -22.8 ", (-47.5, -24.2, -45.9, -22.8)),
    ],
)
def test_parse_bbox_accepts_valid_epsg_4326_extent(value, expected) -> None:
    assert parse_bbox(value) == expected


@pytest.mark.parametrize(
    "value",
    [
        "-47,-24,-46",
        "west,-24,-46,-23",
        "-181,-24,-46,-23",
        "-47,-91,-46,-23",
        "-46,-24,-47,-23",
        "-47,-23,-46,-24",
        "nan,-24,-46,-23",
    ],
)
def test_parse_bbox_rejects_invalid_or_unbounded_values(value) -> None:
    with pytest.raises(InvalidFeatureQueryError):
        parse_bbox(value)
