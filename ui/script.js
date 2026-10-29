//TODO: A cluet megosztani a room-mal, ez a csapat következik alatt lesz maga a szó és a szám :D
//TODO: A játékosok tippelése, és azoknak kezelése szerver felé, itt ugye alapból megjelölnek csak és ha mindegyik ugy gondolja akkor adja be

//TODO: Kör kezdődik, akkor szerverről át kell adni kié a kör, és maga hogy a kör mikor lesz vége
//TODO: Kör vége: ha lejár a timer, befejezik a játokos a kört, vagy szar tipp, vagy kitippelték a megadott számot (ha nulla akkor végtelent lehet tippelni)

const isFiveM = typeof GetParentResourceName === "function";
const app = document.getElementById("codename_window");
const joinBtn = document.getElementById("codename_joinBtn");
const spymasterBtn = document.getElementById("codename_pickSpymasterBtn");

let roomId = null;
let countdownInterval = null;

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

      if (data.activePlayers === true && data.endsTime) {
        waitingTimer.classList.remove("hidden");
        startCountdown(data.endsTime, waitingTimer);
      } else {
        clearInterval(countdownInterval);
        waitingTimer.classList.add("hidden");
      }

      refreshPlayerList(data.lobbyPlayers, "waiting");
      break;
    }

    case "spymasterSelection": {
      showView("team");

      refreshPlayerList(data.players, "team");
      spymasterBtn.disabled = false;

      const teamTimer = document.getElementById("codename_countdown-team");
      teamTimer.classList.remove("hidden");
      startCountdown(data.endsTime, teamTimer);

      break;
    }

    case "spymasterSelected": {
      refreshPlayerList(data.players, "team");
      spymasterBtn.disabled = false;

      const playerData = data.lobbyPlayers.find(
        (lp) => lp.id === data.playerId,
      );

      if (playerData) {
        const playerTeam = playerData.team;
        const selectBtn = document.getElementById("codename_pickSpymasterBtn");

        if (data.spymasterTeam === playerTeam && selectBtn) {
          selectBtn.disabled = true;
        }
      }

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

      const teamText = document.getElementById("codename_turnText");
      teamText.textContent = `${data.startingTeam ?? ""} köre`;
      if (data.startingTeam === TEAM_TWO) teamText.classList.add("teamTwo");

      const timer = document.getElementById("codename_turnTimerText");
      startCountdown(data.endsTime, timer);

      const playerData = data.lobbyPlayers.find(
        (lp) => lp.id === data.playerId,
      );

      if (playerData) {
        const isSpymaster = playerData.spymaster;
        const playerTeam = playerData.team;

        createIngamePlyerList(data.lobbyPlayers);
        createWordCards(data.words, isSpymaster, playerTeam);

        if (data.startingTeam === playerTeam && isSpymaster)
          showClueInput(true);
      }

      break;
    }

    case "clueAdded": {
      if (countdownInterval) clearInterval(countdownInterval);

      const teamText = document.getElementById("codename_turnText");
      teamText.textContent = `${data.currentTeam ?? ""} köre`;
      if (data.currentTeam === TEAM_TWO) teamText.classList.add("teamTwo");

      const timer = document.getElementById("codename_turnTimerText");

      startCountdown(data.endsTime, timer);
      showClueInput(false);

      const clueText = document.getElementById("codename_clueText");
      const clueCountText = document.getElementById("codename_clueCount");

      if (clueText && data.clue.clue) {
        clueText.classList.remove("hidden");
        clueText.textContent = data.clue.clue;
      }

      if (clueCountText && data.clue.count) {
        clueCountText.classList.remove("hidden");
        clueCountText.textContent = data.clue.count;
      }

      break;
    }

    case "leaved": {
      const isMe = data.leaverId === data.playerId;

      const activeView = document
        .querySelector(".codename_view.active")
        ?.id.replace("codename_view-", "");

      if (isMe) {
        clearInterval(countdownInterval);
        joinBtn.disabled = false;
        spymasterBtn.disabled = true;
        showView("lobby");
        break;
      }

      if (activeView === "team") {
        refreshPlayerList(data.lobbyPlayers, "team");
      } else {
        const waitingTimer = document.getElementById(
          "codename_countdown-waiting",
        );

        if (data.activePlayers !== true) {
          clearInterval(countdownInterval);
          waitingTimer.classList.add("hidden");
        }

        refreshPlayerList(data.lobbyPlayers, "waiting");
      }

      break;
    }
  }
});
