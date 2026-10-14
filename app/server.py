"""Two Euro Patrons - campaign server.

Serves the landing page, takes payments through Stripe Checkout, records
supporters from Stripe webhooks, runs an opt-in mailing list and exposes
public + private metrics.
"""
import os
import secrets
import sqlite3
import time
from contextlib import closing
from pathlib import Path

import stripe
from dotenv import load_dotenv
from flask import Flask, abort, jsonify, redirect, request, send_from_directory

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")

SITE_DIR = ROOT / "site"
DB_PATH = Path(os.getenv("DB_PATH", ROOT / "data" / "campaign.db"))
PUBLIC_URL = os.getenv("PUBLIC_URL", "http://localhost:8000").rstrip("/")
CURRENCY = os.getenv("CURRENCY", "eur")
BASE_AMOUNT_CENTS = int(os.getenv("BASE_AMOUNT_CENTS", "200"))
GOAL_SUPPORTERS = int(os.getenv("GOAL_SUPPORTERS", "1000000"))
DASHBOARD_KEY = os.getenv("DASHBOARD_KEY", "")
KOFI_URL = os.getenv("KOFI_URL", "")
ARTIST_NAME = os.getenv("ARTIST_NAME", "Appetite of the Mind")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")
stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "")

app = Flask(__name__, static_folder=None)


# --------------------------------------------------------------------- db
SCHEMA = """
CREATE TABLE IF NOT EXISTS supporters (
    id INTEGER PRIMARY KEY,
    session_id TEXT UNIQUE,
    amount_cents INTEGER NOT NULL,
    currency TEXT NOT NULL,
    display_name TEXT,
    message TEXT,
    show_on_wall INTEGER DEFAULT 0,
    channel TEXT,
    country TEXT,
    created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS visits (
    id INTEGER PRIMARY KEY,
    channel TEXT,
    created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS checkouts (
    id INTEGER PRIMARY KEY,
    channel TEXT,
    created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS subscribers (
    id INTEGER PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    consent_text TEXT NOT NULL,
    consent_at INTEGER NOT NULL,
    channel TEXT,
    unsubscribe_token TEXT NOT NULL,
    unsubscribed_at INTEGER
);
"""


def db():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


with closing(db()) as _c:
    _c.executescript(SCHEMA)
    # Columns added after the first release; ignore if they already exist.
    for _ddl in ("ALTER TABLE supporters ADD COLUMN is_millionaire INTEGER DEFAULT 0",):
        try:
            _c.execute(_ddl)
        except sqlite3.OperationalError:
            pass


def clean_channel(value):
    value = (value or "direct").strip().lower()[:40]
    return "".join(ch for ch in value if ch.isalnum() or ch in "-_.") or "direct"


# ------------------------------------------------------------------ pages
@app.get("/")
def index():
    return send_from_directory(SITE_DIR, "index.html")


@app.get("/<path:name>")
def static_files(name):
    if name in ("dashboard", "dashboard.html"):
        abort(404)  # only reachable through /dashboard?key=...
    if "." not in name.rsplit("/", 1)[-1] and (SITE_DIR / f"{name}.html").is_file():
        name += ".html"  # clean URLs: /music -> music.html
    return send_from_directory(SITE_DIR, name)


@app.errorhandler(404)
def not_found(_):
    return send_from_directory(SITE_DIR, "404.html"), 404


@app.get("/dashboard")
def dashboard():
    if not DASHBOARD_KEY or request.args.get("key") != DASHBOARD_KEY:
        abort(403)
    return send_from_directory(SITE_DIR, "dashboard.html")


# ------------------------------------------------------------- public api
@app.get("/api/config")
def config():
    return jsonify(
        currency=CURRENCY,
        base_amount_cents=BASE_AMOUNT_CENTS,
        goal_supporters=GOAL_SUPPORTERS,
        stripe_enabled=bool(stripe.api_key),
        kofi_url=KOFI_URL,
    )


@app.get("/api/stats")
def stats():
    try:
        limit = min(500, max(0, int(request.args.get("wall", 60))))
    except ValueError:
        limit = 60
    with closing(db()) as c:
        row = c.execute(
            "SELECT COUNT(*) n, COALESCE(SUM(amount_cents),0) total, "
            "COUNT(DISTINCT NULLIF(country,'')) countries, COALESCE(SUM(is_millionaire),0) millionaires "
            "FROM supporters"
        ).fetchone()
        wall = c.execute(
            "SELECT display_name, message, country, is_millionaire, amount_cents, created_at FROM supporters "
            "WHERE show_on_wall=1 AND display_name != '' ORDER BY id DESC LIMIT ?", (limit,)
        ).fetchall()
    return jsonify(
        supporters=row["n"],
        total_cents=row["total"],
        countries=row["countries"],
        millionaires=row["millionaires"],
        goal_supporters=GOAL_SUPPORTERS,
        currency=CURRENCY,
        wall=[dict(r) for r in wall],
    )


@app.post("/api/visit")
def visit():
    channel = clean_channel((request.get_json(silent=True) or {}).get("channel"))
    with closing(db()) as c, c:
        c.execute("INSERT INTO visits(channel, created_at) VALUES (?,?)", (channel, int(time.time())))
    return "", 204


@app.post("/api/checkout")
def checkout():
    data = request.get_json(silent=True) or {}
    channel = clean_channel(data.get("channel"))
    if not stripe.api_key:
        if KOFI_URL:
            return jsonify(url=KOFI_URL)
        return jsonify(error="Payments are not configured yet."), 503

    try:
        amount = max(BASE_AMOUNT_CENTS, int(data.get("amount_cents") or BASE_AMOUNT_CENTS))
    except (TypeError, ValueError):
        amount = BASE_AMOUNT_CENTS
    amount = min(amount, 100_000)  # cap at 1000 to avoid typos
    name = str(data.get("display_name") or "")[:40].strip()
    message = str(data.get("message") or "")[:140].strip()
    show = "1" if data.get("show_on_wall") and name else "0"
    millionaire = "1" if data.get("is_millionaire") else "0"

    session = stripe.checkout.Session.create(
        mode="payment",
        line_items=[{
            "quantity": 1,
            "price_data": {
                "currency": CURRENCY,
                "unit_amount": amount,
                "product_data": {"name": f"{ARTIST_NAME}: support the album"},
            },
        }],
        metadata={"channel": channel, "display_name": name, "message": message,
                  "show_on_wall": show, "is_millionaire": millionaire},
        success_url=f"{PUBLIC_URL}/thanks?session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{PUBLIC_URL}/?utm_source={channel}",
        submit_type="donate",
    )
    with closing(db()) as c, c:
        c.execute("INSERT INTO checkouts(channel, created_at) VALUES (?,?)", (channel, int(time.time())))
    return jsonify(url=session.url)


@app.post("/stripe/webhook")
def stripe_webhook():
    try:
        event = stripe.Webhook.construct_event(
            request.get_data(), request.headers.get("Stripe-Signature", ""), STRIPE_WEBHOOK_SECRET
        )
    except Exception:
        abort(400)

    if event["type"] == "checkout.session.completed":
        s = event["data"]["object"]
        if s.get("payment_status") == "paid":
            md = s.get("metadata") or {}
            country = ((s.get("customer_details") or {}).get("address") or {}).get("country") or ""
            with closing(db()) as c, c:
                c.execute(
                    "INSERT OR IGNORE INTO supporters(session_id, amount_cents, currency, display_name, message, "
                    "show_on_wall, is_millionaire, channel, country, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)",
                    (s["id"], s["amount_total"], s["currency"], md.get("display_name", ""),
                     md.get("message", ""), int(md.get("show_on_wall") == "1"),
                     int(md.get("is_millionaire") == "1"),
                     clean_channel(md.get("channel")), country, int(time.time())),
                )
    return "", 200


# --------------------------------------------------------- mailing list
CONSENT_TEXT = "I want to receive occasional emails about this music project. I can unsubscribe at any time."


@app.post("/api/subscribe")
def subscribe():
    data = request.get_json(silent=True) or {}
    email = str(data.get("email") or "").strip().lower()
    if not data.get("consent") or "@" not in email or len(email) > 254:
        return jsonify(error="A valid email and consent are required."), 400
    with closing(db()) as c, c:
        c.execute(
            "INSERT INTO subscribers(email, consent_text, consent_at, channel, unsubscribe_token) "
            "VALUES (?,?,?,?,?) ON CONFLICT(email) DO UPDATE SET unsubscribed_at=NULL",
            (email, CONSENT_TEXT, int(time.time()), clean_channel(data.get("channel")), secrets.token_urlsafe(24)),
        )
    return jsonify(ok=True)


@app.get("/unsubscribe")
def unsubscribe():
    token = request.args.get("token", "")
    with closing(db()) as c, c:
        c.execute("UPDATE subscribers SET unsubscribed_at=? WHERE unsubscribe_token=?", (int(time.time()), token))
    return redirect("/unsubscribed")


# ------------------------------------------------------- private metrics
@app.get("/api/metrics")
def metrics():
    if not DASHBOARD_KEY or request.args.get("key") != DASHBOARD_KEY:
        abort(403)
    with closing(db()) as c:
        by_channel = c.execute(
            """
            SELECT ch.channel,
                   (SELECT COUNT(*) FROM visits v WHERE v.channel=ch.channel) visits,
                   (SELECT COUNT(*) FROM checkouts k WHERE k.channel=ch.channel) checkouts,
                   (SELECT COUNT(*) FROM supporters s WHERE s.channel=ch.channel) supporters,
                   (SELECT COALESCE(SUM(amount_cents),0) FROM supporters s WHERE s.channel=ch.channel) total_cents
            FROM (SELECT channel FROM visits UNION SELECT channel FROM supporters) ch
            ORDER BY supporters DESC, visits DESC
            """
        ).fetchall()
        daily = c.execute(
            "SELECT date(created_at,'unixepoch') day, COUNT(*) supporters, SUM(amount_cents) total_cents "
            "FROM supporters GROUP BY day ORDER BY day"
        ).fetchall()
        countries = c.execute(
            "SELECT COALESCE(NULLIF(country,''),'??') country, COUNT(*) n FROM supporters "
            "GROUP BY country ORDER BY n DESC LIMIT 20"
        ).fetchall()
        totals = c.execute(
            "SELECT (SELECT COUNT(*) FROM visits) visits, (SELECT COUNT(*) FROM checkouts) checkouts, "
            "(SELECT COUNT(*) FROM supporters) supporters, "
            "(SELECT COALESCE(SUM(is_millionaire),0) FROM supporters) millionaires, "
            "(SELECT COALESCE(SUM(amount_cents),0) FROM supporters) total_cents, "
            "(SELECT COUNT(*) FROM subscribers WHERE unsubscribed_at IS NULL) subscribers"
        ).fetchone()
    return jsonify(
        totals=dict(totals),
        by_channel=[dict(r) for r in by_channel],
        daily=[dict(r) for r in daily],
        countries=[dict(r) for r in countries],
        currency=CURRENCY,
    )


@app.get("/api/subscribers.csv")
def export_subscribers():
    if not DASHBOARD_KEY or request.args.get("key") != DASHBOARD_KEY:
        abort(403)
    with closing(db()) as c:
        rows = c.execute(
            "SELECT email, consent_at, channel, unsubscribe_token FROM subscribers WHERE unsubscribed_at IS NULL"
        ).fetchall()
    lines = ["email,consent_at,channel,unsubscribe_url"]
    lines += [f'{r["email"]},{r["consent_at"]},{r["channel"]},{PUBLIC_URL}/unsubscribe?token={r["unsubscribe_token"]}'
              for r in rows]
    return "\n".join(lines), 200, {"Content-Type": "text/csv"}


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "8000")))
