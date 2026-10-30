//TODO:
/*
#	Mi	Hol	Teendő	Típus
3	A tipp nincs ellenőrizve	server ADD_CLUE + NUI	üres, szóköz, táblán lévő szó, count. Tartalmi hibánál CLUE_REJECTED, a NUI kiírja, és újraengedélyezi a gombot	🟠 hiba
4	A később csatlakozók nem látják a laptopot	kliens + szerver	a meglévő laptopok lekérése belépéskor	🟠 hiba
5	Tippelés a kliensen	NUI + kliens	kártyakattintásra pickWord callback, ami PICK_WORD-öt küld. A kémfőnöknél és a nem soros csapatnál ne legyen kattintható	🟢 hiányzik
6	Szavazatok megjelenítése	NUI + kliens	VOTED_WORD handler: ki melyik kártyát jelölte (például avatar vagy név a kártyán)	🟢 hiányzik
7	Felfordítás megjelenítése	NUI + kliens	SELECTED_WORD handler: createWordCards az új listával, a szavazatjelölések törlése	🟢 hiányzik
8	Játék vége	server	endGame(roomId, winnerTeam): időzítő leállítása, finished, színes lista mindenkinek, GAME_ENDED. A három TODO hívja	🟢 hiányzik
9	Játék vége képernyő, új játék	NUI + kliens + server	ki nyert, majd vissza a lobbyba vagy újrakezdés	🟢 hiányzik
10	“Kör vége” gomb	NUI + server	a tippelők önként befejezhetik a kört (nextRound)	🟢 hiányzik
11	Hátralévő kártyák számlálója	NUI + server	csapatonként, a cardsLeft értékét is ki lehet küldeni	🟢 hiányzik
13	Kémfőnök pótlása	server	a resetRoom helyett új kémfőnök kijelölése	⚪ későbbre
14	Újraindulás resetRoom után	server	a visszaszámlálás csak új belépésnél indul, akkor is, ha megvan a létszám	⚪ apróság
*/

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
      teamText.classList.remove("teamTwo");
      teamText.textContent = `${TEAM_NAMES[data.startingTeam] ?? ""} köre`;
      if (data.startingTeam === TEAM_TWO) teamText.classList.add("teamTwo");

      const timer = document.getElementById("codename_turnTimerText");
      startCountdown(data.endsTime, timer);

      const playerData = data.lobbyPlayers.find((lp) => lp.id === playerId);

      if (playerData) {
        const isSpymaster = playerData.spymaster;
        isPlayerSpymaster = isSpymaster;
        playerTeam = playerData.team;

        createIngamePlyerList(data.lobbyPlayers);
        createWordCards(data.words, isSpymaster, playerTeam);

        if (data.startingTeam === playerTeam && isSpymaster) {
          if (isSpymaster) showClueInput(true);
          else showNextRoundBtn(true);
        }
      }

      break;
    }

    case "clueAdded": {
      if (countdownInterval) clearInterval(countdownInterval);

      const teamText = document.getElementById("codename_turnText");
      teamText.classList.remove("teamTwo");
      teamText.textContent = `${TEAM_NAMES[data.currentTeam] ?? ""} köre`;
      if (data.currentTeam === TEAM_TWO) teamText.classList.add("teamTwo");

      const timer = document.getElementById("codename_turnTimerText");

      startCountdown(data.endsTime, timer);
      showClueInput(false);
      showNextRoundBtn(false);

      const clueText = document.getElementById("codename_clueText");
      const clueCountText = document.getElementById("codename_clueCount");

      if (clueText && data.clue.clue) {
        clueText.classList.remove("hidden");
        clueText.textContent = data.clue.clue;
      }

      if (clueCountText && data.clue.count >= 0) {
        clueCountText.classList.remove("hidden");
        clueCountText.textContent = data.clue.count;
      }

      break;
    }

    case "nextRound": {
      if (countdownInterval) clearInterval(countdownInterval);
      const teamText = document.getElementById("codename_turnText");

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

      createWordCards(data.words, isPlayerSpymaster, playerTeam);
      showClueInput(data.currentTeam === playerTeam && isPlayerSpymaster);
      showNextRoundBtn(data.currentTeam === playerTeam && !isPlayerSpymaster);

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
