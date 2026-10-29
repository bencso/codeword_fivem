//#region Szobából kilépett valaki, és alacsony szám
onNet(EVENTS.DROPED_USER, async (roomId, players) => {
  const myId = GetPlayerServerId(PlayerId());
  console.log(roomId + "| Megszakadt a játék, kevés játékos miatt");

  const withPhotos = await Promise.all(
    players.map(async (p) => ({
      ...p,
      photo: await getPlayerHeadshot(p.id),
    })),
  );

  SendNuiMessage(
    JSON.stringify({
      action: "userDroped",
      roomId,
      lobbyPlayers: withPhotos,
      playerId: myId,
    }),
  );
});
//#endregion

//#region Játék inditása
onNet(
  EVENTS.STARTED_GAME,
  async (roomId, players, words, startingTeam, endsTime) => {
    const myId = GetPlayerServerId(PlayerId());
    console.log(roomId + "| Játék elindult");

    const withPhotos = await Promise.all(
      players.map(async (p) => ({
        ...p,
        photo: await getPlayerHeadshot(p.id),
      })),
    );

    SendNuiMessage(
      JSON.stringify({
        action: "gameStarted",
        roomId,
        players,
        lobbyPlayers: withPhotos,
        playerId: myId,
        words,
        startingTeam,
        endsTime,
      }),
    );
  },
);
//#endregion
