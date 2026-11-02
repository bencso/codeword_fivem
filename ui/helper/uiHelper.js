const joinBtn = document.getElementById("codeword_joinBtn");
const spymasterBtn = document.getElementById("codeword_pickSpymasterBtn");

function showView(name) {
  document.querySelectorAll(".codeword_view").forEach((view) => {
    view.classList.toggle("active", view.id === `codeword_view-${name}`);
  });
}

function openUi(view = "lobby") {
  if (!app.classList.contains("show")) app.classList.add("show");
  showView(view);
}

function hideUi() {
  if (app.classList.contains("show")) app.classList.remove("show");
}

function closeUi() {
  hideUi();
  post("close");
}

function showRoundBanner(team) {
  const banner = document.getElementById("codeword_roundBanner");
  banner.innerHTML = `<span>${NEXT_TEXT_BANNER(team)}</span>`;
  banner.classList.toggle("teamTwo", team === TEAM_TWO);

  banner.classList.remove("show");
  void banner.offsetWidth;
  banner.classList.add("show");
}

function showWinnerBanner(team) {
  const banner = document.getElementById("codeword_roundBanner");
  banner.innerHTML = `<span>${WINNER_TEXT_BANNER(team)}</span>`;
  banner.classList.toggle("teamTwo", team === TEAM_TWO);

  banner.classList.remove("show");
  void banner.offsetWidth;
  banner.classList.add("show");
}

joinBtn.addEventListener("click", () => {
  joinBtn.disabled = true;
  post("joinRoom", { roomId });
});

document.getElementById("codeword_exitBtn").addEventListener("click", closeUi);

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    post("leaveRoom", { roomId });
    joinBtn.disabled = false;
  }
});

document.getElementById("codeword_leaveBtn").addEventListener("click", () => {
  post("leaveRoom", { roomId });
  joinBtn.disabled = false;
});

spymasterBtn.addEventListener("click", () => {
  spymasterBtn.disabled = true;
  post("pickSpymaster", { roomId });
});
