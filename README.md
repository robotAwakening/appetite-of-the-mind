# Appetite of the Mind: *Dear millionaires, it's €1.*

A public, opt-in crowdfunding site for an independent album. One musician is asking ~60 million millionaires
(and everyone else) for €1 each, with a live counter, a public wall, and every supporter credited on the record.

**Pages:** Home · Music · Story · The Money (budget + unlocks) · The Wall · FAQ · Press · Privacy · Thanks · 404

**Features**
- Live ticker, supporter counter, money raised, countries, and a **self-declared millionaire** counter (honour system, gold star on the wall)
- Stripe Checkout (cards, Apple Pay, Google Pay, MobilePay) paid out to your own bank account
- Per-channel tracking: every share button and outreach link is tagged, so you can see which ones bring in money
- Private dashboard at `/dashboard?key=...`
- GDPR-friendly opt-in mailing list with an update sender
- Outreach kit in `outreach/`: launch plan, press pitch, video scripts, social copy

## Quick start (local)

```bash
python -m venv .venv
# Windows: .venv\Scripts\activate    macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python app/server.py
```

Open http://localhost:8000.

To preview with fake supporters (this uses a separate database and never touches real data):

```bash
python scripts/seed_demo.py
```

Then start the server with the demo database (macOS/Linux syntax shown):

```bash
DB_PATH=data/demo.db DASHBOARD_KEY=demo python app/server.py
```

## Edit content

Almost everything is in **`site/config.js`**: artist name, YouTube links and video IDs, socials, budget and milestones.
Smaller bits are marked `EDIT` in the HTML files.

## Deploy

**See [DEPLOY.md](DEPLOY.md)** for the step-by-step: Stripe → Render (one-click blueprint) → webhook → custom domain.

## Scripts

| Command | What it does |
|---|---|
| `python scripts/make_links.py https://yourdomain.com` | One tracked link per channel → `links.csv` |
| `python scripts/send_update.py outreach/update-template.md --dry-run` | Email an update to opt-in subscribers |
| `python scripts/make_og_image.py` | Regenerate the share-preview image (`pip install pillow`) |
| `python scripts/seed_demo.py` | Fake data for previewing the design |

## Layout

```
app/server.py        Flask: pages (clean URLs), Stripe checkout + webhook, stats, subscribe, metrics
site/config.js       ← your content
site/layout.js       Shared ticker, nav, footer, stats, share buttons
site/home.js         Homepage: give widget, meter, subscribe
site/pages.js        Music, Money, Wall, Press, Thanks behaviour
site/*.html          Pages
render.yaml          Render one-click deploy
Dockerfile           Run anywhere with Docker
outreach/            Launch plan, press pitch, video scripts, social posts
```

## Rules this project sticks to

Only email people who subscribed on the site. Never buy, scrape or import contact lists: it's illegal in the EU,
and it would get the domain blacklisted. Reach comes from sharing, press and content (see `outreach/launch-plan.md`).
