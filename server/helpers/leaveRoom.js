function leaveRoom(roomId, leaverId) {
  if (!rooms.has(roomId)) return;

  const currentRoom = rooms.get(roomId);
  const leaver = currentRoom.players.find((p) => p.id === leaverId);
  if (!leaver) return;

  const room = {
    ...currentRoom,
    players: currentRoom.players.filter((p) => p.id !== leaverId),
  };

  if (room.selectedWords && room.selectedWords.has(leaverId)) {
    room.selectedWords.delete(leaverId);
    currentRoom.players.forEach((player) => {
      emitNet(
        EVENTS.VOTED_WORD,
        player.id,
        roomId,
        null,
        leaverId,
        leaver.name,
      );
    });
  }

  room.skippingRound?.delete(leaverId);
  rooms.set(roomId, room);

  emitNet(
    EVENTS.LEAVED_ROOM,
    leaverId,
    roomId,
    leaverId,
    room.players,
    room.players.filter((p) => !p.isViewer).length >= MIN_PLAYERS,
  );

  room.players.forEach((player) =>
    emitNet(
      EVENTS.LEAVED_ROOM,
      player.id,
      roomId,
      leaverId,
      room.players,
      room.players.filter((p) => !p.isViewer).length >= MIN_PLAYERS,
    ),
  );

  if (room.state === "joinable" && room.players.length === 0) {
    if (room.countDownTimer) clearTimeout(room.countDownTimer);
    rooms.delete(roomId);
    return;
  }

  if (
    room.state === "joinable" &&
    room.players.filter((p) => !p.isViewer).length < MIN_PLAYERS &&
    room.countDownTimer
  ) {
    resetRoom(roomId);
    return;
  }

  if (room.state !== "selecting" && room.state !== "started") return;

  const teamEmpty = [TEAM_ONE, TEAM_TWO].some(
    (t) => !room.players.some((p) => p.team === t),
  );

  if (
    room.players.filter((p) => !p.isViewer).length < MIN_PLAYERS ||
    teamEmpty
  ) {
    resetRoom(roomId);
    return;
  }

  if (room.state === "started" && leaver.spymaster) {
    const teamPlayers = room.players.filter(
      (p) => p.team === leaver.team && !p.isViewer,
    );

    if (teamPlayers.length < 2) {
      resetRoom(roomId);
      return;
    }

    const newSpymaster = shuffle(teamPlayers)[0];
    newSpymaster.spymaster = true;

    room.players.forEach((p) =>
      emitNet(
        EVENTS.SPYMASTER_CHANGED,
        p.id,
        roomId,
        newSpymaster.id,
        room.players,
      ),
    );

    if (room.currentTeam === leaver.team) {
      room.currentTeam = leaver.team === TEAM_ONE ? TEAM_TWO : TEAM_ONE;
      nextRound(roomId);
    }
  }
}
