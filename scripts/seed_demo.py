"""Fill a separate demo database with fake supporters so you can preview the design.

    python scripts/seed_demo.py              # writes data/demo.db
    DB_PATH=data/demo.db python app/server.py

Never point this at your real database.
"""
import random
import sqlite3
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
path = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "data" / "demo.db"
if path.name == "campaign.db":
    sys.exit("Refusing to seed the real database.")
path.parent.mkdir(parents=True, exist_ok=True)
path.unlink(missing_ok=True)

sys.path.insert(0, str(ROOT / "app"))
import os  # noqa: E402
os.environ["DB_PATH"] = str(path)
import server  # noqa: E402,F401  (creates the schema)

people = [
    ("Ana", "ES", "Make the bridge in track 3 longer", 0), ("Mikko", "FI", "Kiitos, go go go", 0),
    ("Definitely Not Elon", "US", "Here's your €2. Don't spend it all at once.", 1), ("Lena", "DE", "", 0),
    ("Jules", "FR", "Saw this on TikTok, love it", 0), ("Sofia", "IT", "", 0), ("Kenji", "JP", "From Osaka with love", 0),
    ("Old Money Margaret", "GB", "My butler insisted.", 1), ("Pablo", "MX", "¡Vamos!", 0), ("Aino", "FI", "", 0),
    ("Rafa", "ES", "Turku represent", 0), ("Priya", "IN", "Art > everything", 0), ("Tom", "AU", "", 0),
    ("Yacht Guy", "MC", "Sent from my yacht", 1), ("Chloé", "CA", "Can't wait for the album", 0),
]
rng = random.Random(7)
conn = sqlite3.connect(path)
now = int(time.time())
for i, (name, cc, msg, mil) in enumerate(people * 3):
    conn.execute(
        "INSERT INTO supporters(session_id, amount_cents, currency, display_name, message, show_on_wall, is_millionaire, "
        "channel, country, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)",
        (f"demo_{i}", rng.choice([200, 200, 200, 500, 2000]) if not mil else 10000, "eur", name, msg, 1, mil,
         rng.choice(["tiktok", "reddit", "share-whatsapp", "direct", "instagram-bio"]), cc, now - (45 - i) * 3600),
    )
for ch, n in (("tiktok", 900), ("reddit", 400), ("share-whatsapp", 300), ("direct", 250), ("instagram-bio", 150)):
    conn.executemany("INSERT INTO visits(channel, created_at) VALUES (?,?)", [(ch, now)] * n)
conn.commit()
print(f"Seeded {path}")
