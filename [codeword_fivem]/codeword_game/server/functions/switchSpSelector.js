//#region SPYMASTER VÁLASZTÓ
function switchSpymasterSelector(roomId) {
  if (rooms.size > 0 && rooms.has(roomId)) {
    const currentRoom = rooms.get(roomId);

    if (currentRoom.countDownTimer) clearTimeout(currentRoom.countDownTimer);

    const activePlayers = shuffle(
      currentRoom.players.filter((p) => !p.isViewer),
    );
    let half = Math.floor(
      currentRoom.players.filter((p) => !p.isViewer).length / 2,
    );

    const players = [
      ...activePlayers.map((p, i) => ({
        ...p,
        team: i < half ? TEAM_ONE : TEAM_TWO,
      })),
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
