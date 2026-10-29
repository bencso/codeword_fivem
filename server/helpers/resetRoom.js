function resetRoom(roomId, notify = true) {
  const room = rooms.get(roomId);
  if (!room) return;

  if (room.countDownTimer) clearTimeout(room.countDownTimer);

  room.countDownTimer = null;
  room.endsAt = null;
  room.state = "joinable";
  room.words = [];
  room.clue = null;
  room.currentTeam = null;
  room.players = room.players.map((p) => ({
    id: p.id,
    name: p.name,
    team: "",
  }));

  if (!notify) return;

  room.players.forEach((player) =>
    emitNet(EVENTS.DROPED_USER, player.id, roomId, room.players),
  );
}
