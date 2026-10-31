const isFiveM = typeof GetParentResourceName === "function";
const app = document.getElementById("codename_window");
const joinBtn = document.getElementById("codename_joinBtn");
const spymasterBtn = document.getElementById("codename_pickSpymasterBtn");

let roomId = null;
let countdownInterval = null;

let isPlayerSpymaster = false;
let playerTeam = "";
let playerId = null;
let inRoom = false;
let currentTeam = null;

joinBtn.addEventListener("click", () => {
  joinBtn.disabled = true;
  post("joinRoom", { roomId });
});

document.getElementById("codename_exitBtn").addEventListener("click", closeUi);

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeUi();
});

document.getElementById("codename_leaveBtn").addEventListener("click", () => {
  post("leaveRoom", { roomId });
  joinBtn.disabled = false;
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

      if (inRoom) {
        app.classList.add("show");
        break;
      }

      joinBtn.disabled = false;
      spymasterBtn.disabled = true;
      openUi("lobby");
      break;
    }

    case "close": {
      inRoom = false;
      joinBtn.disabled = false;
      spymasterBtn.disabled = true;
      hideUi();
      break;
    }

    case "joined": {
      if (data.joinedPlayerData.id === data.playerId) {
        inRoom = true;
        showView("waiting");
      }

      playerId = data.playerId;

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
      refreshPlayerList(data.lobbyPlayers, "team");
      spymasterBtn.disabled = false;

      const playerData = data.lobbyPlayers.find((lp) => lp.id === playerId);

      if (playerData) {
        playerTeam = playerData.team;
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

      if (data.endsTime) {
        waitingTimer.classList.remove("hidden");
        startCountdown(data.endsTime, waitingTimer);
      } else {
        clearInterval(countdownInterval);
        waitingTimer.classList.add("hidden");
      }

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
      teamText.classList.remove("teamTwo");
      teamText.textContent = `${TEAM_NAMES[data.startingTeam] ?? ""} köre`;
      if (data.startingTeam === TEAM_TWO) teamText.classList.add("teamTwo");

      const timer = document.getElementById("codename_turnTimerText");
      startCountdown(data.endsTime, timer);

      const playerData = data.lobbyPlayers.find((lp) => lp.id === playerId);

      currentTeam = data.startingTeam;

      if (playerData) {
        const isSpymaster = playerData.spymaster;
        isPlayerSpymaster = isSpymaster;
        playerTeam = playerData.team;

        createIngamePlyerList(data.lobbyPlayers);
        modifyWordCards(
          data.words,
          isPlayerSpymaster,
          playerTeam,
          data.startingTeam,
        );

        if (data.startingTeam === playerTeam && isPlayerSpymaster)
          showClueInput(true);
      }

      break;
    }

    case "clueAdded": {
      if (countdownInterval) clearInterval(countdownInterval);

      document.querySelectorAll(`.codename_vote`).forEach((el) => el.remove());
      document.getElementById("codename_nextRoundBtn_count").textContent = "";

      const teamText = document.getElementById("codename_turnText");
      teamText.classList.remove("teamTwo");

      currentTeam = data.currentTeam;

      teamText.textContent = `${TEAM_NAMES[data.currentTeam] ?? ""} köre`;
      if (data.currentTeam === TEAM_TWO) teamText.classList.add("teamTwo");

      const timer = document.getElementById("codename_turnTimerText");

      startCountdown(data.endsTime, timer);
      showClueInput(false);
      showNextRoundBtn(data.currentTeam === playerTeam && !isPlayerSpymaster);

      const clueText = document.getElementById("codename_clueText");
      const clueCountText = document.getElementById("codename_clueCount");

      if (clueText && data.clue.clue) {
        clueText.classList.remove("hidden");
        clueText.textContent = data.clue.clue;
      }

      if (clueCountText && data.clue.count >= 0) {
        clueCountText.classList.remove("hidden");
        clueCountText.textContent =
          data.clue.cound === 0 ? "∞" : data.clue.count;
      }

      break;
    }

    case "votedSkip": {
      if (!data.skipperCount || data.skipperCount <= 0) break;

      document.getElementById("codename_nextRoundBtn_count").textContent =
        `(${data.skipperCount} / ${data.playerTeamPlayercount})`;

      break;
    }

    case "nextRound": {
      if (countdownInterval) clearInterval(countdownInterval);
      const teamText = document.getElementById("codename_turnText");

      document.getElementById("codename_nextRoundBtn_count").textContent = "";
      document.querySelectorAll(`.codename_vote`).forEach((el) => el.remove());

      currentTeam = data.currentTeam;

      teamText.classList.remove("teamTwo");
      teamText.textContent = `${TEAM_NAMES[data.currentTeam] ?? ""} köre`;
      if (data.currentTeam === TEAM_TWO) teamText.classList.add("teamTwo");

      const timer = document.getElementById("codename_turnTimerText");

      startCountdown(data.endsTime, timer);
      showClueInput(false);
      showNextRoundBtn(false);

      const clueText = document.getElementById("codename_clueText");
      const clueCountText = document.getElementById("codename_clueCount");

      if (clueText) {
        clueText.classList.add("hidden");
        clueText.textContent = "";
      }

      if (clueCountText) {
        clueCountText.classList.add("hidden");
        clueCountText.textContent = "";
      }

      modifyWordCards(
        data.words,
        isPlayerSpymaster,
        playerTeam,
        data.currentTeam,
      );
      showClueInput(data.currentTeam === playerTeam && isPlayerSpymaster);
      showNextRoundBtn(false);

      break;
    }

    case "votedWord": {
      const voter = data.voterWhitPhoto;

      if (!voter) break;

      document
        .querySelectorAll(`.codename_vote[data-voter-id="${voter.votedId}"]`)
        .forEach((el) => el.remove());

      const card = [...document.querySelectorAll(".codename_card")].find(
        (c) => c.dataset.word === data.pickedWord,
      );
      const votesBlock = card?.querySelector(".codename_card-votes");
      if (!votesBlock) break;

      if (!data.pickedWord) {
        if (voter.votedId === playerId) {
          document
            .querySelectorAll(".codename_card-ownPlayerVote")
            .forEach((c) => c.classList.remove("codename_card-ownPlayerVote"));
        }
        break;
      }

      if (voter.votedId === playerId) {
        document
          .querySelectorAll(".codename_card-ownPlayerVote")
          .forEach((c) => c.classList.remove("codename_card-ownPlayerVote"));
        card.classList.add("codename_card-ownPlayerVote");
      }

      const photo = document.createElement("span");
      photo.className = "codename_vote";
      photo.dataset.voterId = voter.votedId;

      const initial = (voter.name ?? "?").charAt(0).toUpperCase();

      if (voter.photo) {
        const img = document.createElement("img");
        img.src = voter.photo;
        img.alt = "";
        img.onerror = () => {
          img.remove();
          photo.textContent = initial;
        };
        photo.appendChild(img);
      } else {
        photo.textContent = initial;
      }

      votesBlock.appendChild(photo);
      break;
    }

    case "selectedWord": {
      const card = [...document.querySelectorAll(".codename_card")].find(
        (c) => c.dataset.word === data.pickedWord,
      );

      if (data.amountClue !== undefined)
        document.getElementById("codename_clueCount").textContent =
          data.overallClue === 0 ? "∞" : data.amountClue;

      card
        ?.querySelectorAll(".codename_card-votes .codename_vote")
        .forEach((el) => el.remove());

      if (currentTeam && playerTeam && isPlayerSpymaster !== null)
        modifyWordCards(data.words, isPlayerSpymaster, playerTeam, currentTeam);

      break;
    }

    case "gameEnded": {
      clearInterval(countdownInterval);
      const timer = document.getElementById("codename_turnTimerText");
      timer.textContent = "";
      timer.classList.remove("urgent");

      const teamText = document.getElementById("codename_turnText");
      teamText.textContent = `${TEAM_NAMES[data.winnerTeam] ?? ""} nyert!`;
      teamText.classList.toggle("teamTwo", data.winnerTeam === TEAM_TWO);

      document.getElementById("codename_clueText").classList.add("hidden");
      document.getElementById("codename_clueCount").classList.add("hidden");
      showClueInput(false);
      showNextRoundBtn(false);

      currentTeam = null;
      modifyWordCards(data.words, true, playerTeam, null);

      break;
    }

    case "error": {
      if (!data.issue) break;

      const hint = document.getElementById("codename_clueHint");
      hint.textContent = ERROR_TEXTS[data.issue] ?? "Hiba történt!";
      hint.classList.add("error");

      switch (data.issue) {
        case "isOnTable":
          document.getElementById("codename_clueTextInput").value = "";
          document.getElementById("codename_clueTextInput").focus();
          document.getElementById("codename_clueSubmit").disabled = false;
          break;
        case "notEnoughLength":
          document.getElementById("codename_clueSubmit").disabled = false;
          document.getElementById("codename_clueTextInput").focus();
          break;
        case "notCorrectCount":
          document.getElementById("codename_clueSubmit").disabled = false;
          document.getElementById("codename_clueCountInput").focus();
          document.getElementById("codename_clueCountInput").value = 0;
          break;
        default:
          document.getElementById("codename_clueSubmit").disabled = false;
          break;
      }

      break;
    }

    case "leaved": {
      const isMe = data.leaverId === playerId;

      const activeView = document
        .querySelector(".codename_view.active")
        ?.id.replace("codename_view-", "");

      if (isMe) {
        inRoom = false;
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
