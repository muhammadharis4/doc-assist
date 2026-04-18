"""Logging setup helpers."""

from __future__ import annotations

import logging


LOG_FORMAT = "%(asctime)s %(levelname)s %(name)s %(message)s"


def setup_logging() -> None:
    """
    Configures global logging once for the app.

    Returns:
        None: This function only configures process logging.
    """

    logging.basicConfig(level=logging.INFO, format=LOG_FORMAT)
