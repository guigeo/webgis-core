"""Add generic layer presentation metadata and a point reference layer.

Revision ID: 20260815_0002
Revises: 20260815_0001
Create Date: 2026-08-15
"""

import json
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260815_0002"
down_revision: str | None = "20260815_0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

POLYGON_FIELDS = [
    {"name": "name", "label": "Município", "type": "string", "popup": "title"},
    {"name": "ibge_code", "label": "Código IBGE", "type": "string", "popup": "detail"},
    {"name": "state_code", "label": "UF", "type": "string", "popup": "detail"},
]


def upgrade() -> None:
    op.add_column(
        "layers",
        sa.Column("group_name", sa.Text(), nullable=False, server_default="Referência territorial"),
        schema="core",
    )
    op.add_column(
        "layers",
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        schema="core",
    )
    op.add_column(
        "layers",
        sa.Column("default_opacity", sa.Numeric(3, 2), nullable=False, server_default="1"),
        schema="core",
    )
    op.add_column(
        "layers",
        sa.Column(
            "metadata",
            postgresql.JSONB(),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
        schema="core",
    )
    op.create_check_constraint(
        "layers_default_opacity_range",
        "layers",
        "default_opacity >= 0 AND default_opacity <= 1",
        schema="core",
    )

    connection = op.get_bind()
    connection.execute(
        sa.text(
            """
            UPDATE core.layers
            SET group_name = 'Referência territorial',
                sort_order = 10,
                fields = CAST(:fields AS jsonb),
                style = style || '{"kind": "fill"}'::jsonb,
                metadata = CAST(:metadata AS jsonb)
            WHERE id = 'ibge-rmsp-municipalities'
            """
        ),
        {
            "fields": json.dumps(POLYGON_FIELDS),
            "metadata": json.dumps(
                {
                    "summary": "Limites municipais oficiais simplificados para uso web.",
                    "updatedAt": "2026-08-15",
                    "featureCount": 39,
                }
            ),
        },
    )

    op.execute(
        """
        CREATE TABLE reference.rmsp_municipality_points (
            ibge_code text PRIMARY KEY,
            name text NOT NULL,
            state_code text NOT NULL CHECK (char_length(state_code) = 2),
            geometry geometry(Point, 4326) NOT NULL
        )
        """
    )
    op.execute(
        """
        INSERT INTO reference.rmsp_municipality_points (
            ibge_code,
            name,
            state_code,
            geometry
        )
        SELECT ibge_code,
               name,
               state_code,
               ST_PointOnSurface(geometry)::geometry(Point, 4326)
        FROM reference.rmsp_municipalities
        """
    )
    op.execute(
        """
        CREATE INDEX rmsp_municipality_points_geometry_gix
        ON reference.rmsp_municipality_points
        USING gist (geometry)
        """
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
                feature_limit,
                group_name,
                sort_order,
                default_opacity,
                metadata
            ) VALUES (
                'ibge-rmsp-municipality-points',
                'Pontos municipais da RMSP',
                'Pontos representativos calculados no interior dos limites municipais.',
                'reference',
                'rmsp_municipality_points',
                'geometry',
                'Point',
                'ibge_code',
                CAST(:fields AS jsonb),
                CAST(:style AS jsonb),
                'Derivado de IBGE — Malhas Geográficas v3 e Localidades v1',
                'https://servicodados.ibge.gov.br/api/docs/malhas?versao=3',
                'Dados abertos do IBGE, com atribuição da fonte',
                'https://loja.ibge.gov.br/manual-tecnico-em-geociencias-acesso-e-uso-de-dados-geoespaciais.html',
                true,
                50,
                'Referência territorial',
                5,
                1,
                CAST(:metadata AS jsonb)
            )
            """
        ),
        {
            "fields": json.dumps(POLYGON_FIELDS),
            "style": json.dumps(
                {
                    "kind": "circle",
                    "circleColor": "#0E9384",
                    "circleRadius": 5,
                    "strokeColor": "#FFFFFF",
                    "strokeWidth": 1.5,
                    "selectedColor": "#F79009",
                    "selectedRadius": 9,
                    "selectedStrokeColor": "#B54708",
                    "selectedStrokeWidth": 2,
                }
            ),
            "metadata": json.dumps(
                {
                    "summary": "Pontos derivados com ST_PointOnSurface dos limites municipais.",
                    "updatedAt": "2026-08-15",
                    "featureCount": 39,
                }
            ),
        },
    )

    op.alter_column("layers", "group_name", server_default=None, schema="core")
    op.alter_column("layers", "sort_order", server_default=None, schema="core")


def downgrade() -> None:
    op.execute("DELETE FROM core.layers WHERE id = 'ibge-rmsp-municipality-points'")
    op.execute("DROP TABLE reference.rmsp_municipality_points")
    op.execute(
        """
        UPDATE core.layers
        SET fields = '[
            {"name": "name", "label": "Município", "type": "string"},
            {"name": "ibge_code", "label": "Código IBGE", "type": "string"},
            {"name": "state_code", "label": "UF", "type": "string"}
        ]'::jsonb,
            style = style - 'kind'
        WHERE id = 'ibge-rmsp-municipalities'
        """
    )
    op.drop_constraint("layers_default_opacity_range", "layers", schema="core")
    op.drop_column("layers", "metadata", schema="core")
    op.drop_column("layers", "default_opacity", schema="core")
    op.drop_column("layers", "sort_order", schema="core")
    op.drop_column("layers", "group_name", schema="core")
