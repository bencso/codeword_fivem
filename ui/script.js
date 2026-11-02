const isFiveM = typeof GetParentResourceName === "function";
const app = document.getElementById("codeword_window");

let roomId = null;
let countdownInterval = null;

let isPlayerSpymaster = false;
let isPlayerViewer = false;
let playerTeam = "";
let playerId = null;
let inRoom = false;
let currentTeam = null;

window.addEventListener("message", (event) => {
  const data = event.data;
  console.log(JSON.stringify(data));

  switch (data.action) {
    case "open": {
      if (data.roomId !== undefined) roomId = data.roomId;

      document.getElementById("codeword_exitBtn").textContent = EXIT_BTN_TEXT;
      document.getElementById("codeword_joinBtn").textContent = JOIN_BTN_TEXT;

      const banner = document.getElementById("codeword_roundBanner");
      banner.classList.remove("show");

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
        "codeword_countdown-waiting",
      );

      document.querySelector(
        "#codeword_view-waiting .codeword_title",
      ).textContent = WAITING_HEADING;
      document.querySelector(
        "#codeword_view-waiting .codeword_subtitle",
      ).textContent = WAITING_SUBHEADING;
      document.getElementById("codeword_leaveBtn").textContent = LEAVE_BTN_TEXT;

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

      document.querySelector(
        "#codeword_view-team .codeword_title",
      ).textContent = SPYMASTER_SELECTION_HEADING;
      document.getElementById("codeword_pickSpymasterBtn").textContent =
        SPYMASTER_SELECTION_PICK_BTN;

      const teamTimer = document.getElementById("codeword_countdown-team");
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
        const selectBtn = document.getElementById("codeword_pickSpymasterBtn");

        if (data.spymasterTeam === playerTeam && selectBtn) {
          selectBtn.disabled = true;
        }
      }

      break;
    }

    case "spymasterChanged": {
      if (data.newSpymasterId === playerId) isPlayerSpymaster = true;
      break;
    }

    case "ingamePlayers": {
      createIngamePlyerList(data.players.filter((p) => !p.isViewer));
      break;
    }

    case "userDroped": {
      showView("waiting");

      const waitingTimer = document.getElementById(
        "codeword_countdown-waiting",
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
      isPlayerViewer = false;
      isPlayerSpymaster = false;

      break;
    }

    case "gameStarted": {
      showView("game");

      if (data.playerId) playerId = data.playerId;
      if (countdownInterval) clearInterval(countdownInterval);

      joinBtn.disabled = true;
      spymasterBtn.disabled = true;

      showRoundBanner(data.startingTeam);

      const teamText = document.getElementById("codeword_turnText");
      teamText.classList.remove("teamTwo");
      teamText.textContent = SPYMASTER_TEXT_BANNER(data.startingTeam);
      if (data.startingTeam === TEAM_TWO) teamText.classList.add("teamTwo");

      const timer = document.getElementById("codeword_turnTimerText");
      startCountdown(data.endsTime, timer);

      const teamOneClueHistory = document.getElementById(
        "codeword_teamOneClues",
      );
      const teamTwoClueHistory = document.getElementById(
        "codeword_teamTwoClues",
      );

      teamOneClueHistory.textContent = "";
      teamTwoClueHistory.textContent = "";

      const playerData = data.lobbyPlayers.find((lp) => lp.id === playerId);

      inRoom = true;
      currentTeam = data.startingTeam;
      isPlayerViewer = !!data.isViewer;
      isPlayerSpymaster = !!playerData?.spymaster;
      playerTeam = playerData?.team ?? "";

      createIngamePlyerList(data.lobbyPlayers);
      modifyWordCards(
        data.words,
        isPlayerSpymaster,
        playerTeam,
        data.startingTeam,
        isPlayerViewer,
      );

      const clueText = document.getElementById("codeword_clueText");
      const clueCountText = document.getElementById("codeword_clueCount");

      if (data.clueHistory !== undefined) modifyClueHistory(data.clueHistory);

      if (clueText && data.clue?.clue) {
        clueText.classList.remove("hidden");
        clueText.textContent = data.clue.clue;
      }

      if (clueCountText && data.clue?.clue) {
        clueCountText.classList.remove("hidden");
        clueCountText.textContent =
          data.clue.count === 0 ? "∞" : data.clue.count;
      }

      if (data.startingTeam === playerTeam && isPlayerSpymaster)
        showClueInput(true);

      break;
    }

    case "clueAdded": {
      if (countdownInterval) clearInterval(countdownInterval);

      document.querySelectorAll(`.codeword_vote`).forEach((el) => el.remove());

      if (document.getElementById("codeword_nextRoundBtn_count"))
        document.getElementById("codeword_nextRoundBtn_count").textContent = "";

      const teamText = document.getElementById("codeword_turnText");
      teamText.classList.remove("teamTwo");

      currentTeam = data.currentTeam;

      teamText.textContent = `${TEAM_NAMES[data.currentTeam] ?? ""} talál ki`;
      if (data.currentTeam === TEAM_TWO) teamText.classList.add("teamTwo");

      const timer = document.getElementById("codeword_turnTimerText");

      startCountdown(data.endsTime, timer);
      showClueInput(false);
      showNextRoundBtn(
        data.currentTeam === playerTeam &&
          !isPlayerSpymaster &&
          !isPlayerViewer,
      );

      const clueText = document.getElementById("codeword_clueText");
      const clueCountText = document.getElementById("codeword_clueCount");

      if (data.clueHistory !== undefined) modifyClueHistory(data.clueHistory);

      if (clueText && data.clue.clue) {
        clueText.classList.remove("hidden");
        clueText.textContent = data.clue.clue;
      }

      if (clueCountText && data.clue.count >= 0) {
        clueCountText.classList.remove("hidden");
        clueCountText.textContent =
          data.clue.count === 0 ? "∞" : data.clue.count;
      }

      break;
    }

    case "votedSkip": {
      if (!data.skipperCount || data.skipperCount <= 0) break;

      if (document.getElementById("codeword_nextRoundBtn_count"))
        document.getElementById("codeword_nextRoundBtn_count").textContent =
          `(${data.skipperCount} / ${data.playerTeamPlayercount})`;

      break;
    }

    case "nextRound": {
      if (countdownInterval) clearInterval(countdownInterval);
      const teamText = document.getElementById("codeword_turnText");

      if (document.getElementById("codeword_nextRoundBtn_count"))
        document.getElementById("codeword_nextRoundBtn_count").textContent = "";
      document.querySelectorAll(`.codeword_vote`).forEach((el) => el.remove());

      currentTeam = data.currentTeam;

      if (
        document.getElementById("codeword_view-game").classList.contains("show")
      )
        showRoundBanner(data.currentTeam);

      teamText.classList.remove("teamTwo");
      teamText.textContent = SPYMASTER_TEXT_BANNER(data.currentTeam);
      if (data.currentTeam === TEAM_TWO) teamText.classList.add("teamTwo");

      const timer = document.getElementById("codeword_turnTimerText");

      startCountdown(data.endsTime, timer);
      showClueInput(false);
      showNextRoundBtn(false);

      const clueText = document.getElementById("codeword_clueText");
      const clueCountText = document.getElementById("codeword_clueCount");

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
        isPlayerViewer,
      );
      showClueInput(data.currentTeam === playerTeam && isPlayerSpymaster);
      showNextRoundBtn(false);

      break;
    }

    case "votedWord": {
      const voter = data.voterWhitPhoto;

      if (!voter) break;

      const pickedWords = data.pickedWords ?? [];

      if (voter.votedId === playerId) {
        document
          .querySelectorAll(".codeword_card-ownPlayerVote")
          .forEach((c) => c.classList.remove("codeword_card-ownPlayerVote"));
      }

      document
        .querySelectorAll(`.codeword_vote[data-voter-id="${voter.votedId}"]`)
        .forEach((el) => el.remove());

      [...document.querySelectorAll(".codeword_card")]
        .filter((c) => pickedWords.includes(c.dataset.word))
        .forEach((card) => {
          const votesBlock = card?.querySelector(".codeword_card-votes");

          if (!votesBlock) return;

          if (voter.votedId === playerId)
            card.classList.add("codeword_card-ownPlayerVote");

          const photo = document.createElement("span");
          photo.className = "codeword_vote";
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
        });

      break;
    }

    case "selectedWord": {
      const card = [...document.querySelectorAll(".codeword_card")].find(
        (c) => c.dataset.word === data.pickedWord,
      );

      if (data.amountClue !== undefined)
        document.getElementById("codeword_clueCount").textContent =
          data.overallClue === 0 ? "∞" : data.amountClue;

      card
        ?.querySelectorAll(".codeword_card-votes .codeword_vote")
        .forEach((el) => el.remove());

      if (currentTeam && (playerTeam || isPlayerViewer))
        modifyWordCards(
          data.words,
          isPlayerSpymaster,
          playerTeam,
          currentTeam,
          isPlayerViewer,
        );

      break;
    }

    case "gameEnded": {
      clearInterval(countdownInterval);
      const timer = document.getElementById("codeword_turnTimerText");
      timer.textContent = "";
      timer.classList.remove("urgent");

      startCountdown(data.newGameAt, timer);

      showWinnerBanner(data.winnerTeam);

      const teamText = document.getElementById("codeword_turnText");
      teamText.textContent = WINNER_TEXT(data.winnerTeam);
      teamText.classList.toggle("teamTwo", data.winnerTeam === TEAM_TWO);

      document.getElementById("codeword_clueText").classList.add("hidden");
      document.getElementById("codeword_clueCount").classList.add("hidden");
      showClueInput(false);
      showNextRoundBtn(false);

      currentTeam = null;
      modifyWordCards(data.words, true, playerTeam, null, true);

      break;
    }

    case "error": {
      if (!data.issue) break;

      const hint = document.getElementById("codeword_clueHint");
      hint.textContent = ERROR_TEXTS[data.issue] ?? "Hiba történt!";
      hint.classList.add("error");

      switch (data.issue) {
        case "isOnTable":
          document.getElementById("codeword_clueTextInput").value = "";
          document.getElementById("codeword_clueTextInput").focus();
          document.getElementById("codeword_clueSubmit").disabled = false;
          break;
        case "notEnoughLength":
          document.getElementById("codeword_clueSubmit").disabled = false;
          document.getElementById("codeword_clueTextInput").focus();
          break;
        case "notCorrectCount":
          document.getElementById("codeword_clueSubmit").disabled = false;
          document.getElementById("codeword_clueCountInput").focus();
          document.getElementById("codeword_clueCountInput").value = 0;
          break;
        default:
          document.getElementById("codeword_clueSubmit").disabled = false;
          break;
      }

      break;
    }

    case "leaved": {
      const isMe = data.leaverId === playerId;

      const activeView = document
        .querySelector(".codeword_view.active")
        ?.id.replace("codeword_view-", "");

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
          "codeword_countdown-waiting",
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
