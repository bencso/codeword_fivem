function startCountdown(endsIn, el) {
  clearInterval(countdownInterval);
  el.classList.remove("urgent");

  const endsAt = Date.now() + endsIn;
  const urgentFrom = Math.ceil(endsIn / 1000) * 0.2;
  let last = null;

  const tick = () => {
    const left = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));

    if (left !== last) {
      el.textContent = left;
      last = left;
    }

    el.classList.toggle("urgent", left > 0 && left <= urgentFrom);

    if (left === 0) clearInterval(countdownInterval);
  };

  tick();
  countdownInterval = setInterval(tick, 250);
}
