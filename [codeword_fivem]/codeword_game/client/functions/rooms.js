//#region Szobába becsatlakozás
onNet(
  EVENTS.JOINED_ROOM,
  async (
    roomId,
    joinedPlayerId,
    joinedPlayerData,
    players,
    activePlayers,
    endsTime,
  ) => {
    const playerId = GetPlayerServerId(PlayerId());
    console.log(roomId + "| Új játékos: " + joinedPlayerData.id);

    if (joinedPlayerId === playerId) currentRoomId = roomId;

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
        playerId,
        activePlayers,
        endsTime,
      }),
    );
  },
);
//#endregion

//#region Szobából kilépés
onNet(
  EVENTS.LEAVED_ROOM,
  async (roomId, leaverId, lobbyPlayers, activePlayers) => {
    console.log(roomId + "| Kilépett játékos: " + leaverId);

    const playerId = GetPlayerServerId(PlayerId());

    if (leaverId === playerId) {
      currentRoomId = null;
      clearHeadshots();
    } else {
      removePlayerHeadshot(leaverId);
    }

    const withPhotos = await Promise.all(
      lobbyPlayers.map(async (p) => ({
        ...p,
        photo: await getPlayerHeadshot(p.id),
      })),
    );

    SendNuiMessage(
      JSON.stringify({
        action: "leaved",
        roomId,
        leaverId,
        lobbyPlayers: withPhotos,
        activePlayers,
      }),
    );
  },
);
//#endregion
