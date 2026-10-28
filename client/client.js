const propModel = GetHashKey(PROP);
const codeNameProps = {};
let currentRoomId = null;

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

makeInteractible();

//#region NUI callback regisztrálások
RegisterNuiCallbackType("joinRoom");
RegisterNuiCallbackType("leaveRoom");
RegisterNuiCallbackType("pickSpymaster");
RegisterNuiCallbackType("close");

on("__cfx_nui:joinRoom", (data, cb) => {
  emitNet(EVENTS.JOIN_ROOM, data.roomId);
  cb({});
});

on("__cfx_nui:leaveRoom", (data, cb) => {
  emitNet(EVENTS.LEAVE_ROOM, data.roomId);
  cb({});
});

on("__cfx_nui:pickSpymaster", (data, cb) => {
  emitNet(EVENTS.PICK_SPYMASTER, data.roomId);
  cb({});
});

on("__cfx_nui:close", (_data, cb) => {
  uiOpen = false;
  SetNuiFocus(false, false);

  SendNuiMessage(JSON.stringify({ action: "close" }));

  cb({});
});

on("onResourceStop", (resourceName) => {
  if (resourceName !== GetCurrentResourceName()) return;

  clearHeadshots();

  for (const obj of Object.values(codeNameProps)) {
    if (DoesEntityExist(obj)) DeleteEntity(obj);
  }

  SetNuiFocus(false, false);
});
//#endregion
