"""
Database Module (Legacy)

This module is kept for backwards compatibility with SQLAlchemy models.
The actual database operations are now handled via Supabase API.

NOTE: This module is NOT actively used. All database operations
go through supabase_client.py instead.
"""
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """
    Base class for SQLAlchemy models.
    
    This is only used for model definitions which serve as documentation
    of the database schema. Actual DB operations use Supabase API.
    """
    pass


# These functions are kept for potential future use or migrations
async def get_db():
    """
    Legacy database session generator.
    NOT USED - all operations go through Supabase API.
    """
    raise NotImplementedError(
        "Direct database access is disabled. "
        "Use supabase_client.get_supabase() instead."
    )


async def init_db():
    """
    Legacy database initialization.
    NOT USED - tables are managed in Supabase dashboard.
    """
    raise NotImplementedError(
        "Direct database initialization is disabled. "
        "Manage tables in Supabase dashboard."
    )
