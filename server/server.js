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
    selectedWords: new Map(),
    skippingRound: new Set(),
    guesses: 0,
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
    currentRoom.selectedWords.clear();
    currentRoom.guesses = 0;
    currentRoom.skippingRound.clear();

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
        const wordsWithoutColor = room.words.map((word) => {
          return {
            word: word.word,
            team: word.revealed ? word.team : "",
            revealed: word.revealed,
          };
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
  leaveRoom(roomId, source);
});
//#endregion

//#region CLUE ADD
onNet(EVENTS.ADD_CLUE, (roomId, clue, count) => {
  const sender = source;

  if (rooms.size > 0 && rooms.has(roomId)) {
    const currentRoom = rooms.get(roomId);

    if (!currentRoom.players.some((p) => p.id === sender && p.spymaster))
      return;

    const playerData = currentRoom.players.find((p) => p.id === sender);
    const trimmedClue = typeof clue === "string" ? clue.trim() : "";
    const teamWordsLeft = currentRoom.words.filter(
      (w) => w.team === playerData.team && !w.revealed,
    ).length;

    if (playerData.team !== currentRoom.currentTeam) return;
    if (currentRoom.clue && currentRoom.clue.clue) return;
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
      (w) => w.word.toLowerCase() === trimmed.toLowerCase(),
    );
    if (isOnTable) {
      emitNet(EVENTS.ERROR, sender, "isOnTable");
      return;
    }
    if (currentRoom.countDownTimer) clearTimeout(currentRoom.countDownTimer);

    currentRoom.guesses = 0;

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
          return {
            word: word.word,
            team: word.revealed ? word.team : "",
            revealed: word.revealed,
          };
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

//#region SZÓMEGJELÖLÉS
onNet(EVENTS.PICK_WORD, (roomId, pickedWord) => {
  if (rooms.size > 0 && rooms.has(roomId)) {
    const currentRoom = rooms.get(roomId);

    const playerId = source;
    const playerData = currentRoom.players.find((p) => p.id === playerId);

    if (!playerData) return;
    if (playerData.spymaster) return;
    if (
      currentRoom.state !== "started" ||
      currentRoom.currentTeam !== playerData.team ||
      !currentRoom.clue?.clue
    )
      return;

    const playerTeamPlayercount = currentRoom.players.filter(
      (p) => p.team == playerData.team && !p.spymaster,
    ).length;

    const pickedCard = currentRoom.words.findIndex(
      (w) => w.word === pickedWord,
    );

    if (pickedCard === -1) return;
    if (currentRoom.words[pickedCard].revealed) return;

    if (currentRoom.selectedWords.get(playerId) === pickedWord) {
      currentRoom.selectedWords.delete(playerId);

      currentRoom.players.forEach((player) => {
        emitNet(
          EVENTS.VOTED_WORD,
          player.id,
          roomId,
          null,
          playerId,
          playerData.name,
        );
      });
      return;
    }

    currentRoom.selectedWords.set(playerId, pickedWord);
    currentRoom.players.forEach((player) => {
      emitNet(
        EVENTS.VOTED_WORD,
        player.id,
        roomId,
        pickedWord,
        playerId,
        playerData.name,
      );
    });

    const votes = [...currentRoom.selectedWords.values()];
    const allSame = votes.every((v) => v === votes[0]);

    if (currentRoom.selectedWords.size === playerTeamPlayercount && allSame) {
      currentRoom.words[pickedCard].revealed = true;
      currentRoom.selectedWords.clear();

      currentRoom.guesses++;

      const amountClue = currentRoom.clue.count + 1 - currentRoom.guesses;

      currentRoom.players.forEach((player) => {
        if (player.spymaster) {
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
          const wordsWithoutColor = currentRoom.words.map((word) => {
            return {
              word: word.word,
              team: word.revealed ? word.team : "",
              revealed: word.revealed,
            };
          });

          emitNet(
            EVENTS.SELECTED_WORD,
            player.id,
            roomId,
            wordsWithoutColor,
            playerId,
            amountClue,
            currentRoom.clue.count,
          );
        }
      });

      const cardTeam = currentRoom.words[pickedCard].team;
      const cardsLeft = (team) =>
        currentRoom.words.filter((w) => w.team === team && !w.revealed).length;
      const enemy = currentRoom.players.find(
        (p) => p.team != playerData.team,
      ).team;

      if (cardTeam === playerData.team) {
        if (cardsLeft(playerData.team) === 0) {
          endGame(roomId, playerData.team);
        } else if (
          currentRoom.clue.count > 0 &&
          currentRoom.guesses >= currentRoom.clue.count + 1
        ) {
          nextRound(roomId);
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
});
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

    currentRoom.players.forEach((player) => {
      emitNet(
        EVENTS.GAME_ENDED,
        player.id,
        roomId,
        currentRoom.words,
        winnerTeam,
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
onNet(EVENTS.SKIP_ROUND, (roomId) => {
  if (rooms.size > 0 && rooms.has(roomId)) {
    const currentRoom = rooms.get(roomId);

    const playerId = source;
    const playerData = currentRoom.players.find((p) => p.id === playerId);

    if (!playerData) return;
    if (playerData.spymaster) return;
    if (
      currentRoom.state !== "started" ||
      currentRoom.currentTeam !== playerData.team ||
      !currentRoom.clue?.clue
    )
      return;

    const playerTeamPlayercount = currentRoom.players.filter(
      (p) => p.team == playerData.team && !p.spymaster,
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
});
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
//#endregion
