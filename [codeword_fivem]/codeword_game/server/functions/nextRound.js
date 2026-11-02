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
