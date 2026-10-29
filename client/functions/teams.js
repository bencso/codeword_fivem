//#region Csapatok sorsolása | Csapatok választhatnak ki legyen a spymaster
onNet(EVENTS.SPYMASTER_SELECTION, async (roomId, players, endsTime) => {
  console.log(roomId + "| Játék indul");

  const withPhotos = await Promise.all(
    players.map(async (p) => ({
      ...p,
      photo: await getPlayerHeadshot(p.id),
    })),
  );

  SendNuiMessage(
    JSON.stringify({
      action: "spymasterSelection",
      roomId,
      players: withPhotos,
      endsTime,
    }),
  );
});
//#endregion

//#region Spymaster kiválasztva
onNet(
  EVENTS.SPYMASTER_SELECTED,
  async (roomId, lobbyPlayers, spymasterTeam) => {
    console.log(roomId + "| Spymaster kiválasztva");


    const withPhotos = await Promise.all(
      lobbyPlayers.map(async (p) => ({
        ...p,
        photo: await getPlayerHeadshot(p.id),
      })),
    );

    SendNuiMessage(
      JSON.stringify({
        action: "spymasterSelected",
        roomId,
        lobbyPlayers: withPhotos,
        spymasterTeam,
      }),
    );
  },
);
//#endregion
