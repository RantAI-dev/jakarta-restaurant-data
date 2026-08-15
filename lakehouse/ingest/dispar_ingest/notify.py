"""Notifikasi/alerting sederhana — webhook OpenAI-agnostic (Slack/Discord/generic).

Base lakehouse tanpa alerting = kegagalan pipeline jam 2 pagi tak diketahui.
Modul ini mengirim pesan ke webhook yang di-set via env ALERT_WEBHOOK_URL.
Format auto-deteksi: URL Slack/Discord pakai field yang benar; lainnya kirim
JSON generic {text}. Kalau env kosong → hanya log (tidak error).
"""

from __future__ import annotations

import json
import os
import urllib.request


def notify(text: str, level: str = "info") -> bool:
    """Kirim pesan ke webhook alert. Return True bila terkirim."""
    url = os.environ.get("ALERT_WEBHOOK_URL", "").strip()
    prefix = {"info": "ℹ️", "warn": "⚠️", "error": "🔴"}.get(level, "")
    msg = f"{prefix} [Lakehouse Dispar] {text}"
    if not url:
        print(f"[notify:{level}] {text} (ALERT_WEBHOOK_URL belum di-set)", flush=True)
        return False

    if "discord.com/api/webhooks" in url:
        payload = {"content": msg}
    elif "hooks.slack.com" in url:
        payload = {"text": msg}
    else:
        payload = {"text": msg, "level": level}

    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode(),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        urllib.request.urlopen(req, timeout=10)
        print(f"[notify:{level}] terkirim: {text}", flush=True)
        return True
    except Exception as e:  # noqa: BLE001 — alert gagal tak boleh menggagalkan pipeline
        print(f"[notify:{level}] GAGAL kirim webhook: {e}", flush=True)
        return False


if __name__ == "__main__":
    import sys
    notify(sys.argv[1] if len(sys.argv) > 1 else "uji notifikasi", "info")
