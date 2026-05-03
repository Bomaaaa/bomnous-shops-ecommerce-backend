"""initial schema: users, shops, products, orders, order_items (matches app.models)

Revision ID: bomnous_2026_001
Revises: None
Create Date: 2026-04-25

Replaces the previous broken migration chain (empty first revision + ALTERs on
missing tables). This revision creates the full current schema in dependency order.
Downgrade drops tables in reverse order (use only on throwaway / dev DBs with data you can lose).
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "bomnous_2026_001"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("username", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("hashed_password", sa.String(), nullable=False),
        sa.Column("role", sa.String(), nullable=False, server_default=sa.text("'buyer'")),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_username", "users", ["username"], unique=True)
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "shops",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("location", sa.String(), nullable=False),
        sa.Column("owner_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(
            ["owner_id"],
            ["users.id"],
            name="fk_shops_owner_id_users",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_shops_name", "shops", ["name"], unique=False)

    op.create_table(
        "products",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("price", sa.Float(), nullable=False),
        sa.Column("stock", sa.Integer(), nullable=True, server_default="0"),
        sa.Column("category", sa.String(), nullable=False, server_default="women"),
        sa.Column("tag", sa.String(), nullable=False, server_default="trending"),
        sa.Column("image_url", sa.String(), nullable=False, server_default="image/product-1-1.jpg"),
        sa.Column("image_hover_url", sa.String(), nullable=True),
        sa.Column("compare_at_price", sa.Float(), nullable=True),
        sa.Column("aesthetic_tag", sa.String(), nullable=False, server_default="soft-luxury"),
        sa.Column("shop_id", sa.Integer(), nullable=False),
        sa.Column("seller_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(
            ["shop_id"],
            ["shops.id"],
            name="fk_products_shop_id_shops",
        ),
        sa.ForeignKeyConstraint(
            ["seller_id"],
            ["users.id"],
            name="fk_products_seller_id_users",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_products_name", "products", ["name"], unique=False)
    op.create_index("ix_products_category", "products", ["category"], unique=False)
    op.create_index("ix_products_tag", "products", ["tag"], unique=False)
    op.create_index("ix_products_aesthetic_tag", "products", ["aesthetic_tag"], unique=False)

    op.execute("ALTER TABLE products ALTER COLUMN category DROP DEFAULT")
    op.execute("ALTER TABLE products ALTER COLUMN tag DROP DEFAULT")
    op.execute("ALTER TABLE products ALTER COLUMN image_url DROP DEFAULT")
    op.execute("ALTER TABLE products ALTER COLUMN aesthetic_tag DROP DEFAULT")

    op.create_table(
        "orders",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(), nullable=True, server_default="pending"),
        sa.Column("total_price", sa.Float(), nullable=False, server_default=sa.text("0.0")),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            name="fk_orders_user_id_users",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.execute("ALTER TABLE orders ALTER COLUMN status DROP DEFAULT")

    op.create_table(
        "order_items",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("order_id", sa.Integer(), nullable=False),
        sa.Column("product_id", sa.Integer(), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=True, server_default="1"),
        sa.ForeignKeyConstraint(
            ["order_id"],
            ["orders.id"],
            name="fk_order_items_order_id_orders",
        ),
        sa.ForeignKeyConstraint(
            ["product_id"],
            ["products.id"],
            name="fk_order_items_product_id_products",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.execute("ALTER TABLE order_items ALTER COLUMN quantity DROP DEFAULT")


def downgrade() -> None:
    op.drop_table("order_items")
    op.drop_table("orders")
    op.drop_index("ix_products_aesthetic_tag", table_name="products")
    op.drop_index("ix_products_tag", table_name="products")
    op.drop_index("ix_products_category", table_name="products")
    op.drop_index("ix_products_name", table_name="products")
    op.drop_table("products")
    op.drop_index("ix_shops_name", table_name="shops")
    op.drop_table("shops")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_index("ix_users_username", table_name="users")
    op.drop_table("users")
