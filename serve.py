#!/usr/bin/env python3
import base64
import json
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent
ALLOWED = {
    f"{unit}-{face}.png"
    for unit in ("c1", "c2", "c3")
    for face in (
        "front",
        "back",
        "left",
        "right",
        "sideLeft",
        "posterLeft",
        "posterRight",
        "quote0",
        "quote1",
        "xbanner",
    )
}


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        super().end_headers()

    def do_POST(self):
        if self.path != "/__save":
            self.send_error(404)
            return
        length = int(self.headers.get("Content-Length", 0))
        payload = json.loads(self.rfile.read(length))
        name = payload.get("name", "")
        if name not in ALLOWED:
            self.send_error(400, "bad name")
            return
        raw = base64.b64decode(payload["data"].split(",", 1)[1])
        (ROOT / "assets" / name).write_bytes(raw)
        self.send_response(204)
        self.end_headers()

    def log_message(self, fmt, *args):
        if args and str(args[0]).startswith("POST"):
            super().log_message(fmt, *args)


if __name__ == "__main__":
    ThreadingHTTPServer(("0.0.0.0", 8765), Handler).serve_forever()
