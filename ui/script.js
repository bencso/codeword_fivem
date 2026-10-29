//TODO: A cluet megosztani a room-mal, ez a csapat következik allatt lesz magha a szó és a szám :D
//TODO: A játékosok tippelése, és azoknak kezelése szerver felé, itt ugye alapból megjelölnek csak és ha mindegyik ugy gondolja akkor adja be

//TODO: Szerver oldali timer játék alatt

//TODO: Kör kezdődik, akkor szerverről át kell adni kié a kör, és maga hogy a kör mikor lesz vége
//TODO: Kör vége: ha lejár a timer, befejezik a játokos a kört, vagy szar tipp, vagy kitippelték a megadott számot (ha nulla akkor végtelent lehet tippelni)

const isFiveM = typeof GetParentResourceName === "function";
const app = document.getElementById("codename_window");
const joinBtn = document.getElementById("codename_joinBtn");
const spymasterBtn = document.getElementById("codename_pickSpymasterBtn");

let roomId = null;
let countdownInterval = null;

let clueCard = [];

joinBtn.addEventListener("click", () => {
  joinBtn.disabled = true;
  post("joinRoom", { roomId });
});

document.getElementById("codename_exitBtn").addEventListener("click", () => {
  if (roomId) post("leaveRoom", { roomId });

  joinBtn.disabled = false;
  closeUi();
});

document.getElementById("codename_leaveBtn").addEventListener("click", () => {
  post("leaveRoom", { roomId });
  joinBtn.disabled = false;
});

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (roomId) post("leaveRoom", { roomId });

    joinBtn.disabled = false;
    closeUi();
  }
});

spymasterBtn.addEventListener("click", () => {
  spymasterBtn.disabled = true;
  post("pickSpymaster", { roomId });
});

window.addEventListener("message", (event) => {
  const data = event.data;
  console.log(JSON.stringify(data));

  switch (data.action) {
    case "open": {
      if (data.roomId !== undefined) roomId = data.roomId;

      joinBtn.disabled = false;
      spymasterBtn.disabled = true;
      openUi("lobby");
      break;
    }

    case "close": {
      joinBtn.disabled = false;
      spymasterBtn.disabled = true;
      hideUi();
      break;
    }

    case "joined": {
      if (data.joinedPlayerData.id === data.playerId) showView("waiting");

      const waitingTimer = document.getElementById(
        "codename_countdown-waiting",
      );

      if (data.activePlayers === true && data.startsIn) {
        waitingTimer.classList.remove("hidden");
        startCountdown(data.startsIn, waitingTimer);
      } else {
        clearInterval(countdownInterval);
        waitingTimer.classList.add("hidden");
      }

      refreshPlayerList(data.lobbyPlayers, "waiting");
      break;
    }

    case "spymaster_selection": {
      showView("team");

      console.log(JSON.stringify(data.players));

      refreshPlayerList(data.players, "team");
      spymasterBtn.disabled = false;

      const teamTimer = document.getElementById("codename_countdown-team");
      teamTimer.classList.remove("hidden");
      startCountdown(data.startsIn, teamTimer);

      break;
    }

    case "userDroped": {
      showView("waiting");

      const waitingTimer = document.getElementById(
        "codename_countdown-waiting",
      );
      waitingTimer.classList.add("hidden");
      if (countdownInterval) clearInterval(countdownInterval);

      refreshPlayerList(data.lobbyPlayers, "waiting");
      joinBtn.disabled = false;
      spymasterBtn.disabled = true;

      break;
    }

    case "gameStarted": {
      showView("game");

      if (countdownInterval) clearInterval(countdownInterval);

      joinBtn.disabled = true;
      spymasterBtn.disabled = true;

      const playerData = data.lobbyPlayers.find(
        (lp) => lp.id === data.playerId,
      );

      if (playerData) {
        const isSpymaster = playerData.spymaster;
        const playerTeam = playerData.team;

        createIngamePlyerList(data.lobbyPlayers);
        createWordCards(data.words, isSpymaster, playerTeam);
      }

      break;
    }

    case "leaved": {
      if (data.leaverId === data.playerId) showView("lobby");

      const waitingTimer = document.getElementById(
        "codename_countdown-waiting",
      );

      if (data.activePlayers !== true) {
        clearInterval(countdownInterval);
        waitingTimer.classList.add("hidden");
      }

      refreshPlayerList(data.lobbyPlayers, "waiting");
      joinBtn.disabled = false;
      spymasterBtn.disabled = true;

      break;
    }
  }
});
