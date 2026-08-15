"""Create the layer catalog and the first reference dataset.

Revision ID: 20260815_0001
Revises:
Create Date: 2026-08-15
"""

import json
from collections.abc import Sequence
from pathlib import Path

import sqlalchemy as sa
from alembic import op

revision: str = "20260815_0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

DATA_FILE = Path(__file__).parent.parent / "data" / "ibge_rmsp_municipalities.geojson"


def upgrade() -> None:
    op.execute("CREATE SCHEMA core")
    op.execute("CREATE SCHEMA reference")
    op.execute(
        """
        CREATE TABLE core.layers (
            id text PRIMARY KEY,
            name text NOT NULL,
            description text NOT NULL,
            source_schema text NOT NULL,
            source_table text NOT NULL,
            geometry_column text NOT NULL,
            geometry_type text NOT NULL,
            feature_id_column text NOT NULL,
            fields jsonb NOT NULL,
            style jsonb NOT NULL,
            attribution text NOT NULL,
            source_url text NOT NULL,
            license_name text NOT NULL,
            license_url text NOT NULL,
            default_visible boolean NOT NULL DEFAULT true,
            feature_limit integer NOT NULL CHECK (feature_limit BETWEEN 1 AND 10000),
            created_at timestamptz NOT NULL DEFAULT now()
        )
        """
    )
    op.execute(
        """
        CREATE TABLE reference.rmsp_municipalities (
            ibge_code text PRIMARY KEY,
            name text NOT NULL,
            state_code text NOT NULL CHECK (char_length(state_code) = 2),
            geometry geometry(MultiPolygon, 4326) NOT NULL
        )
        """
    )
    op.execute(
        """
        CREATE INDEX rmsp_municipalities_geometry_gix
        ON reference.rmsp_municipalities
        USING gist (geometry)
        """
    )

    connection = op.get_bind()
    dataset = json.loads(DATA_FILE.read_text(encoding="utf-8"))
    insert_feature = sa.text(
        """
        INSERT INTO reference.rmsp_municipalities (
            ibge_code,
            name,
            state_code,
            geometry
        ) VALUES (
            :ibge_code,
            :name,
            :state_code,
            ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON(:geometry), 4326))
        )
        """
    )
    for feature in dataset["features"]:
        connection.execute(
            insert_feature,
            {
                **feature["properties"],
                "geometry": json.dumps(feature["geometry"], separators=(",", ":")),
            },
        )

    connection.execute(
        sa.text(
            """
            INSERT INTO core.layers (
                id,
                name,
                description,
                source_schema,
                source_table,
                geometry_column,
                geometry_type,
                feature_id_column,
                fields,
                style,
                attribution,
                source_url,
                license_name,
                license_url,
                default_visible,
                feature_limit
            ) VALUES (
                'ibge-rmsp-municipalities',
                'Municípios da RMSP',
                'Limites dos 39 municípios da Região Metropolitana de São Paulo.',
                'reference',
                'rmsp_municipalities',
                'geometry',
                'MultiPolygon',
                'ibge_code',
                CAST(:fields AS jsonb),
                CAST(:style AS jsonb),
                'Fonte: IBGE — Malhas Geográficas v3 e Localidades v1',
                'https://servicodados.ibge.gov.br/api/docs/malhas?versao=3',
                'Dados abertos do IBGE, com atribuição da fonte',
                'https://loja.ibge.gov.br/manual-tecnico-em-geociencias-acesso-e-uso-de-dados-geoespaciais.html',
                true,
                50
            )
            """
        ),
        {
            "fields": json.dumps(
                [
                    {"name": "name", "label": "Município", "type": "string"},
                    {"name": "ibge_code", "label": "Código IBGE", "type": "string"},
                    {"name": "state_code", "label": "UF", "type": "string"},
                ]
            ),
            "style": json.dumps(
                {
                    "fillColor": "#175CD3",
                    "fillOpacity": 0.24,
                    "lineColor": "#175CD3",
                    "lineWidth": 1.4,
                    "selectedFillColor": "#F79009",
                    "selectedLineColor": "#B54708",
                    "selectedLineWidth": 3,
                }
            ),
        },
    )


def downgrade() -> None:
    op.execute("DROP SCHEMA reference CASCADE")
    op.execute("DROP SCHEMA core CASCADE")
