"""Generate site/og-image.png (1200x630), the preview image shown when the link is shared.

    pip install pillow
    python scripts/make_og_image.py

Uses a bold system font if it can find one. Swap in your own photo or cover art later for even better results.
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "site" / "og-image.png"
W, H = 1200, 630
BG, FG, ACCENT, GOLD, MUTED = "#0b0a0f", "#f4efe6", "#ff4b2b", "#ffd23f", "#a39d93"

BOLD_FONTS = ["ariblk.ttf", "Arial Black.ttf", "seguibl.ttf", "DejaVuSans-Bold.ttf", "arialbd.ttf"]
REG_FONTS = ["segoeui.ttf", "arial.ttf", "DejaVuSans.ttf", "Helvetica.ttc"]
FONT_DIRS = [Path("C:/Windows/Fonts"), Path("/usr/share/fonts/truetype/dejavu"), Path("/Library/Fonts"),
             Path("/System/Library/Fonts/Supplemental")]


def font(names, size):
    for d in FONT_DIRS:
        for n in names:
            if (d / n).exists():
                return ImageFont.truetype(str(d / n), size)
    return ImageFont.load_default(size)


def main():
    img = Image.new("RGB", (W, H), BG)

    glow = Image.new("RGB", (W, H), BG)
    g = ImageDraw.Draw(glow)
    g.ellipse((700, -260, 1400, 440), fill=ACCENT)
    g.ellipse((-300, 380, 260, 940), fill="#5a4a10")
    img = Image.blend(img, glow.filter(ImageFilter.GaussianBlur(120)), 0.55)

    d = ImageDraw.Draw(img)
    # bitten-circle logo
    d.ellipse((70, 62, 118, 110), fill=ACCENT)
    for cx, cy, r in ((113, 69, 11), (104, 63, 6), (117, 83, 6)):
        d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=BG)
    d.text((134, 66), "APPETITE OF THE MIND", font=font(BOLD_FONTS, 30), fill=FG)

    big = font(BOLD_FONTS, 104)
    d.text((70, 170), "Dear millionaires,", font=big, fill=FG)
    d.text((70, 290), "it's", font=big, fill=FG)
    d.text((70 + d.textlength("it's ", font=big), 290), "€1.", font=big, fill=ACCENT)

    d.text((72, 452), "One musician. ~60,000,000 millionaires. One album.", font=font(REG_FONTS, 34), fill=MUTED)
    d.rounded_rectangle((70, 520, 520, 584), radius=32, fill=ACCENT)
    d.text((100, 534), "Feed the Appetite →", font=font(BOLD_FONTS, 30), fill=BG)
    d.text((560, 538), "Live counter · your name in the credits", font=font(REG_FONTS, 26), fill=GOLD)

    img.save(OUT, optimize=True)
    print(f"Saved {OUT}")


if __name__ == "__main__":
    main()
