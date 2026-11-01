const rooms = new Map();
const placedBoards = new Map();

//#region PROP LETEVÉSE
onNet(EVENTS.PLACE_BOARD, async (pos) => {
  const src = source;

  const [px, py, pz] = GetEntityCoords(GetPlayerPed(src));
  if (Math.hypot(px - pos.x, py - pos.y, pz - pos.z) > 5) return;

  const obj = CreateObjectNoOffset(
    GetHashKey(PROP),
    pos.x,
    pos.y,
    pos.z,
    true,
    true,
    false,
  );

  let tries = 0;
  while (!DoesEntityExist(obj) && tries++ < 50) await Delay(10);
  if (!DoesEntityExist(obj)) return;

  SetEntityHeading(obj, pos.heading);
  FreezeEntityPosition(obj, true);
  SetEntityOrphanMode(obj, 2);

  placedBoards.set(NetworkGetNetworkIdFromEntity(obj), {
    entity: obj,
    owner: src,
  });
});
//#endregion

//#region PROP TÖRLÉSE
onNet(EVENTS.REMOVE_BOARD, (netId, roomId) => {
  const src = source;
  const board = placedBoards.get(netId);
  if (!board || board.owner !== src) return;

  const room = rooms.get(roomId);
  if (room && room.players.length > 0) return;

  const [px, py, pz] = GetEntityCoords(GetPlayerPed(src));
  const [bx, by, bz] = GetEntityCoords(board.entity);
  if (Math.hypot(px - bx, py - by, pz - bz) > 3.0) return;

  DeleteEntity(board.entity);
  placedBoards.delete(netId);
  rooms.delete(roomId);
});
//#endregion

//#region SZOBA LÉTREHOZÁSA
function createRoom(roomId, pos, joinedPlayerId) {
  const roomData = {
    id: roomId,
    createdBy: joinedPlayerId,
    pos,
    players: [],
    words: [],
    countDownTimer: null,
    endsAt: null,
    selectedWords: new Map(),
    skippingRound: new Set(),
    guesses: 0,
    clueHistory: [],
    state: "joinable",
  };

  rooms.set(roomId, roomData);
}

//#region SZOBÁBA BELÉPÉS
onNet(EVENTS.JOIN_ROOM, (roomId) => {
  const joinedPlayerId = source;

  const parts = String(roomId).split("_");
  const [bx, by, bz] = parts.slice(-3).map(Number);
  if (parts.length < 4 || [bx, by, bz].some(Number.isNaN)) return;

  const [px, py, pz] = GetEntityCoords(GetPlayerPed(joinedPlayerId));
  if (Math.hypot(px - bx, py - by, pz - bz) > 3.0) return;

  if (!rooms.has(roomId)) createRoom(roomId, [bx, by, bz], joinedPlayerId);

  const prevRoom = rooms.get(roomId);

  if (
    prevRoom.players.length > 0 &&
    prevRoom.players.find((p) => p.id === joinedPlayerId)
  )
    return;

  const joinedPlayerData = {
    id: joinedPlayerId,
    name: GetPlayerName(joinedPlayerId),
    team: "",
    isViewer: prevRoom.state !== "joinable",
  };

  const room = {
    ...prevRoom,
    players: [...prevRoom.players, joinedPlayerData],
  };

  rooms.set(roomId, room);

  if (room.state === "started") {
    emitNet(
      EVENTS.STARTED_GAME,
      joinedPlayerId,
      roomId,
      room.players.filter((p) => !p.isViewer),
      room.words,
      room.currentTeam,
      room.endsAt ? room.endsAt - Date.now() : null,
      true,
      room.clue,
      room.clueHistory,
    );
    return;
  }

  if (room.state !== "joinable") {
    emitNet(
      EVENTS.JOINED_ROOM,
      joinedPlayerId,
      roomId,
      joinedPlayerId,
      joinedPlayerData,
      room.players,
      false,
      null,
    );
    return;
  }

  if (
    room.state === "joinable" &&
    room.players.filter((p) => !p.isViewer).length >= MIN_PLAYERS &&
    !room.countDownTimer
  ) {
    room.endsAt = Date.now() + AFTERMIN_COUNTDOWN_MS;

    room.countDownTimer = setTimeout(() => {
      const currentRoom = rooms.get(roomId);
      if (!currentRoom) return;

      currentRoom.countDownTimer = null;
      currentRoom.endsAt = null;

      if (currentRoom.players.filter((p) => !p.isViewer).length < MIN_PLAYERS) {
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
      room.players.filter((p) => !p.isViewer).length >= MIN_PLAYERS,
      endsTime,
    ),
  );
});

//#region SPYMASTER VÁLASZTÓ
function switchSpymasterSelector(roomId) {
  if (rooms.size > 0 && rooms.has(roomId)) {
    const currentRoom = rooms.get(roomId);

    if (currentRoom.countDownTimer) clearTimeout(currentRoom.countDownTimer);

    // CSAPATOK KIOSZTÁSA
    const active = shuffle(currentRoom.players.filter((p) => !p.isViewer));
    let half = Math.floor(
      currentRoom.players.filter((p) => !p.isViewer).length / 2,
    );

    const players = [
      ...active.map((p, i) => ({ ...p, team: i < half ? TEAM_ONE : TEAM_TWO })),
      ...currentRoom.players.filter((p) => p.isViewer),
    ];

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

      if (currentRoom.players.filter((p) => !p.isViewer).length < MIN_PLAYERS) {
        resetRoom(roomId);

        return;
      }

      [TEAM_ONE, TEAM_TWO].forEach((team) => {
        const teamPlayers = currentRoom.players.filter(
          (p) => p.team === team && !p.isViewer,
        );
        if (teamPlayers.length === 0) return;
        if (teamPlayers.some((p) => p.spymaster)) return;

        shuffle(teamPlayers)[0].spymaster = true;
      });

      startGame(roomId);
    }, AFTERMIN_COUNTDOWN_MS);

    rooms.set(roomId, room);

    const endsTime = room.endsAt ? room.endsAt - Date.now() : null;

    room.players
      .filter((p) => !p.isViewer)
      .forEach((player) =>
        emitNet(
          EVENTS.SPYMASTER_SELECTION,
          player.id,
          roomId,
          room.players.filter((p) => !p.isViewer),
          endsTime,
        ),
      );
  }
}

//#region Spymaster pickelés
onNet(EVENTS.PICK_SPYMASTER, (roomId) => pickSpymaster(source, roomId));

function pickSpymaster(selectorId, roomId) {
  if (rooms.size > 0 && rooms.has(roomId)) {
    const currentRoom = rooms.get(roomId);

    const selector = currentRoom.players.find((p) => p.id === selectorId);

    if (!selector || selector.isViewer || currentRoom.state !== "selecting")
      return;

    const teamHasSpymaster = currentRoom.players.some(
      (p) => p.team === selector.team && p.spymaster,
    );

    if (teamHasSpymaster) return;

    currentRoom.players = currentRoom.players.map((p) =>
      p.id === selectorId ? { ...p, spymaster: true } : p,
    );

    currentRoom.players
      .filter((p) => !p.isViewer)
      .forEach((p) =>
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
}

//#region Játék indítása
function startGame(roomId) {
  if (rooms.size > 0 && rooms.has(roomId)) {
    const currentRoom = rooms.get(roomId);
    currentRoom.selectedWords.clear();
    currentRoom.guesses = 0;
    currentRoom.skippingRound.clear();
    currentRoom.clueHistory = [];

    if (currentRoom.state !== "selecting") return;

    // SZÖVEGEK KIOSZTÁSA
    const defaultWords = LoadResourceFile(GetCurrentResourceName(), WORDS_FILE)
      .split("\n")
      .map((w) => w.trim())
      .filter(Boolean);

    const selectedWords = shuffle(defaultWords).slice(0, 25);

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
      if (player.spymaster || player.isViewer) {
        emitNet(
          EVENTS.STARTED_GAME,
          player.id,
          roomId,
          room.players.filter((p) => !p.isViewer),
          words,
          startingTeam,
          endsTime,
          player.isViewer,
          room.clue,
          room.clueHistory,
        );
      } else {
        emitNet(
          EVENTS.STARTED_GAME,
          player.id,
          roomId,
          room.players.filter((p) => !p.isViewer),
          hideColors(room.words),
          startingTeam,
          endsTime,
          false,
          room.clue,
          room.clueHistory,
        );
      }
    });
  }
}

//#region SZOBÁBA KILÉPÉS
onNet(EVENTS.LEAVE_ROOM, (roomId) => {
  leaveRoom(roomId, source);
});
//#endregion

//#region CLUE ADD
onNet(EVENTS.ADD_CLUE, (roomId, clue, count) =>
  addClue(source, roomId, clue, count),
);

function addClue(sender, roomId, clue, count) {
  if (rooms.size > 0 && rooms.has(roomId)) {
    const currentRoom = rooms.get(roomId);

    if (!currentRoom.players.some((p) => p.id === sender && p.spymaster))
      return;

    const playerData = currentRoom.players.find((p) => p.id === sender);

    if (playerData.team !== currentRoom.currentTeam) return;
    if (currentRoom.clue && currentRoom.clue.clue) return;

    const trimmedClue = typeof clue === "string" ? clue.trim() : "";
    const teamWordsLeft = currentRoom.words.filter(
      (w) => w.team === playerData.team && !w.revealed,
    ).length;

    if (!Number.isInteger(count) || count < -1 || count > teamWordsLeft) {
      emitNet(EVENTS.ERROR, sender, "notCorrectCount");
      return;
    }
    if (count === -1) {
      nextRound(roomId);
      return;
    }
    if (trimmedClue.length <= 0) {
      emitNet(EVENTS.ERROR, sender, "notEnoughLength");
      return;
    }

    const isOnTable = currentRoom.words.some(
      (w) => w.word.toLowerCase() === trimmedClue.toLowerCase(),
    );
    if (isOnTable) {
      emitNet(EVENTS.ERROR, sender, "isOnTable");
      return;
    }
    if (currentRoom.countDownTimer) clearTimeout(currentRoom.countDownTimer);

    currentRoom.guesses = 0;

    const clueData = {
      clue: trimmedClue.toUpperCase(),
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

    room.clueHistory.push(clueData);

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
        room.clueHistory,
      );
    });
  }
}
//#endregion

//#region KÖVETKEZŐ ROUND
function nextRound(roomId) {
  if (rooms.size > 0 && rooms.has(roomId)) {
    const currentRoom = rooms.get(roomId);

    if (currentRoom.countDownTimer) clearTimeout(currentRoom.countDownTimer);
    currentRoom.selectedWords.clear();
    currentRoom.guesses = 0;
    currentRoom.skippingRound.clear();

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
      if (player.spymaster || player.isViewer) {
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
        emitNet(
          EVENTS.NEXT_ROUND,
          player.id,
          roomId,
          clueData.clue,
          clueData.count,
          hideColors(room.words),
          room.currentTeam,
          endsTime,
        );
      }
    });
  }
}
//#endregion

//#region SZÓMEGJELÖLÉS
onNet(EVENTS.PICK_WORD, (roomId, pickedWord) =>
  pickWord(source, roomId, pickedWord),
);

function pickWord(playerId, roomId, pickedWord) {
  if (rooms.size > 0 && rooms.has(roomId)) {
    const currentRoom = rooms.get(roomId);

    const playerData = currentRoom.players.find((p) => p.id === playerId);

    if (!playerData) return;
    if (playerData.spymaster || playerData.isViewer) return;
    if (
      currentRoom.state !== "started" ||
      currentRoom.currentTeam !== playerData.team ||
      !currentRoom.clue?.clue
    )
      return;

    const playerTeamPlayercount = currentRoom.players.filter(
      (p) => p.team == playerData.team && !p.spymaster && !p.isViewer,
    ).length;

    const pickedCard = currentRoom.words.findIndex(
      (w) => w.word === pickedWord,
    );

    if (pickedCard === -1) return;
    if (currentRoom.words[pickedCard].revealed) return;

    const playerWords = currentRoom.selectedWords.get(playerId) ?? [];

    if (playerWords.includes(pickedWord)) {
      const deletedWords = playerWords.filter((e) => e !== pickedWord);

      currentRoom.selectedWords.set(playerId, deletedWords);

      currentRoom.players.forEach((player) => {
        emitNet(
          EVENTS.VOTED_WORD,
          player.id,
          roomId,
          currentRoom.selectedWords.get(playerId),
          playerId,
          playerData.name,
        );
      });
      return;
    }

    currentRoom.selectedWords.set(playerId, [...playerWords, pickedWord]);
    currentRoom.players.forEach((player) => {
      emitNet(
        EVENTS.VOTED_WORD,
        player.id,
        roomId,
        currentRoom.selectedWords.get(playerId),
        playerId,
        playerData.name,
      );
    });

    const voteForWord = [...currentRoom.selectedWords.values()].filter(
      (words) => words.includes(pickedWord),
    ).length;

    if (voteForWord === playerTeamPlayercount) {
      currentRoom.words[pickedCard].revealed = true;

      currentRoom.selectedWords.forEach((words, voterId) => {
        currentRoom.selectedWords.set(
          voterId,
          words.filter((w) => w !== pickedWord),
        );
      });
      currentRoom.guesses++;

      const amountClue = currentRoom.clue.count - currentRoom.guesses;

      currentRoom.players.forEach((player) => {
        if (player.spymaster || player.isViewer) {
          emitNet(
            EVENTS.SELECTED_WORD,
            player.id,
            roomId,
            currentRoom.words,
            playerId,
            amountClue,
            currentRoom.clue.count,
          );
        } else {
          emitNet(
            EVENTS.SELECTED_WORD,
            player.id,
            roomId,
            hideColors(currentRoom.words),
            playerId,
            amountClue,
            currentRoom.clue.count,
          );
        }
      });

      const cardTeam = currentRoom.words[pickedCard].team;
      const cardsLeft = (team) =>
        currentRoom.words.filter((w) => w.team === team && !w.revealed).length;

      if (cardTeam === playerData.team) {
        if (cardsLeft(playerData.team) === 0) {
          endGame(roomId, playerData.team);
        } else if (
          currentRoom.clue.count > 0 &&
          currentRoom.guesses >= currentRoom.clue.count + 1
        ) {
          nextRound(roomId);
        } else {
          currentRoom.selectedWords.forEach((words, voterId) => {
            if (words.length === 0) return;
            const voter = currentRoom.players.find((p) => p.id === voterId);
            if (!voter) return;

            currentRoom.players.forEach((player) =>
              emitNet(
                EVENTS.VOTED_WORD,
                player.id,
                roomId,
                words,
                voterId,
                voter.name,
              ),
            );
          });
        }
      } else if (cardTeam === "black") {
        endGame(roomId, playerData.team === TEAM_ONE ? TEAM_TWO : TEAM_ONE);
      } else if (cardTeam === "") {
        nextRound(roomId);
      } else {
        if (cardsLeft(cardTeam) === 0) {
          endGame(roomId, cardTeam);
        } else {
          nextRound(roomId);
        }
      }
    }
  }
}
//#endregion

//#region END GAME
function endGame(roomId, winnerTeam) {
  if (rooms.size > 0 && rooms.has(roomId)) {
    const currentRoom = rooms.get(roomId);

    if (!currentRoom || currentRoom.state !== "started") return;
    if (currentRoom.countDownTimer) clearTimeout(currentRoom.countDownTimer);

    currentRoom.countDownTimer = null;
    currentRoom.endsAt = null;
    currentRoom.selectedWords.clear();
    currentRoom.skippingRound.clear();
    currentRoom.guesses = 0;
    currentRoom.state = "finished";

    currentRoom.endsAt = Date.now() + ROUND_COUNTDOWN_MS;

    const newGameAt = currentRoom.endsAt
      ? currentRoom.endsAt - Date.now()
      : null;

    currentRoom.players.forEach((player) => {
      emitNet(
        EVENTS.GAME_ENDED,
        player.id,
        roomId,
        currentRoom.words,
        winnerTeam,
        newGameAt,
      );
    });

    currentRoom.countDownTimer = setTimeout(() => {
      const room = rooms.get(roomId);
      if (!room || room.state !== "finished") return;

      resetRoom(roomId);
    }, END_SCREEN_MS);
  }
}
//#endregion

//#region KÖR UGRÁS
onNet(EVENTS.SKIP_ROUND, (roomId) => skipRound(source, roomId));

function skipRound(playerId, roomId) {
  if (rooms.size > 0 && rooms.has(roomId)) {
    const currentRoom = rooms.get(roomId);

    const playerData = currentRoom.players.find((p) => p.id === playerId);

    if (!playerData) return;
    if (playerData.spymaster || playerData.isViewer) return;
    if (
      currentRoom.state !== "started" ||
      currentRoom.currentTeam !== playerData.team ||
      !currentRoom.clue?.clue
    )
      return;

    const playerTeamPlayercount = currentRoom.players.filter(
      (p) => p.team == playerData.team && !p.spymaster && !p.isViewer,
    ).length;

    currentRoom.skippingRound.add(playerId);

    currentRoom.players
      .filter((p) => p.team == playerData.team)
      .forEach((pd) =>
        emitNet(
          EVENTS.VOTED_SKIP,
          pd.id,
          roomId,
          playerTeamPlayercount,
          currentRoom.skippingRound.size,
        ),
      );

    if (currentRoom.skippingRound.size === playerTeamPlayercount) {
      currentRoom.skippingRound.clear();
      nextRound(roomId);
    }
  }
}
//#endregion

//#region Lelép a játékos a szerverről
on("playerDropped", () => {
  const droppedId = source;

  for (const [roomId, room] of rooms) {
    if (room.players.some((p) => p.id === droppedId)) {
      leaveRoom(roomId, droppedId);
    }
  }
});

on("onResourceStop", (resourceName) => {
  if (resourceName !== GetCurrentResourceName()) return;

  for (const { entity } of placedBoards.values())
    if (DoesEntityExist(entity)) DeleteEntity(entity);
});
//#endregion
