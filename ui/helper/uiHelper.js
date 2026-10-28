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
