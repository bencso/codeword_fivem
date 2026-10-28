//#region Csapatok sorsolása | Csapatok választhatnak ki legyen a spymaster
onNet(EVENTS.SPYMASTER_SELECTION, async (roomId, players, startsIn) => {
  console.log(roomId + "| Játék indul");

  const withPhotos = await Promise.all(
    players.map(async (p) => ({
      ...p,
      photo: await getPlayerHeadshot(p.id),
    })),
  );

  SendNuiMessage(
    JSON.stringify({
      action: "spymaster_selection",
      roomId,
      players: withPhotos,
      startsIn,
    }),
  );
});
//#endregion
