"""Add profile_csv field to Dive model

Revision ID: 2468be13d345
Revises: 1f3dc88d3839
Create Date: 2025-05-11 11:25:41.275197

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '2468be13d345'
down_revision = '1f3dc88d3839'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('dives', schema=None) as batch_op:
        batch_op.add_column(sa.Column('profile_csv', sa.String(length=255), nullable=True))

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('dives', schema=None) as batch_op:
        batch_op.drop_column('profile_csv')

    # ### end Alembic commands ###
