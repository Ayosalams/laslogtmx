#!/usr/bin/env python3
"""Push Supabase keep-alive credentials to GitHub Actions secrets.

Reads NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY from
.env.local (or .env.example fallback). Never prints secret values.

Requires: GITHUB_PERSONAL_ACCESS_TOKEN (repo scope) in environment.
"""

from __future__ import annotations

import base64
import json
import os
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

REPO = "Ayosalams/laslogtmx"
API = "https://api.github.com"


def load_dotenv(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    if not path.exists():
        return values
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        key = key.strip()
        val = val.strip().strip('"').strip("'")
        if key:
            values[key] = val
    return values


def encrypt_secret(public_key_b64: str, secret_value: str) -> str:
    try:
        from nacl import encoding, public
    except ImportError as exc:
        raise SystemExit(
            "PyNaCl is required. Install with: python -m pip install pynacl"
        ) from exc

    public_key = public.PublicKey(public_key_b64.encode("utf-8"), encoding.Base64Encoder())
    sealed = public.SealedBox(public_key).encrypt(secret_value.encode("utf-8"))
    return base64.b64encode(sealed).decode("utf-8")


def github_request(
    method: str,
    path: str,
    token: str,
    payload: dict | None = None,
) -> dict:
    url = f"{API}{path}"
    data = None
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "laslogtmx-keepalive-setup",
    }
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = resp.read().decode("utf-8")
            return json.loads(body) if body else {}
    except urllib.error.HTTPError as err:
        detail = err.read().decode("utf-8", errors="replace")
        raise SystemExit(f"GitHub API {method} {path} failed ({err.code}): {detail}") from err


def upsert_secret(token: str, name: str, value: str) -> None:
    key_info = github_request("GET", f"/repos/{REPO}/actions/secrets/public-key", token)
    encrypted = encrypt_secret(key_info["key"], value)
    github_request(
        "PUT",
        f"/repos/{REPO}/actions/secrets/{name}",
        token,
        {
            "encrypted_value": encrypted,
            "key_id": key_info["key_id"],
        },
    )
    print(f"Set GitHub secret: {name}")


def main() -> int:
    token = os.environ.get("GITHUB_PERSONAL_ACCESS_TOKEN", "").strip()
    if not token:
        raise SystemExit("GITHUB_PERSONAL_ACCESS_TOKEN is not set.")

    root = Path(__file__).resolve().parents[2]
    env = load_dotenv(root / ".env.local")
    if not env:
        env = load_dotenv(root / ".env.example")

    url = env.get("NEXT_PUBLIC_SUPABASE_URL", "").strip()
    anon = env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "").strip()

    if not url:
        raise SystemExit("NEXT_PUBLIC_SUPABASE_URL not found in .env.local or .env.example")
    if not anon:
        raise SystemExit("NEXT_PUBLIC_SUPABASE_ANON_KEY not found in .env.local or .env.example")

    if not re.match(r"^https://[a-z0-9-]+\.supabase\.co/?$", url, re.I):
        raise SystemExit("NEXT_PUBLIC_SUPABASE_URL format looks invalid.")

    url = url.rstrip("/")

    # Canonical secret names used by the workflow.
    upsert_secret(token, "SUPABASE_URL", url)
    upsert_secret(token, "SUPABASE_ANON_KEY", anon)

    print("Done. Re-run Actions → Supabase Keep-Alive to verify.")
    return 0


if __name__ == "__main__":
    sys.exit(main())