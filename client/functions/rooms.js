//#region Szobába becsatlakozás
onNet(
  EVENTS.JOINED_ROOM,
  async (
    roomId,
    joinedPlayerId,
    joinedPlayerData,
    players,
    activePlayers,
    startsIn,
  ) => {
    const myId = GetPlayerServerId(PlayerId());
    console.log(roomId + "| Új játékos: " + joinedPlayerData.id);

    if (joinedPlayerId === myId) currentRoomId = roomId;

    const withPhotos = await Promise.all(
      players.map(async (p) => ({
        ...p,
        photo: await getPlayerHeadshot(p.id),
      })),
    );

    SendNuiMessage(
      JSON.stringify({
        action: "joined",
        roomId,
        joinedPlayerData,
        lobbyPlayers: withPhotos,
        playerId: myId,
        activePlayers,
        startsIn,
      }),
    );
  },
);
//#endregion

//#region Szobából kilépés
onNet(EVENTS.LEAVED_ROOM, (roomId, leaverId, lobbyPlayers, activePlayers) => {
  const myId = GetPlayerServerId(PlayerId());
  console.log(roomId + "| Kilépett játékos: " + leaverId);

  if (leaverId === myId) {
    currentRoomId = null;
    clearHeadshots();
  } else {
    removePlayerHeadshot(leaverId);
  }

  SendNuiMessage(
    JSON.stringify({
      action: "leaved",
      roomId,
      leaverId,
      playerId: myId,
      lobbyPlayers,
      activePlayers,
    }),
  );
});
//#endregion
