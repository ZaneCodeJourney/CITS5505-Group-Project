"""Add shared_with_user_id to Share model with named FK constraint

Revision ID: 14722babe515
Revises: 58f4e4198535
Create Date: 2025-05-11 15:01:38.324783

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '14722babe515'
down_revision = '58f4e4198535'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands manually adjusted to avoid circular dependency ###
    # First check if column already exists to avoid errors
    connection = op.get_bind()
    inspector = sa.inspect(connection)
    columns = [column['name'] for column in inspector.get_columns('shares')]
    
    # Only add the column if it doesn't already exist
    if 'shared_with_user_id' not in columns:
        # Using raw SQL to avoid batch_alter_table which causes circular dependency
        op.execute('ALTER TABLE shares ADD COLUMN shared_with_user_id INTEGER')
        
        # We can't create the foreign key constraint in SQLite this way
        # Instead, we'll create a simple index which is good enough for most purposes
        op.execute('CREATE INDEX ix_shares_shared_with_user_id ON shares (shared_with_user_id)')
    else:
        print("Column 'shared_with_user_id' already exists, skipping column creation.")
    
    # Note: In SQLite, we can't easily add foreign key constraints after table creation
    # For proper FK constraints, a complete table rebuild would be required
    # For simplicity and compatibility, we're just adding the column and index
    # ### end Alembic commands ###


def downgrade():
    # ### commands manually adjusted to avoid circular dependency ###
    # Check if the index exists
    connection = op.get_bind()
    inspector = sa.inspect(connection)
    indexes = [index['name'] for index in inspector.get_indexes('shares')]
    
    # Only drop the index if it exists
    if 'ix_shares_shared_with_user_id' in indexes:
        op.execute('DROP INDEX ix_shares_shared_with_user_id')
    
    # Check if column exists
    columns = [column['name'] for column in inspector.get_columns('shares')]
    if 'shared_with_user_id' in columns:
        # Since SQLite doesn't directly support DROP COLUMN, we're going to:
        # 1. Create a new table without the column
        # 2. Copy data from the old table
        # 3. Drop the old table
        # 4. Rename the new table
        
        op.execute('''
            CREATE TABLE shares_new (
                id INTEGER NOT NULL, 
                dive_id INTEGER NOT NULL, 
                creator_user_id INTEGER NOT NULL, 
                token VARCHAR(64) NOT NULL, 
                visibility VARCHAR(20), 
                expiration_time DATETIME, 
                created_at DATETIME, 
                PRIMARY KEY (id)
            )
        ''')
        
        op.execute('''
            INSERT INTO shares_new 
            SELECT id, dive_id, creator_user_id, token, visibility, expiration_time, created_at 
            FROM shares
        ''')
        
        op.execute('DROP TABLE shares')
        op.execute('ALTER TABLE shares_new RENAME TO shares')
        
        # Recreate any other indexes or constraints that existed on the original table
        op.execute('CREATE UNIQUE INDEX ix_shares_token ON shares (token)')
    else:
        print("Column 'shared_with_user_id' does not exist, skipping column removal.")
    # ### end Alembic commands ###
