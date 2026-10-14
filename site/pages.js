/* Per-page behaviour for subpages (selected by <body data-page="...">). */
(function () {
  const { S, money, stats, renderWall, renderShare, el, $ } = window.AOTM;
  const page = document.body.dataset.page;

  const handlers = {
    music() {
      $("#formerly").textContent = S.formerly;
      const yt = $("#yt-link");
      if (S.links.youtube) yt.href = S.links.youtube; else yt.remove();
      $("#tracks").replaceChildren(...S.tracks.map((t, i) => {
        const card = el("article", { class: "track reveal in" });
        const embed = el("div", { class: "embed" });
        if (t.youtubeId) {
          embed.append(el("iframe", {
            src: "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(t.youtubeId),
            title: t.title, loading: "lazy", allowfullscreen: "",
            allow: "accelerometer; encrypted-media; gyroscope; picture-in-picture",
          }));
        } else {
          embed.append(el("div", { class: "ph" }, t.releasedAs === S.artist ? "Soon." : String(i + 1).padStart(2, "0")));
        }
        const meta = el("div", { class: "meta" });
        const left = el("div");
        left.append(el("h3", { style: "margin:0;font-size:20px" }, t.title), el("small", {}, t.note || [t.releasedAs, t.year].filter(Boolean).join(" · ")));
        meta.append(left, el("span", { class: "tag" }, t.releasedAs === S.artist ? "New" : "as " + t.releasedAs));
        card.append(embed, meta);
        return card;
      }));
    },

    money() {
      const total = S.budget.reduce((a, b) => a + b.eur, 0);
      $("#budget-total").textContent = money(total * 100);
      stats().then((s) => {
        let left = s.total_cents / 100;
        $("#budget-pct").textContent = Math.min(100, (100 * left) / total).toFixed(left / total < 0.1 ? 1 : 0) + "%";
        $("#budget").replaceChildren(...S.budget.map((b) => {
          const filled = Math.max(0, Math.min(b.eur, left)); left -= filled;
          const row = el("div", { class: "budget-row" });
          const bar = el("div", { class: "bar" }); const fill = el("i", { style: "width:0" }); bar.append(fill);
          row.append(el("span", {}, b.item), el("b", {}, `${money(filled * 100)} / ${money(b.eur * 100)}`), bar);
          requestAnimationFrame(() => setTimeout(() => (fill.style.width = (100 * filled) / b.eur + "%"), 100));
          return row;
        }));
        $("#milestone-list").replaceChildren(...S.milestones.map((m) => {
          const done = s.supporters >= m.at;
          const li = el("li", { class: done ? "done" : "" });
          li.append(el("span", { class: "at" }, m.at.toLocaleString("en-US")), el("span", {}, m.reward),
            el("span", { class: "tag" }, done ? "✓ Unlocked" : `${(m.at - s.supporters).toLocaleString("en-US")} to go`));
          return li;
        }));
      });
    },

    wall() {
      let all = [];
      let filter = "all";
      const draw = () => {
        const items = all.filter((w) => filter === "all" || (filter === "mil" ? w.is_millionaire : w.message));
        renderWall($("#wall-list"), items, filter === "mil"
          ? "No millionaires yet. Are you the first? 🎩" : "No names yet. Be the first one on the wall.");
      };
      document.querySelectorAll(".filters button").forEach((b) => b.addEventListener("click", () => {
        document.querySelectorAll(".filters button").forEach((x) => { x.classList.remove("active"); x.setAttribute("aria-selected", "false"); });
        b.classList.add("active"); b.setAttribute("aria-selected", "true");
        filter = b.dataset.filter; draw();
      }));
      stats(500).then((s) => { all = s.wall; draw(); });
    },

    press() {
      $("#press-mail").href = "mailto:" + S.contactEmail + "?subject=" + encodeURIComponent("Press: " + S.artist);
    },

    thanks() {
      renderShare($("#share"), "thanks", `I just fed the Appetite: €2 to help fund an album, and my name's going in the credits. Your turn 👇`);
      confetti();
    },
  };

  function confetti() {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const c = el("canvas", { style: "position:fixed;inset:0;pointer-events:none;z-index:99", "aria-hidden": "true" });
    document.body.append(c);
    const ctx = c.getContext("2d");
    const resize = () => { c.width = innerWidth; c.height = innerHeight; };
    resize(); addEventListener("resize", resize);
    const colors = ["#ff4b2b", "#ffd23f", "#f4efe6", "#ff8a3d"];
    const bits = Array.from({ length: 160 }, () => ({
      x: Math.random() * c.width, y: -20 - Math.random() * c.height * 0.6, r: 4 + Math.random() * 6,
      vx: -2 + Math.random() * 4, vy: 2 + Math.random() * 4, a: Math.random() * 6, va: -0.2 + Math.random() * 0.4,
      color: colors[(Math.random() * colors.length) | 0],
    }));
    const t0 = performance.now();
    (function frame(t) {
      ctx.clearRect(0, 0, c.width, c.height);
      for (const b of bits) {
        b.x += b.vx; b.y += b.vy; b.vy += 0.04; b.a += b.va;
        ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.a); ctx.fillStyle = b.color;
        ctx.fillRect(-b.r / 2, -b.r / 4, b.r, b.r / 2); ctx.restore();
      }
      if (t - t0 < 5000) requestAnimationFrame(frame); else c.remove();
    })(t0);
  }

  (handlers[page] || (() => {}))();
})();
