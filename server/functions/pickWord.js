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
