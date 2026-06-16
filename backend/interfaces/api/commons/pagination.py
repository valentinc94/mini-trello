"""
Pagination helpers shared across all API interfaces.
"""

from rest_framework.pagination import PageNumberPagination


class StandardPagination(PageNumberPagination):
    """
    Default pagination used across all list endpoints.

    Defaults to 20 items per page, configurable via the 'page_size'
    query parameter up to a maximum of 100.
    """

    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100
