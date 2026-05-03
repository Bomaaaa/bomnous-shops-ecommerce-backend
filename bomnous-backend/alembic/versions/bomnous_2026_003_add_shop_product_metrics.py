"""add created_at + views_count for trending/new

Revision ID: bomnous_2026_003
Revises: bomnous_2026_002
Create Date: 2026-04-25

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "bomnous_2026_003"
down_revision: Union[str, Sequence[str], None] = "bomnous_2026_002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("shops", sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False))
    op.add_column("products", sa.Column("views_count", sa.Integer(), server_default="0", nullable=False))
    op.add_column("products", sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False))


def downgrade() -> None:
    op.drop_column("products", "created_at")
    op.drop_column("products", "views_count")
    op.drop_column("shops", "created_at")

