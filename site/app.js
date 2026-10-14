(function () {
  const params = new URLSearchParams(location.search);
  const channel = params.get("utm_source") || params.get("ref") || (document.referrer ? hostOf(document.referrer) : "direct");
  let amount = 200;
  let currency = "eur";

  function hostOf(url) { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return "direct"; } }
  function money(cents) {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: currency.toUpperCase(), maximumFractionDigits: cents % 100 ? 2 : 0 }).format(cents / 100);
  }
  const $ = (id) => document.getElementById(id);

  // Count the visit once per session, tagged with its source channel.
  try {
    if (!sessionStorage.getItem("visited")) {
      sessionStorage.setItem("visited", "1");
      fetch("/api/visit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ channel }) });
    }
  } catch { /* storage blocked: skip */ }

  async function refresh() {
    try {
      const s = await (await fetch("/api/stats")).json();
      currency = s.currency;
      $("supporters").textContent = s.supporters.toLocaleString();
      $("raised").textContent = money(s.total_cents);
      $("countries").textContent = s.countries;
      $("goal").textContent = s.goal_supporters.toLocaleString();
      $("progress-bar").style.width = Math.min(100, (100 * s.supporters) / s.goal_supporters) + "%";
      const list = $("wall-list");
      list.replaceChildren(...s.wall.map((w) => {
        const li = document.createElement("li");
        li.textContent = w.display_name + (w.country ? " · " + w.country : "");
        if (w.message) { const em = document.createElement("em"); em.textContent = w.message; li.append(em); }
        return li;
      }));
      $("wall-section").hidden = s.wall.length === 0;
    } catch { /* server offline: keep last values */ }
  }
  refresh();
  setInterval(refresh, 15000);

  document.querySelectorAll(".amounts button").forEach((b) => b.addEventListener("click", () => {
    document.querySelectorAll(".amounts button").forEach((x) => x.classList.remove("active"));
    b.classList.add("active");
    amount = +b.dataset.amount;
    $("pay").textContent = "Give " + money(amount);
  }));

  $("pay").addEventListener("click", async () => {
    const btn = $("pay"); btn.disabled = true; $("pay-error").hidden = true;
    try {
      const r = await fetch("/api/checkout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount_cents: amount, display_name: $("name").value, message: $("message").value, show_on_wall: $("wall").checked, channel }),
      });
      const data = await r.json();
      if (data.url) { location.href = data.url; return; }
      throw new Error(data.error || "Something went wrong");
    } catch (e) {
      $("pay-error").textContent = e.message; $("pay-error").hidden = false; btn.disabled = false;
    }
  });

  // Share links carry their own utm_source so the dashboard can attribute them.
  const text = "This artist is asking every millionaire on Earth for €2 to fund an album. I'm not a millionaire, but I'm in.";
  const link = (src) => location.origin + "/?utm_source=" + src;
  const targets = {
    x: (u) => "https://twitter.com/intent/tweet?text=" + encodeURIComponent(text) + "&url=" + encodeURIComponent(u),
    whatsapp: (u) => "https://wa.me/?text=" + encodeURIComponent(text + " " + u),
    reddit: (u) => "https://www.reddit.com/submit?url=" + encodeURIComponent(u) + "&title=" + encodeURIComponent(text),
    linkedin: (u) => "https://www.linkedin.com/sharing/share-offsite/?url=" + encodeURIComponent(u),
    facebook: (u) => "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(u),
  };
  document.querySelectorAll("[data-share]").forEach((a) => { a.href = targets[a.dataset.share](link("share-" + a.dataset.share)); });
  $("copy-link").addEventListener("click", async (e) => {
    try { await navigator.clipboard.writeText(link("share-copy")); e.target.textContent = "Copied!"; } catch { prompt("Copy this link:", link("share-copy")); }
  });

  $("subscribe").addEventListener("submit", async (e) => {
    e.preventDefault();
    const r = await fetch("/api/subscribe", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: $("email").value, consent: $("consent").checked, channel }),
    });
    $("sub-status").textContent = r.ok ? "You're in. Thanks!" : "Please check your email and the consent box.";
    if (r.ok) e.target.reset();
  });
})();
