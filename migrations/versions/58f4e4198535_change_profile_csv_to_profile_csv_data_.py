"""Change profile_csv to profile_csv_data for direct storage

Revision ID: 58f4e4198535
Revises: 2468be13d345
Create Date: 2025-05-11 11:32:14.720239

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '58f4e4198535'
down_revision = '2468be13d345'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('dives', schema=None) as batch_op:
        batch_op.add_column(sa.Column('profile_csv_data', sa.Text(), nullable=True))
        batch_op.drop_column('profile_csv')

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('dives', schema=None) as batch_op:
        batch_op.add_column(sa.Column('profile_csv', sa.VARCHAR(length=255), nullable=True))
        batch_op.drop_column('profile_csv_data')

    # ### end Alembic commands ###
