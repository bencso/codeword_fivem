// #region Prop létrehozása
onNet(EVENTS.SPAWN_PROP, async (roomId, pos) => {
  console.log(roomId + "| Új szoba létrehozva: " + roomId);

  if (codeNameProps[roomId]) return;

  RequestModel(propModel);
  while (!HasModelLoaded(propModel)) await Delay(0);

  const obj = CreateObject(propModel, pos.x, pos.y, pos.z, false, false, false);
  SetEntityHeading(obj, pos.heading);
  PlaceObjectOnGroundProperly(obj);
  FreezeEntityPosition(obj, true);
  SetModelAsNoLongerNeeded(propModel);

  codeNameProps[roomId] = obj;
});
//#endregion

//#region Prop törlése
onNet(EVENTS.REMOVE_PROP, (roomId) => {
  if (codeNameProps[roomId] && DoesEntityExist(codeNameProps[roomId])) {
    DeleteEntity(codeNameProps[roomId]);
  }
  delete codeNameProps[roomId];

  if (roomId !== currentRoomId) return;

  currentRoomId = null;
  clearHeadshots();

  uiOpen = false;
  SetNuiFocus(false, false);
  SendNuiMessage(JSON.stringify({ action: "close" }));
});
//#endregion
