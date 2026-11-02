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

    if (count == -1) {
      nextRound(roomId);
      return;
    }

    if (!(count > -1 && count <= teamWordsLeft)) {
      emitNet(EVENTS.ERROR, sender, "notCorrectCount");
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
