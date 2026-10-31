// =========================================================
//  CODENAMES – TESZT BOTOK (csak fejlesztéshez!)
//  Élesben: consts.js → const DEBUG = false;
//
//  Parancsok (a szobában állva):
//    /cn_bots [szám]   – botok hozzáadása (alap: 3)
//    /cn_start         – visszaszámlálás átugrása
//    /cn_botsclear     – botok eltávolítása
// =========================================================

const BOT_TICK_MS = 2000; // ennyi időnként lép egyet egy bot
let nextBotId = -100; // negatív id: nem ütközik valódi játékossal (a -1 tilos, az "mindenki"!)
let botClueNo = 0;

function findPlayerRoom(src) {
  for (const [roomId, room] of rooms)
    if (room.players.some((p) => p.id === src)) return [roomId, room];
  return [null, null];
}

function startLobbyCountdownIfReady(roomId) {
  const room = rooms.get(roomId);
  if (!room || room.state !== "joinable" || room.countDownTimer) return;
  if (room.players.filter((p) => !p.isViewer).length < MIN_PLAYERS) return;

  room.endsAt = Date.now() + AFTERMIN_COUNTDOWN_MS;
  room.countDownTimer = setTimeout(() => {
    const current = rooms.get(roomId);
    if (!current) return;

    current.countDownTimer = null;
    current.endsAt = null;

    if (current.players.filter((p) => !p.isViewer).length < MIN_PLAYERS) {
      resetRoom(roomId);
      return;
    }
    switchSpymasterSelector(roomId);
  }, AFTERMIN_COUNTDOWN_MS);
}

//#region PARANCSOK
RegisterCommand(
  "cn_bots",
  (src, args) => {
    if (!DEBUG || src <= 0) return;

    const [roomId, room] = findPlayerRoom(src);
    if (!room) return console.log("[cn_bots] Előbb lépj be egy szobába!");
    if (room.state !== "joinable")
      return console.log("[cn_bots] Csak a lobbyban lehet botot hozzáadni.");

    const count = Math.max(1, Math.min(8, Number(args[0]) || 3));
    let lastBot = null;

    for (let i = 0; i < count; i++) {
      const id = nextBotId--;
      lastBot = {
        id,
        name: `Bot ${-id - 99}`,
        team: "",
        isViewer: false,
        isBot: true,
      };
      room.players.push(lastBot);
    }

    startLobbyCountdownIfReady(roomId);

    const endsTime = room.endsAt ? room.endsAt - Date.now() : null;
    const enough =
      room.players.filter((p) => !p.isViewer).length >= MIN_PLAYERS;

    room.players
      .filter((p) => !p.isBot)
      .forEach((player) =>
        emitNet(
          EVENTS.JOINED_ROOM,
          player.id,
          roomId,
          lastBot.id,
          lastBot,
          room.players,
          enough,
          endsTime,
        ),
      );
  },
  false,
);

RegisterCommand(
  "cn_start",
  (src) => {
    if (!DEBUG || src <= 0) return;

    const [roomId, room] = findPlayerRoom(src);
    if (!room || room.state !== "joinable") return;
    if (room.players.filter((p) => !p.isViewer).length < MIN_PLAYERS) return;

    switchSpymasterSelector(roomId); // a saját timerét törli
  },
  false,
);

RegisterCommand(
  "cn_botsclear",
  (src) => {
    if (!DEBUG || src <= 0) return;

    const [roomId, room] = findPlayerRoom(src);
    if (!room) return;

    room.players
      .filter((p) => p.isBot)
      .forEach((bot) => leaveRoom(roomId, bot.id));
  },
  false,
);
//#endregion

//#region BOT VISELKEDÉS
function chooseBotWord(room, team) {
  const open = room.words.filter((w) => !w.revealed);
  const own = open.filter((w) => w.team === team);
  const pool = own.length && Math.random() < 0.7 ? own : open; // 70%-ban a saját kártyáját találja el
  return pool[Math.floor(Math.random() * pool.length)].word;
}

// Kémfőnökválasztás: ahol csak bot van a csapatban, egy bot jelentkezik.
// Ahol ember is van, ő dönt (vagy a timer sorsol).
function botsPickSpymaster(roomId) {
  for (const team of [TEAM_ONE, TEAM_TWO]) {
    const room = rooms.get(roomId);
    if (!room || room.state !== "selecting") return;

    const teamPlayers = room.players.filter(
      (p) => p.team === team && !p.isViewer,
    );
    if (teamPlayers.some((p) => p.spymaster)) continue;
    if (teamPlayers.some((p) => !p.isBot)) continue;

    const bot = teamPlayers.find((p) => p.isBot);
    if (bot) pickSpymaster(bot.id, roomId);
  }
}

// Játék: tickenként legfeljebb egy lépés, hogy követhető legyen.
function botsPlay(roomId) {
  const room = rooms.get(roomId);
  if (!room || room.state !== "started") return;

  const team = room.currentTeam;
  const teamPlayers = room.players.filter(
    (p) => p.team === team && !p.isViewer,
  );
  const spymaster = teamPlayers.find((p) => p.spymaster);

  // 1) Tipp – ha a kémfőnök bot
  if (!room.clue?.clue) {
    if (spymaster?.isBot) {
      const left = room.words.filter(
        (w) => w.team === team && !w.revealed,
      ).length;
      addClue(spymaster.id, roomId, `TIPP${++botClueNo}`, Math.min(2, left));
    }
    return;
  }

  const guessers = teamPlayers.filter((p) => !p.spymaster);
  const botGuessers = guessers.filter((p) => p.isBot);
  if (botGuessers.length === 0) return;
  const humans = guessers.filter((p) => !p.isBot);

  // 2) Skip – ha egy ember skippel, a botok is
  if (humans.some((h) => room.skippingRound.has(h.id))) {
    const bot = botGuessers.find((b) => !room.skippingRound.has(b.id));
    if (bot) skipRound(bot.id, roomId);
    return;
  }

  // 3) Szavazás – ha van ember a csapatban, a botok az ő szavazatát másolják,
  //    ha csak botok vannak, az első választ, a többi követi
  let target = null;
  if (humans.length) {
    target =
      humans.map((h) => room.selectedWords.get(h.id)).find(Boolean) ?? null;
  } else {
    target =
      room.selectedWords.get(botGuessers[0].id) ?? chooseBotWord(room, team);
  }
  if (!target) return;

  // ugyanarra a szóra újra szavazni = visszavonás, ezért csak aki még nem arra szavazott
  const bot = botGuessers.find((b) => room.selectedWords.get(b.id) !== target);
  if (bot) pickWord(bot.id, roomId, target);
}

setInterval(() => {
  if (!DEBUG) return;

  for (const [roomId, room] of rooms) {
    if (!room.players.some((p) => p.isBot)) continue;

    if (room.state === "selecting") botsPickSpymaster(roomId);
    else if (room.state === "started") botsPlay(roomId);
  }
}, BOT_TICK_MS);
//#endregion
