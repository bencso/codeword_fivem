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
