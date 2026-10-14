# Launch plan: how to get this in front of as many people as possible

The hook is the stunt itself: **one artist publicly asking ~60 million millionaires for €2 each.**
It's absurd, it's honest, and it has a live scoreboard. That's what makes people share it,
and what makes journalists write about it. The project is the content.

Rule of thumb: **a live, rising number plus a human story beats any ad.** Post the counter often.

## Week 0: before launch
- [ ] Fill in every `[EDIT]` / `[ARTIST NAME]` placeholder in `site/`.
- [ ] Make a 1200×630 `site/og-image.png`: big "€2", your face or cover art, the line "Asking every millionaire on Earth".
      This is what shows up in every WhatsApp, X and LinkedIn preview, so it matters a lot.
- [ ] Put a real track or a 30-second studio clip in the "Hear what you're funding" section.
- [ ] Deploy (see README) and run a €2 payment yourself in Stripe **test mode**, then in live mode.
- [ ] Run `python scripts/make_links.py https://yourdomain` and use those links everywhere.
- [ ] Line up 10–20 friends to give in the first hour. A counter stuck at 0 kills momentum; one at 23 invites people in.

## Week 1: launch
| Day | Channel | What |
|---|---|---|
| Mon | TikTok / Reels / Shorts | Video 1 "The ask" (see `video-scripts.md`). Post on all three. |
| Mon | Friends, WhatsApp, Instagram story | Personal message with the `whatsapp-friends` link |
| Tue | Reddit | A text post in r/WeAreTheMusicMakers, r/indieheads, r/Finland, r/spain, and a city sub. Tell the story; don't just drop the link. Follow each sub's self-promo rules. |
| Wed | Press | Send `press-pitch.md` to 20 outlets: Finnish (Yle, HS Nyt, Rumba, Soundi), Spanish (El País Tentaciones, Mondo Sonoro, Jenesaispop) and international (Vice, Boing Boing, Bandcamp Daily, Hypebot, Music Ally) |
| Thu | Video 2 "Day 3 numbers" | Show the dashboard counter, read out wall messages |
| Fri | Hacker News / LinkedIn | The data angle: "I'm A/B testing whether the internet will fund an album, here are the numbers" |
| Weekend | Video 3 | Use the funniest or most touching supporter message |

## Ongoing loop (what makes things go viral)
1. **Post the number.** Every milestone (100, 500, 1,000, first country #20) is a post.
2. **Check the dashboard daily.** Double down on the channel with the best *visit → paid* rate, and drop the ones at 0%.
3. **Reply to every comment.** Algorithms reward it, and it turns viewers into supporters.
4. **Tag famous rich people in public posts, with humour.** "@[billionaire], it's €2. I'll put you on track 1."
   It's public and playful, and occasionally one of them answers. If one does, that's the whole campaign.
   Keep it light, and stop if someone asks you to.
5. **Give back:** every 1,000 supporters, release something: a demo, a live stream, a supporters-only track.
6. **Email subscribers** with `scripts/send_update.py` every two weeks or at milestones. Never more often.

## Rules that keep the project (and your bank account) safe
- Only email people who subscribed through the site. Never buy, scrape or import email lists.
  That's illegal in the EU and gets your domain blacklisted.
- Be fully transparent about what the money funds. Post receipts and progress.
- Don't DM strangers en masse. Platforms ban accounts for it, and it reads as spam.
- Declare the income. In Finland, crowdfunding and donation income for an artist is generally taxable; a short call with
  Vero or an accountant before launch is cheap insurance. Spanish residency rules differ, so check where you're tax resident.
