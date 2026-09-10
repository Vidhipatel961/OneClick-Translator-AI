"""update_projects_files_jobs

Revision ID: e060b8cefeb8
Revises: 
Create Date: 2026-09-01 22:14:54.136891

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e060b8cefeb8'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('files', schema=None) as batch_op:
        batch_op.alter_column('project_id',
               existing_type=sa.UUID(),
               nullable=True)

    with op.batch_alter_table('projects', schema=None) as batch_op:
        batch_op.add_column(sa.Column('description', sa.Text(), nullable=True))

    with op.batch_alter_table('translation_jobs', schema=None) as batch_op:
        batch_op.add_column(sa.Column('project_id', sa.UUID(), nullable=True))
        batch_op.create_index(batch_op.f('ix_translation_jobs_project_id'), ['project_id'], unique=False)
        batch_op.create_foreign_key('fk_translation_jobs_projects', 'projects', ['project_id'], ['id'])


def downgrade() -> None:
    with op.batch_alter_table('translation_jobs', schema=None) as batch_op:
        batch_op.drop_constraint('fk_translation_jobs_projects', type_='foreignkey')
        batch_op.drop_index(batch_op.f('ix_translation_jobs_project_id'))
        batch_op.drop_column('project_id')

    with op.batch_alter_table('projects', schema=None) as batch_op:
        batch_op.drop_column('description')

    with op.batch_alter_table('files', schema=None) as batch_op:
        batch_op.alter_column('project_id',
               existing_type=sa.UUID(),
               nullable=False)
