const isFiveM = typeof GetParentResourceName === "function";
const app = document.getElementById("codename_window");

let roomId = null;
const joinBtn = document.getElementById("codename_joinBtn");

function post(name, data = {}) {
  if (!isFiveM) return Promise.resolve();

  return fetch(`https://${GetParentResourceName()}/${name}`, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=UTF-8" },
    body: JSON.stringify(data),
  }).catch((e) => console.error(e));
}

function showView(name) {
  document.querySelectorAll(".codename_view").forEach((view) => {
    view.classList.toggle("active", view.id === `codename_view-${name}`);
  });
}

function openUi(view = "lobby") {
  app.classList.add("show");
  showView(view);
}

function hideUi() {
  app.classList.remove("show");
}

function closeUi() {
  hideUi();
  post("close");
}

function playerAddList(data) {
  if (data.lobbyPlayers) {
    const playerListUl = document.getElementById("codename_lobbyPlayers");
    data.lobbyPlayers.forEach((player) => {
      const playerListItem = document.createElement("li");
      playerListItem.textContent = player;
      if (!playerListUl.hasChildNodes(playerListItem))
        playerListUl.appendChild(playerListItem);
    });
  }
}

let countdownTimer = null;

joinBtn.addEventListener("click", () => {
  joinBtn.disabled = true;
  post("joinRoom", { roomId });
});

document.getElementById("codename_exitBtn").addEventListener("click", closeUi);
document.getElementById("codename_leaveBtn").addEventListener("click", () => {
  post("leaveRoom", { roomId });
});

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeUi();
});

window.addEventListener("message", (event) => {
  const data = event.data;

  switch (data.action) {
    case "open":
      if (data.roomId !== undefined) roomId = data.roomId;
      joinBtn.disabled = false;
      openUi("lobby");
      break;

    case "close":
      joinBtn.disabled = false;
      hideUi();
      break;

    case "joined":
      if (data.joinedPlayerId === data.playerId) showView("waiting");

      playerAddList(data);

      break;

    case "leaved":
      console.log(data.leaverId);
      if (data.leaverId === data.playerId) showView("lobby");
      playerAddList(data);
      joinBtn.disabled = false;

      break;
  }
});
