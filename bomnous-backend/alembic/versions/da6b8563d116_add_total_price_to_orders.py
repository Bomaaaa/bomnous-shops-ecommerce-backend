"""add total_price to orders

Revision ID: da6b8563d116
Revises: 3cba57c8623a
Create Date: 2026-02-13 14:24:30.485018

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'da6b8563d116'
down_revision: Union[str, Sequence[str], None] = '3cba57c8623a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "orders",
        sa.Column("total_price", sa.Float(), nullable=False, server_default="0.0")
    )


def downgrade() -> None:
   op.drop_column("orders", "total_price")


