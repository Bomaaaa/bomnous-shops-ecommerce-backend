"""make owner_id non nullable

Revision ID: b9320bc3d1bb
Revises: eaada90ebed0
Create Date: 2026-02-16 04:13:23.892331

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b9320bc3d1bb'
down_revision: Union[str, Sequence[str], None] = 'eaada90ebed0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
