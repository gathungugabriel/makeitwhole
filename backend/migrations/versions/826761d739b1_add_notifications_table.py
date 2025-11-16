"""add notifications table

Revision ID: 826761d739b1
Revises: 0d81d069795a
Create Date: 2025-11-13 15:11:44.472935
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision: str = '826761d739b1'
down_revision: Union[str, Sequence[str], None] = '0d81d069795a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    bind = op.get_bind()
    inspector = inspect(bind)

    # --- Create notifications table if it doesn't already exist ---
    if 'notifications' not in inspector.get_table_names():
        op.create_table(
            'notifications',
            sa.Column('id', sa.Integer(), primary_key=True),
            sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
            sa.Column('product_id', sa.Integer(), sa.ForeignKey('products.id', ondelete='CASCADE'), nullable=True),
            sa.Column('message', sa.String(length=255), nullable=False),
            sa.Column('is_read', sa.Boolean(), nullable=True),
            sa.Column('date_created', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        )
        op.create_index(op.f('ix_notifications_id'), 'notifications', ['id'], unique=False)

    # --- Safely alter users.provider column ---
    op.alter_column('users', 'provider',
                    existing_type=sa.VARCHAR(length=50),
                    nullable=True)
