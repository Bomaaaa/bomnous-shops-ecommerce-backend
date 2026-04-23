"""add aesthetic_tag to products

Revision ID: a7b8c9d0e1f2
Revises: f1a2b3c4d5e6
Create Date: 2026-04-19

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a7b8c9d0e1f2"
down_revision: Union[str, Sequence[str], None] = "f1a2b3c4d5e6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "products",
        sa.Column("aesthetic_tag", sa.String(), nullable=False, server_default="soft-luxury"),
    )
    op.create_index("ix_products_aesthetic_tag", "products", ["aesthetic_tag"])
    op.execute("ALTER TABLE products ALTER COLUMN aesthetic_tag DROP DEFAULT")


def downgrade() -> None:
    op.drop_index("ix_products_aesthetic_tag", table_name="products")
    op.drop_column("products", "aesthetic_tag")
