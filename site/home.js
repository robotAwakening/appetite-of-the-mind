(function () {
  const { S, channel, money, num, stats, renderShare, renderWall, $ } = window.AOTM;
  let amount = 100;

  // the maths
  const need = S.budget.reduce((a, b) => a + b.eur, 0);
  $("#need").textContent = money(need * 100);
  $("#need-pct").textContent = (100 * (need / S.ask) / S.millionairesOnEarth).toFixed(3).replace(/0+$/, "") + "%";

  // live meter + wall preview
  stats().then((s) => {
    const pct = (100 * s.supporters) / s.goal_supporters;
    $("#meter-fill").style.width = Math.min(100, pct) + "%";
    $("#meter-left").textContent = `${num(s.supporters)} / ${num(s.goal_supporters)} supporters`;
    $("#meter-right").textContent = (pct < 1 ? pct.toFixed(3) : pct.toFixed(1)) + "% there";
    renderWall($("#wall-preview"), s.wall.slice(0, 12));
  });

  // give widget
  const payBtn = $("#pay");
  const updateLabel = () => {
    const rich = $("#millionaire").checked;
    payBtn.textContent = (rich ? "Give " + money(amount) + " like a millionaire" : "Give " + money(amount)) + " →";
    $("#mil-wrap").classList.toggle("on", rich);
  };
  document.querySelectorAll(".amounts button").forEach((b) => b.addEventListener("click", () => {
    document.querySelectorAll(".amounts button").forEach((x) => { x.classList.remove("active"); x.setAttribute("aria-checked", "false"); });
    b.classList.add("active"); b.setAttribute("aria-checked", "true");
    amount = +b.dataset.amount;
    updateLabel();
  }));
  $("#millionaire").addEventListener("change", updateLabel);

  payBtn.addEventListener("click", async () => {
    payBtn.disabled = true; $("#pay-error").hidden = true;
    try {
      const r = await fetch("/api/checkout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount_cents: amount, display_name: $("#name").value, message: $("#message").value,
          show_on_wall: $("#wall").checked, is_millionaire: $("#millionaire").checked, channel,
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (data.url) { location.href = data.url; return; }
      throw new Error(data.error || "Something went wrong. Please try again.");
    } catch (e) {
      $("#pay-error").textContent = e.message; $("#pay-error").hidden = false; payBtn.disabled = false;
    }
  });

  renderShare($("#share"), "share");

  $("#subscribe").addEventListener("submit", async (e) => {
    e.preventDefault();
    const r = await fetch("/api/subscribe", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: $("#email").value, consent: $("#consent").checked, channel }),
    }).catch(() => null);
    $("#sub-status").textContent = r && r.ok ? "You're in. See you at the first milestone ✦" : "Hmm, please check your email and tick the box.";
    if (r && r.ok) e.target.reset();
  });
})();
