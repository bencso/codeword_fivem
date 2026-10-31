function showView(name) {
  document.querySelectorAll(".codename_view").forEach((view) => {
    view.classList.toggle("active", view.id === `codename_view-${name}`);
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
  const banner = document.getElementById("codename_roundBanner");
  banner.innerHTML = `<span>Következik: ${TEAM_NAMES[team] ?? ""}</span>`;
  banner.classList.toggle("teamTwo", team === TEAM_TWO);

  banner.classList.remove("show");
  void banner.offsetWidth;
  banner.classList.add("show");
}

function showWinnerBanner(team) {
  const banner = document.getElementById("codename_roundBanner");
  banner.innerHTML = `<span>${TEAM_NAMES[team] ?? ""} győzött</span>`;
  banner.classList.toggle("teamTwo", team === TEAM_TWO);

  banner.classList.remove("show");
  void banner.offsetWidth;
  banner.classList.add("show");
}
