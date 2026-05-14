"""Per-IP rate limiting (SlowAPI). Disabled during pytest via ``DOCASSIST_TESTING``."""

from __future__ import annotations

import os

from slowapi import Limiter
from slowapi.util import get_remote_address

_testing = os.environ.get("DOCASSIST_TESTING", "").lower() in {"1", "true", "yes"}

limiter = Limiter(key_func=get_remote_address, enabled=not _testing)
