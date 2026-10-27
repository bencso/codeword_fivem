const codeNameProps = {};
const propModel = GetHashKey(PROP);

RegisterCommand(
  "codename",
  () => {
    const ped = PlayerPedId();
    const [x, y, z] = GetOffsetFromEntityInWorldCoords(ped, 0.0, 1.0, 0.0);
    const heading = GetEntityHeading(ped) + 180.0;
    const pos = { x, y, z, heading };

    emitNet(EVENTS.CREATE_ROOM, pos);
  },
  false,
);

// #region Prop létrehozása
onNet(EVENTS.SPAWN_PROP, async (roomId, pos) => {
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
  console.log(roomId);

  if (codeNameProps[roomId] && DoesEntityExist(codeNameProps[roomId])) {
    DeleteEntity(codeNameProps[roomId]);

    uiOpen = false;
    SetNuiFocus(false, false);
    SendNuiMessage(JSON.stringify({ action: "close" }));
  }
});
//#endregion

//#region Szobába becsatlakozás
onNet(EVENTS.JOINED_ROOM, (roomId, joinedPlayerId, lobbyPlayers) => {
  console.log(roomId + "| Új játékos: " + joinedPlayerId);

  SendNuiMessage(
    JSON.stringify({
      action: "joined",
      roomId,
      joinedPlayerId,
      playerId: GetPlayerServerId(PlayerId()),
      lobbyPlayers,
    }),
  );
});
//#endregion

//#region Szobából kilépés
onNet(EVENTS.LEAVED_ROOM, (roomId, leaverId, lobbyPlayers) => {
  console.log(roomId + "| Kilépett játékos: " + leaverId);

  console.log(
    JSON.stringify({
      action: "leaved",
      roomId,
      leaverId,
      playerId: GetPlayerServerId(PlayerId()),
      lobbyPlayers,
    }),
  );

  SendNuiMessage(
    JSON.stringify({
      action: "leaved",
      roomId,
      leaverId,
      playerId: GetPlayerServerId(PlayerId()),
      lobbyPlayers,
    }),
  );
});
//#endregion

makeInteractible();

//#region NUI callback regisztrálások
RegisterNuiCallbackType("joinRoom");
RegisterNuiCallbackType("leaveRoom");
RegisterNuiCallbackType("close");

on("__cfx_nui:joinRoom", (data, cb) => {
  emitNet(EVENTS.JOIN_ROOM, data.roomId);
  cb({});
});

on("__cfx_nui:leaveRoom", (data, cb) => {
  emitNet(EVENTS.LEAVE_ROOM, data.roomId);
  cb({});
});

on("__cfx_nui:close", (data, cb) => {
  uiOpen = false;
  SetNuiFocus(false, false);
  SendNuiMessage(JSON.stringify({ action: "close" }));

  cb({});
});
//#endregion
