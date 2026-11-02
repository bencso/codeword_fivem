function skipRound(playerId, roomId) {
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

    currentRoom.skippingRound.add(playerId);

    currentRoom.players
      .filter((p) => p.team == playerData.team)
      .forEach((pd) =>
        emitNet(
          EVENTS.VOTED_SKIP,
          pd.id,
          roomId,
          playerTeamPlayercount,
          currentRoom.skippingRound.size,
        ),
      );

    if (currentRoom.skippingRound.size === playerTeamPlayercount) {
      currentRoom.skippingRound.clear();
      nextRound(roomId);
    }
  }
}
