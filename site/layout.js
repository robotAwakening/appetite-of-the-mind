/* Shared layout + helpers for every page: ticker, nav, footer, stats, sharing. */
(function () {
  const S = window.SITE;
  const page = document.body.dataset.page || "";
  const $ = (sel, root = document) => root.querySelector(sel);
  const el = (tag, attrs = {}, text) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    if (text != null) n.textContent = text;
    return n;
  };

  // ---------- attribution: first-touch channel survives navigation between pages
  const params = new URLSearchParams(location.search);
  let channel = params.get("utm_source") || params.get("ref");
  try {
    channel = channel || sessionStorage.getItem("channel");
    if (!channel) channel = document.referrer && new URL(document.referrer).host !== location.host
      ? new URL(document.referrer).hostname.replace(/^www\./, "") : "direct";
    if (!sessionStorage.getItem("channel")) {
      sessionStorage.setItem("channel", channel);
      fetch("/api/visit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ channel }) }).catch(() => {});
    }
  } catch { channel = channel || "direct"; }

  // ---------- formatting
  const money = (cents, cur = "eur") => new Intl.NumberFormat("en-IE", {
    style: "currency", currency: cur.toUpperCase(), maximumFractionDigits: cents % 100 ? 2 : 0,
  }).format(cents / 100);
  const num = (n) => Number(n).toLocaleString("en-US");
  const flag = (cc) => cc && cc.length === 2 ? String.fromCodePoint(...[...cc.toUpperCase()].map((c) => 127397 + c.charCodeAt(0))) : "";

  const EMPTY = { supporters: 0, total_cents: 0, countries: 0, millionaires: 0, goal_supporters: 1000000, currency: "eur", wall: [] };
  const statsCache = {};
  function stats(wall = 60) {
    statsCache[wall] = statsCache[wall] || fetch("/api/stats?wall=" + wall).then((r) => r.json()).catch(() => EMPTY);
    return statsCache[wall];
  }

  function countUp(node, to, fmt = num, ms = 1400) {
    if (!node) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || to === 0) { node.textContent = fmt(to); return; }
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - p, 3);
      node.textContent = fmt(Math.round(to * e));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  // ---------- sharing: every button gets its own utm_source
  const shareTargets = {
    whatsapp: ["WhatsApp", (u, t) => "https://wa.me/?text=" + encodeURIComponent(t + " " + u)],
    x: ["X", (u, t) => "https://twitter.com/intent/tweet?text=" + encodeURIComponent(t) + "&url=" + encodeURIComponent(u)],
    reddit: ["Reddit", (u, t) => "https://www.reddit.com/submit?url=" + encodeURIComponent(u) + "&title=" + encodeURIComponent(t)],
    facebook: ["Facebook", (u) => "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(u)],
    linkedin: ["LinkedIn", (u) => "https://www.linkedin.com/sharing/share-offsite/?url=" + encodeURIComponent(u)],
    telegram: ["Telegram", (u, t) => "https://t.me/share/url?url=" + encodeURIComponent(u) + "&text=" + encodeURIComponent(t)],
  };
  function renderShare(container, prefix = "share", text = S.shareText) {
    if (!container) return;
    const link = (src) => location.origin + "/?utm_source=" + prefix + "-" + src;
    container.replaceChildren();
    if (navigator.share) {
      const b = el("button", { type: "button" }, "Share…");
      b.onclick = () => navigator.share({ title: S.artist, text, url: link("native") }).catch(() => {});
      container.append(b);
    }
    for (const [key, [label, fn]] of Object.entries(shareTargets)) {
      container.append(el("a", { href: fn(link(key), text), target: "_blank", rel: "noopener" }, label));
    }
    const copy = el("button", { type: "button" }, "Copy link");
    copy.onclick = async () => {
      try { await navigator.clipboard.writeText(link("copy")); copy.textContent = "Copied ✓"; }
      catch { prompt("Copy this link:", link("copy")); }
    };
    container.append(copy);
  }

  // ---------- logo: a circle with a bite taken out of it
  const logoSvg = `<svg class="logo-mark" viewBox="0 0 32 32" aria-hidden="true"><defs><mask id="bite"><rect width="32" height="32" fill="#fff"/><circle cx="27" cy="7" r="7" fill="#000"/><circle cx="21" cy="3.5" r="3.5" fill="#000"/><circle cx="29.5" cy="13" r="3.5" fill="#000"/></mask></defs><circle cx="16" cy="16" r="15" fill="var(--accent)" mask="url(#bite)"/></svg>`;

  // ---------- ticker
  const ticker = el("div", { class: "ticker", role: "marquee", "aria-label": "Live campaign numbers" });
  const track = el("div", { class: "ticker-track" });
  ticker.append(track);
  function fillTicker(s) {
    const items = [
      `LIVE: ${num(s.supporters)} supporters`,
      `${money(s.total_cents, s.currency)} raised`,
      `${num(s.millionaires)} self-declared millionaires`,
      `${num(s.countries)} countries`,
      `${S.tagline} €${S.ask}`,
      ...s.wall.slice(0, 6).map((w) => `${w.display_name}${w.country ? " " + flag(w.country) : ""} just fed the Appetite`),
    ];
    track.replaceChildren(...[...items, ...items].map((t) => el("span", {}, t)));
  }
  fillTicker(EMPTY);

  // ---------- nav
  const pages = [["/", "Home", "home"], ["/music", "Music", "music"], ["/story", "Story", "story"], ["/money", "The Money", "money"],
    ["/wall", "The Wall", "wall"], ["/faq", "FAQ", "faq"], ["/press", "Press", "press"]];
  const nav = el("nav", { class: "nav", "aria-label": "Main" });
  nav.innerHTML = `<div class="wrap">
      <a class="logo" href="/">${logoSvg}<span></span></a>
      <button class="nav-toggle" aria-expanded="false" aria-controls="nav-links">Menu</button>
      <div class="nav-links" id="nav-links"></div>
    </div>`;
  $(".logo span", nav).textContent = S.artist;
  const links = $(".nav-links", nav);
  for (const [href, label, key] of pages) {
    const a = el("a", { href }, label);
    if (key === page) a.setAttribute("aria-current", "page");
    links.append(a);
  }
  links.append(el("a", { href: "/#give", class: "btn btn-primary btn-small", style: "color:var(--accent-fg)" }, `Give €${S.ask}`));
  $(".nav-toggle", nav).onclick = (e) => {
    const open = links.classList.toggle("open");
    e.currentTarget.setAttribute("aria-expanded", open);
  };

  // ---------- CTA band + footer
  const cta = el("section", { class: "cta-band" });
  cta.innerHTML = `<div class="wrap"><div><h2>It's €${S.ask}. Feed the Appetite.</h2>
      <p style="margin:0;font-size:18px">Your name goes in the credits of a real album.</p></div>
      <a class="btn" href="/#give">Give €${S.ask} →</a></div>`;

  const footer = el("footer", { class: "site" });
  const socials = Object.entries(S.links).filter(([, url]) => url);
  footer.innerHTML = `<div class="wrap">
      <div class="cols">
        <div><a class="logo" href="/">${logoSvg}<span></span></a>
          <p style="max-width:360px;margin-top:14px">An open experiment: one artist asking roughly ${num(S.millionairesOnEarth)} millionaires for €${S.ask} each to fund an album.
          Formerly releasing as <em></em>.</p></div>
        <div><h4>Explore</h4><ul class="f-pages"></ul></div>
        <div><h4>Follow</h4><ul class="f-social"></ul></div>
      </div>
      <div class="legal"><span>© ${new Date().getFullYear()} <span class="f-artist"></span>. Payments by Stripe.</span>
        <span><a href="/privacy">Privacy</a> · <a class="f-mail">Contact</a></span></div>
    </div>`;
  $(".logo span", footer).textContent = S.artist;
  $(".f-artist", footer).textContent = S.artist;
  $("em", footer).textContent = S.formerly;
  $(".f-mail", footer).href = "mailto:" + S.contactEmail;
  for (const [href, label] of pages) { const li = el("li"); li.append(el("a", { href }, label)); $(".f-pages", footer).append(li); }
  for (const [name, url] of socials) {
    const li = el("li"); li.append(el("a", { href: url, target: "_blank", rel: "noopener" }, name[0].toUpperCase() + name.slice(1)));
    $(".f-social", footer).append(li);
  }

  document.body.prepend(ticker, nav);
  if (!document.body.hasAttribute("data-no-cta")) document.body.append(cta);
  document.body.append(footer);

  // ---------- reveal-on-scroll
  const io = "IntersectionObserver" in window ? new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  }), { threshold: 0.12 }) : null;
  document.querySelectorAll(".reveal").forEach((n) => (io ? io.observe(n) : n.classList.add("in")));

  // ---------- [data-stat] placeholders fill themselves anywhere on the page
  stats().then((s) => {
    fillTicker(s);
    document.querySelectorAll("[data-stat]").forEach((n) => {
      const k = n.dataset.stat;
      if (k === "raised") countUp(n, s.total_cents, (v) => money(v, s.currency));
      else countUp(n, s[k] ?? 0);
    });
  });

  function renderWall(list, items, emptyText = "No names yet. Be the first one on the wall.") {
    if (!items.length) {
      list.replaceChildren(el("li", { class: "wall-empty", style: "grid-column:1/-1" }, emptyText));
      return;
    }
    list.replaceChildren(...items.map((w, i) => {
      const li = el("li", { class: w.is_millionaire ? "mil" : "", style: `animation-delay:${Math.min(i, 20) * 30}ms` });
      const who = el("div", { class: "who" });
      who.append(el("span", {}, w.display_name), el("span", { class: "where" }, w.country || ""));
      li.append(who);
      if (w.message) li.append(el("span", { class: "msg" }, "“" + w.message + "”"));
      if (w.is_millionaire) li.append(el("span", { class: "badge" }, "★ Self-declared millionaire"));
      return li;
    }));
  }

  window.AOTM = { S, channel, money, num, flag, stats, countUp, renderShare, renderWall, el, $ };
})();
