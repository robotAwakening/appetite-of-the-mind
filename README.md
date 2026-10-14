# €2 for an Album

A public, opt-in crowdfunding campaign for an independent album: *"I'm asking every millionaire on Earth for €2."*

- **Landing page** with a live counter (supporters, money raised, countries), a progress bar, a public wall and share buttons
- **Stripe Checkout** for €2 / €5 / €20 / €100 (cards, Apple Pay, Google Pay), paid out to your own bank account
- **Per-channel tracking**: every link carries `?utm_source=`, so you can see which posts bring visits, checkouts and payments
- **Private dashboard** at `/dashboard?key=...` showing conversion per channel, daily supporters and top countries
- **GDPR-friendly opt-in mailing list** with consent records, unsubscribe links and an update sender script
- **Outreach kit** in `outreach/`: launch plan, press pitch, video scripts and social copy

## 1. Run it locally

```bash
git clone <your-repo-url> two-euros && cd two-euros
python -m venv .venv
# Windows: .venv\Scripts\activate    macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # then edit .env
python app/server.py
```

Open http://localhost:8000. The page works without Stripe; the pay button just reports that payments aren't configured
(or sends people to your `KOFI_URL` if you've set one).

## 2. Payments (Stripe)

1. Create an account at https://stripe.com as an **individual / sole trader** in Finland (or Spain, wherever you're tax resident).
2. Under **Settings → Payouts**, add your bank account. Any IBAN in your name works (Finnish bank, Spanish bank or Revolut).
   Keep it to one payout account: it's simpler for taxes and for Stripe's verification.
3. Copy your **test** secret key (`sk_test_...`) into `STRIPE_SECRET_KEY`.
4. Webhooks (this is how payments reach the counter):
   - Locally: install the [Stripe CLI](https://stripe.com/docs/stripe-cli) and run
     `stripe listen --forward-to localhost:8000/stripe/webhook`, then paste the `whsec_...` it prints into `STRIPE_WEBHOOK_SECRET`.
   - In production: Stripe Dashboard → Developers → Webhooks → add `https://yourdomain/stripe/webhook`
     with the event `checkout.session.completed`, and paste its signing secret.
5. Pay with test card `4242 4242 4242 4242` and check that the counter goes up. Then switch to live keys.

> Fees: Stripe takes roughly €0.25 + 1.5% per EU card payment, so a €2 gift nets about €1.72.
> The €5/€20 buttons and "pay more if you like" help a lot here.

**No Stripe yet?** Set `KOFI_URL` to your Ko-fi page and the button sends people there. Ko-fi payments won't show on the
counter, though, so use Stripe for the real launch.

## 3. Dashboard

Set `DASHBOARD_KEY` to a long random string, then open `/dashboard?key=<that string>`. It shows:
visits, checkouts and paid supporters per channel, conversion rates, average gift, supporters per day, top countries and
subscriber count, plus a CSV export of subscribers.

## 4. Tracked links

```bash
python scripts/make_links.py https://yourdomain.com
```

This generates one link per channel (TikTok, Reddit, press, etc.) and saves them to `links.csv`. Use a different link everywhere you post.

## 5. Emailing supporters (opt-in only)

Add `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` and `FROM_EMAIL` to `.env`, then:

```bash
python scripts/send_update.py outreach/update-template.md --dry-run
python scripts/send_update.py outreach/update-template.md
```

This only ever emails people who subscribed on the site. Don't import other lists: it's illegal under EU law and gets you blacklisted.

## 6. Deploy

Any host that runs Python works. Cheap or free options: Render, Railway, Fly.io, or a €4/month VPS (e.g. Hetzner).

- Start command: `gunicorn -w 2 -b 0.0.0.0:$PORT app.server:app` (Linux), or `waitress-serve --port=8000 app.server:app` (Windows)
- Set the same variables as `.env` in the host's settings, and set `PUBLIC_URL` to your real domain.
- Make sure `data/` is on a **persistent disk**, or point `DB_PATH` at one. Otherwise the database resets on every deploy.
  (Stripe keeps the real payment records either way.)

## 7. Before launch checklist

- [ ] Replace every `[ARTIST NAME]`, `[EDIT]` and `example.com` in `site/`
- [ ] Add `site/og-image.png` (1200×630)
- [ ] Embed a track
- [ ] Fill in `site/privacy.html`
- [ ] Make one live €2 test payment and refund it
- [ ] Read `outreach/launch-plan.md`

## Project layout

```
app/server.py          Flask server: pages, Stripe checkout + webhook, stats, subscribe, metrics
site/                  Landing page, thanks page, dashboard, privacy page
scripts/make_links.py  Tracked links per channel
scripts/send_update.py Email updates to opt-in subscribers
outreach/              Launch plan, press pitch, video scripts, social copy, email template
```
