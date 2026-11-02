function pickSpymaster(selectorId, roomId) {
  if (rooms.size > 0 && rooms.has(roomId)) {
    const currentRoom = rooms.get(roomId);

    const selector = currentRoom.players.find((p) => p.id === selectorId);

    if (!selector || selector.isViewer || currentRoom.state !== "selecting")
      return;

    const teamHasSpymaster = currentRoom.players.some(
      (p) => p.team === selector.team && p.spymaster,
    );

    if (teamHasSpymaster) return;

    currentRoom.players = currentRoom.players.map((p) =>
      p.id === selectorId ? { ...p, spymaster: true } : p,
    );

    currentRoom.players
      .filter((p) => !p.isViewer)
      .forEach((p) =>
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
}
