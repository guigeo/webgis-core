import pytest

from app.repositories.layers import LayerRepository


@pytest.mark.parametrize(
    "identifier",
    ["reference.rmsp", "geometry;drop table", "UPPERCASE", 'name"'],
)
def test_catalog_identifiers_must_match_restricted_sql_pattern(identifier) -> None:
    with pytest.raises(ValueError):
        LayerRepository._validate_identifier(identifier)


@pytest.mark.parametrize(
    "identifier",
    ["reference", "rmsp_municipalities", "ibge_code", "geometry"],
)
def test_catalog_identifiers_accept_expected_names(identifier) -> None:
    LayerRepository._validate_identifier(identifier)
