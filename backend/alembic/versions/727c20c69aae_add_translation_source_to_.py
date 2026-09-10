"""add translation_source to TranslationResult

Revision ID: 727c20c69aae
Revises: 951d4db40266
Create Date: 2026-09-01 23:04:54.186340

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '727c20c69aae'
down_revision: Union[str, Sequence[str], None] = '951d4db40266'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('translation_results', schema=None) as batch_op:
        batch_op.add_column(sa.Column('translation_source', sa.String(length=50), nullable=True, server_default="AI Translated"))

def downgrade() -> None:
    with op.batch_alter_table('translation_results', schema=None) as batch_op:
        batch_op.drop_column('translation_source')
