"""add shop profile fields (description, contact, categories)

Revision ID: bomnous_2026_002
Revises: bomnous_2026_001
Create Date: 2026-04-24

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "bomnous_2026_002"
down_revision: Union[str, Sequence[str], None] = "bomnous_2026_001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("shops", sa.Column("description", sa.Text(), nullable=True))
    op.add_column("shops", sa.Column("whatsapp", sa.String(), nullable=True))
    op.add_column("shops", sa.Column("phone", sa.String(), nullable=True))
    op.add_column("shops", sa.Column("categories", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("shops", "categories")
    op.drop_column("shops", "phone")
    op.drop_column("shops", "whatsapp")
    op.drop_column("shops", "description")

