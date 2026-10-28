const rooms = new Map();

//#region SZOBA LÉTREHOZÁSA / PROP LETEVÉSE
onNet(EVENTS.CREATE_ROOM, (pos) => {
  const src = source;
  const roomId = crypto.randomUUID();

  const roomData = {
    id: roomId,
    createdBy: src,
    pos,
    players: [],
    words: [],
    countDownTimer: null,
    startsAt: null,
    state: "joinable",
  };

  rooms.set(roomId, roomData);

  emitNet(EVENTS.SPAWN_PROP, -1, roomId, pos);
});

//#region SZOBA TÖRLÉSE / PROP TÖRLÉSE

//#region SZOBÁBA BELÉPÉS
onNet(EVENTS.JOIN_ROOM, (roomId) => {
  const joinedPlayerId = source;

  if (rooms.size > 0 && rooms.has(roomId)) {
    const prevRoom = rooms.get(roomId);

    if (
      prevRoom.players.length > 0 &&
      prevRoom.players.find((p) => p.id === joinedPlayerId)
    )
      return;
    if (prevRoom.state !== "joinable") return;

    const joinedPlayerData = {
      id: joinedPlayerId,
      name: GetPlayerName(joinedPlayerId),
      team: "",
    };
    onNet(EVENTS.REMOVE_ROOM, (roomId) => {
      const playerId = source;

      if (!rooms.has(roomId)) return;

      const room = rooms.get(roomId);
      const canRemove =
        room.state === "joinable" || playerId === room.createdBy;
      if (!canRemove) return;

      rooms.delete(roomId);
      emitNet(EVENTS.REMOVE_PROP, -1, roomId);
    });

    const room = {
      ...prevRoom,
      players: [...prevRoom.players, joinedPlayerData],
    };

    rooms.set(roomId, room);

    if (room.players.length >= MIN_PLAYERS && !room.countDownTimer) {
      room.startsAt = Date.now() + AFTERMIN_COUNTDOWN_MS;

      room.countDownTimer = setTimeout(() => {
        const currentRoom = rooms.get(roomId);
        if (!currentRoom) return;

        currentRoom.countDownTimer = null;
        currentRoom.startsAt = null;

        if (currentRoom.players.length < MIN_PLAYERS) return;

        startGame(roomId);
      }, AFTERMIN_COUNTDOWN_MS);
    }

    const startsIn = room.startsAt ? room.startsAt - Date.now() : null;

    room.players.forEach((player) =>
      emitNet(
        EVENTS.JOINED_ROOM,
        player.id,
        roomId,
        joinedPlayerId,
        joinedPlayerData,
        room.players,
        room.players.length >= MIN_PLAYERS,
        startsIn,
      ),
    );
  }
});

//#region JÁTÉK INDITÁSA | SPYMASTER VÁLASZTÓ
function startGame(roomId) {
  if (rooms.size > 0 && rooms.has(roomId)) {
    const currentRoom = rooms.get(roomId);

    if (currentRoom.countDownTimer) clearTimeout(currentRoom.countDownTimer);

    // CSAPATOK KIOSZTÁSA
    let half = Math.floor(currentRoom.players.length / 2);

    const players = shuffle(currentRoom.players).map((p, i) => ({
      ...p,
      team: i < half ? TEAM_ONE : TEAM_TWO,
    }));

    const startsIn = Date.now() + AFTERMIN_COUNTDOWN_MS;

    const room = {
      ...currentRoom,
      players,
      startsAt: startsIn,
      state: "selecting",
    };

    rooms.set(roomId, room);

    room.players.forEach((player) =>
      emitNet(
        EVENTS.SPYMASTER_SELECTION,
        player.id,
        roomId,
        room.players,
        room.startsAt - Date.now(),
      ),
    );
  }
}

onNet(EVENTS.PICK_SPYMASTER, (roomId) => {
  if (rooms.size > 0 && rooms.has(roomId)) {
    const currentRoom = rooms.get(roomId);

    const selectorId = source;
    const selector = currentRoom.players.find((p) => p.id === selectorId);
    if (!selector || currentRoom.state !== "selecting") return;

    const teamHasSpymaster = currentRoom.players.some(
      (p) => p.team === selector.team && p.spymaster,
    );

    if (teamHasSpymaster) return;

    currentRoom.players = currentRoom.players.map((p) =>
      p.id === selectorId ? { ...p, spymaster: true } : p,
    );

    currentRoom.players.forEach((p) =>
      emitNet(EVENTS.SPYMASTER_SELECTED, p.id, roomId, currentRoom.players),
    );

    const bothReady =
      currentRoom.players.some((p) => p.team === TEAM_ONE && p.spymaster) &&
      currentRoom.players.some((p) => p.team === TEAM_TWO && p.spymaster);

    if (!bothReady) return;

    // SZÖVEGEK KIOSZTÁSA
    const defaultWords = LoadResourceFile(GetCurrentResourceName(), WORDS_FILE)
      .split("\n")
      .map((w) => w.trim())
      .filter(Boolean);

    const selectedWords = shuffle(defaultWords).slice(0, RANDOM_WORDS);

    const startingTeam = Math.random() < 0.5 ? TEAM_ONE : TEAM_TWO;
    const otherTeam = startingTeam === TEAM_ONE ? TEAM_TWO : TEAM_ONE;

    const colors = shuffle([
      ...Array(9).fill(startingTeam),
      ...Array(8).fill(otherTeam),
      ...Array(7).fill(""),
      "black",
    ]);

    const words = selectedWords.map((word, i) => ({
      word,
      team: colors[i],
      revealed: false,
    }));

    const room = {
      ...currentRoom,
      words,
      startsAt: null,
      state: "started",
    };

    rooms.set(roomId, room);

    room.players.forEach((player) =>
      emitNet(EVENTS.STARTED_GAME, player.id, roomId, room.players, words),
    );
  }
});

//#region SZOBÁBA KILÉPÉS
onNet(EVENTS.LEAVE_ROOM, (roomId) => {
  const leaverId = source;

  if (!currentRoom.players.some((p) => p.id === leaverId)) return;

  if (rooms.size > 0 && rooms.has(roomId)) {
    const currentRoom = rooms.get(roomId);

    const room = {
      ...currentRoom,
      players: currentRoom.players.filter((p) => p.id !== leaverId),
    };

    rooms.set(roomId, room);

    emitNet(
      EVENTS.LEAVED_ROOM,
      leaverId,
      roomId,
      leaverId,
      room.players,
      room.players.length >= MIN_PLAYERS,
    );

    room.players.forEach((player) =>
      emitNet(
        EVENTS.LEAVED_ROOM,
        player.id,
        roomId,
        leaverId,
        room.players,
        room.players.length >= MIN_PLAYERS,
      ),
    );

    if (room.players.length < MIN_PLAYERS && room.countDownTimer) {
      clearTimeout(room.countDownTimer);
      room.countDownTimer = null;
      room.startsAt = null;

      room.state = "joinable";
    }
  }
});
