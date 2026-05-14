"""Optional CORS and trusted-host middleware."""

from __future__ import annotations

from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware

import src.config as app_config


def install_security_middleware(app: FastAPI) -> None:
    """
    Registers optional trusted hosts, then CORS (CORS runs first on the request).

    FastAPI/Starlette runs the **last** ``add_middleware`` first on the request,
    so we add CORS first and trusted hosts last (host check runs first).

    Args:
        app (FastAPI): Application instance.

    Returns:
        None: This function only mutates ``app``.
    """

    cors = app_config.settings.cors_allow_origins
    if cors:
        allow_all = cors == ("*",)
        app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"] if allow_all else list(cors),
            allow_credentials=not allow_all,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    trusted = app_config.settings.trusted_hosts
    if trusted:
        app.add_middleware(TrustedHostMiddleware, allowed_hosts=list(trusted))
