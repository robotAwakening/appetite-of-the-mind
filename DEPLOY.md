# Deploying: from your laptop to a live website

Total time is about 45 minutes. Cost is about $7/month for hosting plus roughly €10/year for a domain (optional but recommended).
You'll do this once. After that, every `git push` updates the site automatically.

---

## Step 1: Fill in your content (10 min)

Open **`site/config.js`**. Almost everything lives there: your YouTube URL, the YouTube video IDs of your 3 Risk of Rain
songs (the bit after `watch?v=`), your socials, the contact email, the budget and the milestones.

Then search the `site/` folder for `EDIT` and update those spots: your bio in `story.html` and `press.html`, your legal
name in `privacy.html`, and the `og:url` / `og:image` domain in `index.html` (fill that in after Step 4).

Preview locally to check:

```bash
python app/server.py
```

Open http://localhost:8000. To see it filled with fake supporters, run `python scripts/seed_demo.py` and then start
the server with `DB_PATH=data/demo.db`.

Commit and push:

```bash
git add -A
git commit -m "My content"
git push
```

---

## Step 2: Set up Stripe (15 min)

1. Sign up at https://dashboard.stripe.com/register. Choose **Finland** as the country and **Individual / sole proprietor** as the business type.
   - Business description: something like *"Independent musician. Fan support for album production."*
   - Website: your future domain (you can change it later).
2. **Settings → Payouts → Bank account**: add **one** IBAN in your own name (your Finnish bank, Spanish bank or Revolut all work).
3. **Settings → Payment methods**: make sure Cards, Apple Pay, Google Pay and MobilePay are on (MobilePay is big in Finland).
4. **Developers → API keys**: you'll need the **Secret key** in Step 3.
   - Use the `sk_test_...` key first to make sure everything works, then swap to `sk_live_...`.

Stripe will ask for ID verification before paying out. That's normal.

---

## Step 3: Put it online with Render (10 min)

1. Make sure the code is on GitHub (see the README).
2. Go to https://render.com, sign up **with your GitHub account**, and allow access to the repo.
3. Click **New → Blueprint**, pick your repo, and Render reads `render.yaml` automatically.
4. When it asks for values, enter:
   - `PUBLIC_URL` → for now, `https://appetite-of-the-mind.onrender.com` (Render shows you the exact URL)
   - `STRIPE_SECRET_KEY` → your `sk_test_...` key
   - `STRIPE_WEBHOOK_SECRET` → leave empty for now (Step 3b)
5. Click **Apply**. After 2–3 minutes your site is live at the onrender.com address.

### 3b. Connect Stripe to the counter (webhook)
This is the step that makes payments show up on the counter and the wall.

1. Stripe → **Developers → Webhooks → Add endpoint**
2. Endpoint URL: `https://<your-site>/stripe/webhook`
3. Event: `checkout.session.completed`
4. Save it, then click **Reveal signing secret** (`whsec_...`).
5. Render → your service → **Environment** → set `STRIPE_WEBHOOK_SECRET` to that value → **Save** (it redeploys).

### 3c. Test it
- Open your site and click **Give €2**. Pay with card `4242 4242 4242 4242`, any future date, any CVC.
- You should land on the thank-you page with confetti, and the counter goes up within a few seconds.
- Your dashboard: Render → Environment → copy the `DASHBOARD_KEY` value → open `https://<your-site>/dashboard?key=<that value>`.

### 3d. Go live
Once the test works, switch in **live** mode:
1. Stripe → toggle off "Test mode", then add a new webhook endpoint (live mode has its own) and copy its new `whsec_...`.
2. Render → Environment → replace `STRIPE_SECRET_KEY` with `sk_live_...` and `STRIPE_WEBHOOK_SECRET` with the live one.
3. Make one real €2 payment yourself and refund it from the Stripe dashboard.

> The test payments stay in the database. To start from a clean counter before launch, use Render → Shell:
> `rm /var/data/campaign.db`, then restart the service.

---

## Step 4: Your own domain (10 min, recommended)

A real domain (e.g. `appetiteofthemind.com` or `feedtheappetite.com`) looks far more trustworthy than `onrender.com`,
and trust is what converts.

1. Buy it at Namecheap, Porkbun or Cloudflare (≈ €10/year).
2. Render → your service → **Settings → Custom Domains → Add**, then copy the DNS records it shows into your domain registrar.
3. Wait for the green check (minutes to an hour). HTTPS is automatic.
4. Update: Render `PUBLIC_URL` → `https://yourdomain.com`; the Stripe webhook URL → the new domain;
   `og:url` / `og:image` in `site/index.html` → the new domain. Then push.

---

## Updating the site later

Edit files, then run:

```bash
git add -A
git commit -m "Update"
git push
```

Render redeploys by itself in about 2 minutes. The database on the disk is kept.

## Backups

Stripe keeps every payment forever, but your wall messages and subscribers live in the SQLite file. Once a week
(or before any big change): Render → Shell → `cp /var/data/campaign.db /var/data/backup-$(date +%F).db`,
and download the subscriber CSV from the dashboard.

---

## Alternatives to Render

- **Railway** (railway.app): New Project → Deploy from GitHub, then add a Volume mounted at `/data`, set `DB_PATH=/data/campaign.db`
  and the same variables. Start command: `gunicorn -w 2 -b 0.0.0.0:$PORT app.server:app`.
- **Any VPS / Fly.io / your own machine** with Docker:
  ```bash
  docker build -t aotm .
  docker run -d -p 8000:8000 --env-file .env -v aotm-data:/data --restart unless-stopped aotm
  ```
  Put Caddy or Cloudflare Tunnel in front of it for HTTPS.

## Troubleshooting

| Problem | Fix |
|---|---|
| "Payments are not configured yet" | `STRIPE_SECRET_KEY` is missing in Render → Environment |
| Paid, but the counter didn't move | The webhook URL or secret is wrong. Stripe → Webhooks → your endpoint shows failed deliveries and why |
| Counter reset after a deploy | `DB_PATH` isn't on the disk. It must be `/var/data/campaign.db` |
| Dashboard says Forbidden | The `?key=` doesn't match `DASHBOARD_KEY` exactly |
| Share previews show an old image | Paste your URL into https://www.opengraph.xyz or Facebook's Sharing Debugger to refresh the cache |
