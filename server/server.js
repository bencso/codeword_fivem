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
    endsAt: null,
    state: "joinable",
  };

  rooms.set(roomId, roomData);

  emitNet(EVENTS.SPAWN_PROP, -1, roomId, pos);
});

//#region SZOBA TÖRLÉSE / PROP TÖRLÉSE
onNet(EVENTS.REMOVE_ROOM, (roomId) => {
  const playerId = source;

  if (!rooms.has(roomId)) return;

  const room = rooms.get(roomId);
  const canRemove = room.state === "joinable" || playerId === room.createdBy;
  if (!canRemove) return;

  rooms.delete(roomId);
  emitNet(EVENTS.REMOVE_PROP, -1, roomId);
});

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

    const room = {
      ...prevRoom,
      players: [...prevRoom.players, joinedPlayerData],
    };

    rooms.set(roomId, room);

    if (room.players.length >= MIN_PLAYERS && !room.countDownTimer) {
      room.endsAt = Date.now() + AFTERMIN_COUNTDOWN_MS;

      room.countDownTimer = setTimeout(() => {
        const currentRoom = rooms.get(roomId);
        if (!currentRoom) return;

        currentRoom.countDownTimer = null;
        currentRoom.endsAt = null;

        if (currentRoom.players.length < MIN_PLAYERS) {
          resetRoom(roomId);
          return;
        }

        switchSpymasterSelector(roomId);
      }, AFTERMIN_COUNTDOWN_MS);
    }

    const endsTime = room.endsAt ? room.endsAt - Date.now() : null;

    room.players.forEach((player) =>
      emitNet(
        EVENTS.JOINED_ROOM,
        player.id,
        roomId,
        joinedPlayerId,
        joinedPlayerData,
        room.players,
        room.players.length >= MIN_PLAYERS,
        endsTime,
      ),
    );
  }
});

//#region SPYMASTER VÁLASZTÓ
function switchSpymasterSelector(roomId) {
  if (rooms.size > 0 && rooms.has(roomId)) {
    const currentRoom = rooms.get(roomId);

    if (currentRoom.countDownTimer) clearTimeout(currentRoom.countDownTimer);

    // CSAPATOK KIOSZTÁSA
    let half = Math.floor(currentRoom.players.length / 2);

    const players = shuffle(currentRoom.players).map((p, i) => ({
      ...p,
      team: i < half ? TEAM_ONE : TEAM_TWO,
    }));

    const room = {
      ...currentRoom,
      players,
      state: "selecting",
    };

    room.endsAt = Date.now() + AFTERMIN_COUNTDOWN_MS;

    room.countDownTimer = setTimeout(() => {
      const currentRoom = rooms.get(roomId);
      if (!currentRoom || currentRoom.state !== "selecting") return;

      currentRoom.countDownTimer = null;
      currentRoom.endsAt = null;

      if (currentRoom.players.length < MIN_PLAYERS) {
        resetRoom(roomId);

        return;
      }

      [TEAM_ONE, TEAM_TWO].forEach((team) => {
        const teamPlayers = currentRoom.players.filter((p) => p.team === team);
        if (teamPlayers.length === 0) return;
        if (teamPlayers.some((p) => p.spymaster)) return;

        shuffle(teamPlayers)[0].spymaster = true;
      });

      startGame(roomId);
    }, AFTERMIN_COUNTDOWN_MS);

    rooms.set(roomId, room);

    const endsTime = room.endsAt ? room.endsAt - Date.now() : null;

    room.players.forEach((player) =>
      emitNet(
        EVENTS.SPYMASTER_SELECTION,
        player.id,
        roomId,
        room.players,
        endsTime,
      ),
    );
  }
}

//#region Spymaster pickelés
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
      emitNet(
        EVENTS.SPYMASTER_SELECTED,
        p.id,
        roomId,
        currentRoom.players,
        selector.team,
      ),
    );

    const bothReady =
      currentRoom.players.some((p) => p.team === TEAM_ONE && p.spymaster) &&
      currentRoom.players.some((p) => p.team === TEAM_TWO && p.spymaster);

    if (!bothReady) return;

    startGame(roomId);
  }
});

//#region Játék indítása
function startGame(roomId) {
  if (rooms.size > 0 && rooms.has(roomId)) {
    const currentRoom = rooms.get(roomId);

    if (currentRoom.state !== "selecting") return;

    // SZÖVEGEK KIOSZTÁSA
    const defaultWords = LoadResourceFile(GetCurrentResourceName(), WORDS_FILE)
      .split("\n")
      .map((w) => w.trim())
      .filter(Boolean);

    const selectedWords = shuffle(defaultWords).slice(0, RANDOM_WORDS);

    const startingTeam = Math.random() < 0.5 ? TEAM_ONE : TEAM_TWO;
    const otherTeam = startingTeam === TEAM_ONE ? TEAM_TWO : TEAM_ONE;

    const startingTeamWordCount = ONE_TEAM_WORDS;
    const otherTeamWordCount = startingTeamWordCount - 1;
    const neutralWordCount =
      selectedWords.length - startingTeamWordCount - otherTeamWordCount - 1;

    const colors = shuffle([
      ...Array(startingTeamWordCount).fill(startingTeam),
      ...Array(otherTeamWordCount).fill(otherTeam),
      ...Array(neutralWordCount).fill(""),
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
      state: "started",
      currentTeam: startingTeam,
    };

    room.endsAt = Date.now() + ROUND_COUNTDOWN_MS;
    room.countDownTimer = setTimeout(() => {
      const currentRoom = rooms.get(roomId);
      if (!currentRoom || currentRoom.state !== "started") return;

      nextRound(roomId);
    }, ROUND_COUNTDOWN_MS);

    rooms.set(roomId, room);

    const endsTime = room.endsAt ? room.endsAt - Date.now() : null;

    room.players.forEach((player) => {
      if (player.spymaster) {
        emitNet(
          EVENTS.STARTED_GAME,
          player.id,
          roomId,
          room.players,
          words,
          startingTeam,
          endsTime,
        );
      } else {
        const wordsWithoutColor = words.map((word) => {
          return { word: word.word, revealed: word.revealed };
        });

        emitNet(
          EVENTS.STARTED_GAME,
          player.id,
          roomId,
          room.players,
          wordsWithoutColor,
          startingTeam,
          endsTime,
        );
      }
    });
  }
}

//#region SZOBÁBA KILÉPÉS
onNet(EVENTS.LEAVE_ROOM, (roomId) => {
  const leaverId = source;

  if (rooms.size > 0 && rooms.has(roomId)) {
    const currentRoom = rooms.get(roomId);

    if (!currentRoom.players.some((p) => p.id === leaverId)) return;

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

    if (
      room.state === "joinable" &&
      room.players.length < MIN_PLAYERS &&
      room.countDownTimer
    )
      resetRoom(roomId);
  }
});

//#region CLUE ADD
onNet(EVENTS.ADD_CLUE, (roomId, clue, count) => {
  const sender = source;

  if (rooms.size > 0 && rooms.has(roomId)) {
    const currentRoom = rooms.get(roomId);

    if (!currentRoom.players.some((p) => p.id === sender && p.spymaster))
      return;

    const playerData = currentRoom.players.find((p) => p.id === sender);

    if (playerData.team !== currentRoom.currentTeam) return;
    if (currentRoom.clue && currentRoom.clue.clue) return;
    if (currentRoom.countDownTimer) clearTimeout(currentRoom.countDownTimer);

    const clueData = {
      clue,
      count,
      team: playerData.team,
    };

    const room = {
      ...currentRoom,
      clue: clueData,
      currentTeam: clueData.team,
    };

    room.endsAt = Date.now() + ROUND_COUNTDOWN_MS;

    room.countDownTimer = setTimeout(() => {
      const currentRoom = rooms.get(roomId);
      if (!currentRoom || currentRoom.state !== "started") return;

      nextRound(roomId);
    }, ROUND_COUNTDOWN_MS);

    rooms.set(roomId, room);

    const endsTime = room.endsAt ? room.endsAt - Date.now() : null;

    room.players.forEach((player) => {
      emitNet(
        EVENTS.ADDED_CLUE,
        player.id,
        roomId,
        clueData,
        count,
        room.currentTeam,
        endsTime,
      );
    });
  }
});
//#endregion

//#region KÖVETKEZŐ ROUND
function nextRound(roomId) {
  if (rooms.size > 0 && rooms.has(roomId)) {
    const currentRoom = rooms.get(roomId);

    if (currentRoom.countDownTimer) clearTimeout(currentRoom.countDownTimer);
    const enemy = currentRoom.currentTeam === TEAM_ONE ? TEAM_TWO : TEAM_ONE;

    const clueData = {
      clue: "",
      count: 0,
      team: enemy,
    };

    const room = {
      ...currentRoom,
      clue: clueData,
      currentTeam: enemy,
    };

    room.endsAt = Date.now() + ROUND_COUNTDOWN_MS;

    room.countDownTimer = setTimeout(() => {
      const currentRoom = rooms.get(roomId);
      if (!currentRoom || currentRoom.state !== "started") return;

      nextRound(roomId);
    }, ROUND_COUNTDOWN_MS);

    rooms.set(roomId, room);

    const endsTime = room.endsAt ? room.endsAt - Date.now() : null;

    room.players.forEach((player) => {
      if (player.spymaster) {
        emitNet(
          EVENTS.NEXT_ROUND,
          player.id,
          roomId,
          clueData.clue,
          clueData.count,
          room.words,
          room.currentTeam,
          endsTime,
        );
      } else {
        const wordsWithoutColor = room.words.map((word) => {
          return { word: word.word, revealed: word.revealed };
        });

        emitNet(
          EVENTS.NEXT_ROUND,
          player.id,
          roomId,
          clueData.clue,
          clueData.count,
          wordsWithoutColor,
          room.currentTeam,
          endsTime,
        );
      }
    });
  }
}
//#endregion
