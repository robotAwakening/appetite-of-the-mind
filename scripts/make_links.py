"""Generate one tracked link per outreach channel.

Every place you post gets its own ?utm_source=..., so the dashboard shows
exactly which posts, people and outlets bring in supporters.

    python scripts/make_links.py https://yourdomain.com
    python scripts/make_links.py https://yourdomain.com tiktok-video-3 blog-xyz
"""
import csv
import sys

DEFAULT_CHANNELS = [
    "tiktok", "instagram-bio", "instagram-story", "youtube-shorts", "youtube-desc",
    "x", "threads", "bluesky", "reddit", "hackernews", "linkedin", "facebook",
    "whatsapp-friends", "telegram", "discord", "newsletter", "press-pitch",
    "spotify-bio", "bandcamp", "soundcloud", "poster-qr", "gig-flyer", "email-signature",
]


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    base = sys.argv[1].rstrip("/")
    channels = sys.argv[2:] or DEFAULT_CHANNELS
    with open("links.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["channel", "url"])
        for ch in channels:
            url = f"{base}/?utm_source={ch}"
            w.writerow([ch, url])
            print(f"{ch:20} {url}")
    print("\nSaved to links.csv")


if __name__ == "__main__":
    main()
