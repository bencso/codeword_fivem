function resetRoom(roomId, notify = true) {
  const room = rooms.get(roomId);
  if (!room) return;

  if (room.countDownTimer) clearTimeout(room.countDownTimer);

  room.countDownTimer = null;
  room.endsAt = null;
  room.state = "joinable";
  room.words = [];
  room.clue = null;
  room.skippingRound = new Set();
  room.currentTeam = null;
  room.selectedWords = new Map();
  room.players = room.players.map((p) => ({
    id: p.id,
    name: p.name,
    team: "",
  }));
  room.guesses = 0;
  room.clueHistory = [];

  if (room.players.filter((p) => !p.isViewer).length >= MIN_PLAYERS) {
    room.endsAt = Date.now() + AFTERMIN_COUNTDOWN_MS;

    room.countDownTimer = setTimeout(() => {
      const currentRoom = rooms.get(roomId);
      if (!currentRoom) return;

      currentRoom.countDownTimer = null;
      currentRoom.endsAt = null;

      if (currentRoom.players.filter((p) => !p.isViewer).length < MIN_PLAYERS)
        return;

      switchSpymasterSelector(roomId);
    }, AFTERMIN_COUNTDOWN_MS);
  }

  if (!notify) return;

  const endsTime = room.endsAt ? room.endsAt - Date.now() : null;

  room.players.forEach((player) =>
    emitNet(EVENTS.DROPED_USER, player.id, roomId, room.players, endsTime),
  );
}
