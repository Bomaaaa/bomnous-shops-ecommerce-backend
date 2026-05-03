"""add user profile fields (full_name, phone, city, bio, profile_picture)

Revision ID: bomnous_2026_004
Revises: bomnous_2026_003
Create Date: 2026-04-28

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "bomnous_2026_004"
down_revision: Union[str, Sequence[str], None] = "bomnous_2026_003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("full_name", sa.String(), nullable=True))
    op.add_column("users", sa.Column("phone", sa.String(), nullable=True))
    op.add_column("users", sa.Column("city", sa.String(), nullable=True))
    op.add_column("users", sa.Column("bio", sa.Text(), nullable=True))
    op.add_column("users", sa.Column("profile_picture", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "profile_picture")
    op.drop_column("users", "bio")
    op.drop_column("users", "city")
    op.drop_column("users", "phone")
    op.drop_column("users", "full_name")
