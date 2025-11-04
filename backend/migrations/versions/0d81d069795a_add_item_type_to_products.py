from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0d81d069795a'
down_revision = '5d6ab53def05'
branch_labels = None
depends_on = None


def upgrade():
    # Step 1: Add column as nullable first
    op.add_column('products', sa.Column('item_type', sa.String(length=10), nullable=True))

    # Step 2: Update existing rows with default 'have'
    op.execute("UPDATE products SET item_type = 'have'")

    # Step 3: Alter column to be non-nullable
    op.alter_column('products', 'item_type', nullable=False)


def downgrade():
    op.drop_column('products', 'item_type')
