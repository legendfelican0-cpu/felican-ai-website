#!/usr/bin/env python3
"""Upsert the Felican website voice assistant in Vapi.

The assistant uses the same ElevenLabs Jessica voice and continuous Vapi call
behavior as the COPS website, while every answer comes from Felican's own
server-side knowledge endpoint. Secrets stay in server environment files.
"""
from __future__ import annotations

import argparse
import json
import logging
import os
from pathlib import Path
import re
import secrets
import tempfile
import urllib.error
import urllib.request

API = "https://api.vapi.ai"
ASSISTANT_NAME = "Felican AI Website Voice"
DEFAULT_PUBLIC_KEY = "beddc27b-a24b-4864-873a-ae22c1234e14"
LOG = logging.getLogger("felican-vapi")


def parse_env(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    if not path.exists():
        return values
    for line in path.read_text().splitlines():
        match = re.match(r"^([A-Za-z_][A-Za-z0-9_]*)=(.*)$", line.strip())
        if match:
            values[match.group(1)] = match.group(2).strip().strip('"').strip("'")
    return values


def update_env(path: Path, updates: dict[str, str]) -> None:
    """Atomically update only named keys while preserving unrelated config."""
    lines = path.read_text().splitlines() if path.exists() else []
    remaining = dict(updates)
    output: list[str] = []
    for line in lines:
        match = re.match(r"^([A-Za-z_][A-Za-z0-9_]*)=", line.strip())
        if match and match.group(1) in remaining:
            key = match.group(1)
            output.append(f"{key}={remaining.pop(key)}")
        else:
            output.append(line)
    output.extend(f"{key}={value}" for key, value in remaining.items())
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile("w", dir=path.parent, delete=False) as handle:
        handle.write("\n".join(output).rstrip() + "\n")
        temp_path = Path(handle.name)
    os.chmod(temp_path, 0o600)
    os.replace(temp_path, path)


def api(method: str, route: str, key: str, body: dict | None = None) -> dict | list:
    url = f"{API}{route}"
    if not url.startswith(f"{API}/"):
        raise ValueError("refusing non-Vapi URL")
    request = urllib.request.Request(
        url,
        method=method,
        headers={
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "User-Agent": "felican-site-provisioner/1.0",
        },
        data=json.dumps(body).encode() if body is not None else None,
    )
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            raw = response.read().decode()
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as error:
        detail = error.read().decode()[:700]
        raise RuntimeError(f"{method} {route} returned HTTP {error.code}: {detail}") from error


def assistant_payload(public_url: str, webhook_secret: str) -> dict:
    return {
        "name": ASSISTANT_NAME,
        # COPS initializes the browser audio path with a first turn. A short
        # silent clip does the same without greeting or prompting the visitor.
        "firstMessage": f"{public_url.rstrip('/')}/voice-ready.wav",
        "firstMessageMode": "assistant-speaks-first",
        "firstMessageInterruptionsEnabled": False,
        # Match the proven COPS browser voice path exactly: omit browser
        # worklet denoisers instead of sending a disabled plan.
        "backgroundSpeechDenoisingPlan": None,
        "backgroundDenoisingEnabled": None,
        "model": {
            "provider": "custom-llm",
            "url": f"{public_url.rstrip('/')}/v1",
            "model": "felican-voice",
            "headers": {"x-vapi-secret": webhook_secret},
            "messages": [{
                "role": "system",
                "content": (
                    "You are the Felican AI website voice assistant. The Felican "
                    "gateway supplies the current business knowledge on every turn. "
                    "Felican is pronounced FELL-ih-can. Never call the company Falcon."
                ),
            }],
        },
        "voice": {
            "provider": "11labs",
            "voiceId": "cgSgspJ2msm6clMCkdW9",
            "model": "eleven_turbo_v2_5",
            "stability": 0.5,
            "similarityBoost": 0.8,
            "style": 0.35,
            "useSpeakerBoost": True,
            "speed": 1.0,
            "chunkPlan": {
                "formatPlan": {
                    "replacements": [{
                        "type": "exact",
                        "key": "Felican",
                        "value": "Fell-ih-can",
                        "replaceAllEnabled": True,
                    }],
                },
            },
        },
        "transcriber": {
            "provider": "deepgram",
            "model": "nova-3",
            "language": "en",
            "fallbackPlan": {"autoFallback": {"enabled": True}},
        },
        "clientMessages": [
            "conversation-update", "function-call", "hang", "model-output",
            "speech-update", "status-update", "transfer-update", "transcript",
            "tool-calls", "user-interrupted", "voice-input",
            "workflow.node.started", "assistant.started", "assistant.speechStarted",
        ],
        "startSpeakingPlan": {"waitSeconds": 0.4},
        "endCallFunctionEnabled": False,
        "silenceTimeoutSeconds": 30,
        "maxDurationSeconds": 1800,
        "recordingEnabled": False,
        "metadata": {"product": "felican-website", "role": "browser-voice"},
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--private-env", default="/etc/felican/cops-voice.env")
    parser.add_argument("--site-env", default="/opt/felicanai-site/config/ai.env")
    parser.add_argument("--public-url", default="https://felican.dev")
    parser.add_argument("--public-key", default=DEFAULT_PUBLIC_KEY)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO, format="%(levelname)-7s %(message)s")

    private_env = parse_env(Path(args.private_env))
    site_path = Path(args.site_env)
    site_env = parse_env(site_path)
    private_key = (
        os.environ.get("COPS_VAPI_API_KEY")
        or private_env.get("COPS_VAPI_API_KEY")
        or private_env.get("FINAFLEX_VAPI_API_KEY")
        or private_env.get("VAPI_API_KEY")
    )
    if not private_key:
        raise SystemExit("Vapi private API key was not found in the approved server environment")
    webhook_secret = site_env.get("FELICAN_VAPI_WEBHOOK_SECRET") or secrets.token_urlsafe(32)

    assistants = api("GET", "/assistant", private_key)
    if not isinstance(assistants, list):
        raise RuntimeError("Vapi returned an unexpected assistant list")
    existing = next((item for item in assistants if item.get("name") == ASSISTANT_NAME), None)
    payload = assistant_payload(args.public_url, webhook_secret)
    if args.dry_run:
        LOG.info("would %s %s", "update" if existing else "create", ASSISTANT_NAME)
        return 0
    if existing:
        assistant_id = existing["id"]
        api("PATCH", f"/assistant/{assistant_id}", private_key, payload)
        LOG.info("updated Felican website voice assistant")
    else:
        created = api("POST", "/assistant", private_key, payload)
        if not isinstance(created, dict) or not created.get("id"):
            raise RuntimeError("Vapi did not return an assistant id")
        assistant_id = created["id"]
        LOG.info("created Felican website voice assistant")

    update_env(site_path, {
        "FELICAN_VAPI_PUBLIC_KEY": args.public_key,
        "FELICAN_VAPI_ASSISTANT_ID": assistant_id,
        "FELICAN_VAPI_WEBHOOK_SECRET": webhook_secret,
    })
    LOG.info("stored public voice identifiers and server-only secret in the Felican DEV environment")
    print(json.dumps({"assistantId": assistant_id, "configured": True}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
