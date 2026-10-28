function startCountdown(endsIn, el) {
  clearInterval(countdownInterval);

  const endsAt = Date.now() + endsIn;
  let last = null;

  const tick = () => {
    const left = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
    if (left !== last) {
      el.textContent = left;
      last = left;
    }
    if (left === 0) clearInterval(countdownInterval);
  };

  tick();
  countdownInterval = setInterval(tick, 250);
}
