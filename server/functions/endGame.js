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
