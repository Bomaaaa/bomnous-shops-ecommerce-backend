"""add product catalog fields (category, tag, images, compare_at_price)

Revision ID: f1a2b3c4d5e6
Revises: b9320bc3d1bb
Create Date: 2026-04-18

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f1a2b3c4d5e6"
down_revision: Union[str, Sequence[str], None] = "b9320bc3d1bb"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("products", sa.Column("category", sa.String(), nullable=False, server_default="women"))
    op.add_column("products", sa.Column("tag", sa.String(), nullable=False, server_default="trending"))
    op.add_column("products", sa.Column("image_url", sa.String(), nullable=False, server_default="image/product-1-1.jpg"))
    op.add_column("products", sa.Column("image_hover_url", sa.String(), nullable=True))
    op.add_column("products", sa.Column("compare_at_price", sa.Float(), nullable=True))
    op.execute("ALTER TABLE products ALTER COLUMN category DROP DEFAULT")
    op.execute("ALTER TABLE products ALTER COLUMN tag DROP DEFAULT")
    op.execute("ALTER TABLE products ALTER COLUMN image_url DROP DEFAULT")


def downgrade() -> None:
    op.drop_column("products", "compare_at_price")
    op.drop_column("products", "image_hover_url")
    op.drop_column("products", "image_url")
    op.drop_column("products", "tag")
    op.drop_column("products", "category")
