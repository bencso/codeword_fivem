const rooms = new Map();
const placedBoards = new Map();

//#region PROP LETEVÉSE
onNet(EVENTS.PLACE_BOARD, async (pos) => {
  const src = source;

  const [px, py, pz] = GetEntityCoords(GetPlayerPed(src));
  if (Math.hypot(px - pos.x, py - pos.y, pz - pos.z) > 5) return;

  const obj = CreateObjectNoOffset(
    GetHashKey(PROP),
    pos.x,
    pos.y,
    pos.z,
    true,
    true,
    false,
  );

  let tries = 0;
  while (!DoesEntityExist(obj) && tries++ < 30) await Delay(10);
  if (!DoesEntityExist(obj)) return;

  SetEntityHeading(obj, pos.heading);
  PlaceObjectOnGroundProperly(obj);
  FreezeEntityPosition(obj, true);
  SetEntityOrphanMode(obj, 2);

  placedBoards.set(NetworkGetNetworkIdFromEntity(obj), {
    entity: obj,
    owner: src,
  });
});
//#endregion

//#region PROP TÖRLÉSE
onNet(EVENTS.REMOVE_BOARD, (netId, roomId) => {
  const src = source;
  const board = placedBoards.get(netId);
  if (!board || board.owner !== src) return;

  const room = rooms.get(roomId);
  if (room && room.players.length > 0) return;

  const [px, py, pz] = GetEntityCoords(GetPlayerPed(src));
  const [bx, by, bz] = GetEntityCoords(board.entity);
  if (Math.hypot(px - bx, py - by, pz - bz) > 3.0) return;

  DeleteEntity(board.entity);
  placedBoards.delete(netId);
  rooms.delete(roomId);
});
//#endregion

//#region SZOBA LÉTREHOZÁSA
function createRoom(roomId, pos, joinedPlayerId) {
  const roomData = {
    id: roomId,
    createdBy: joinedPlayerId,
    pos,
    players: [],
    words: [],
    countDownTimer: null,
    endsAt: null,
    selectedWords: new Map(),
    skippingRound: new Set(),
    guesses: 0,
    clueHistory: [],
    state: "joinable",
  };

  rooms.set(roomId, roomData);
}

//#region SZOBÁBA BELÉPÉS
onNet(EVENTS.JOIN_ROOM, (roomId) => {
  const joinedPlayerId = source;

  const parts = String(roomId).split("_");
  const [bx, by, bz] = parts.slice(-3).map(Number);
  if (parts.length < 4 || [bx, by, bz].some(Number.isNaN)) return;

  const [px, py, pz] = GetEntityCoords(GetPlayerPed(joinedPlayerId));
  if (Math.hypot(px - bx, py - by, pz - bz) > 3.0) return;

  if (!rooms.has(roomId)) createRoom(roomId, [bx, by, bz], joinedPlayerId);

  const prevRoom = rooms.get(roomId);

  if (
    prevRoom.players.length > 0 &&
    prevRoom.players.find((p) => p.id === joinedPlayerId)
  )
    return;

  const joinedPlayerData = {
    id: joinedPlayerId,
    name: GetPlayerName(joinedPlayerId),
    team: "",
    isViewer: prevRoom.state !== "joinable",
  };

  const room = {
    ...prevRoom,
    players: [...prevRoom.players, joinedPlayerData],
  };

  rooms.set(roomId, room);

  if (room.state === "started") {
    emitNet(
      EVENTS.STARTED_GAME,
      joinedPlayerId,
      roomId,
      room.players.filter((p) => !p.isViewer),
      room.words,
      room.currentTeam,
      room.endsAt ? room.endsAt - Date.now() : null,
      true,
      room.clue,
      room.clueHistory,
    );
    return;
  }

  if (room.state !== "joinable") {
    emitNet(
      EVENTS.JOINED_ROOM,
      joinedPlayerId,
      roomId,
      joinedPlayerId,
      joinedPlayerData,
      room.players,
      false,
      null,
    );
    return;
  }

  if (
    room.state === "joinable" &&
    room.players.filter((p) => !p.isViewer).length >= MIN_PLAYERS &&
    !room.countDownTimer
  ) {
    room.endsAt = Date.now() + AFTERMIN_COUNTDOWN_MS;

    room.countDownTimer = setTimeout(() => {
      const currentRoom = rooms.get(roomId);
      if (!currentRoom) return;

      currentRoom.countDownTimer = null;
      currentRoom.endsAt = null;

      if (currentRoom.players.filter((p) => !p.isViewer).length < MIN_PLAYERS) {
        resetRoom(roomId);
        return;
      }

      switchSpymasterSelector(roomId);
    }, AFTERMIN_COUNTDOWN_MS);
  }

  const endsTime = room.endsAt ? room.endsAt - Date.now() : null;

  room.players.forEach((player) =>
    emitNet(
      EVENTS.JOINED_ROOM,
      player.id,
      roomId,
      joinedPlayerId,
      joinedPlayerData,
      room.players,
      room.players.filter((p) => !p.isViewer).length >= MIN_PLAYERS,
      endsTime,
    ),
  );
});

//#region Spymaster pickelés
onNet(EVENTS.PICK_SPYMASTER, (roomId) => pickSpymaster(source, roomId));
//#endregion

//#region SZOBÁBA KILÉPÉS
onNet(EVENTS.LEAVE_ROOM, (roomId) => {
  leaveRoom(roomId, source);
});
//#endregion

//#region CLUE ADD
onNet(EVENTS.ADD_CLUE, (roomId, clue, count) =>
  addClue(source, roomId, clue, count),
);
//#endregion

//#region SZÓMEGJELÖLÉS
onNet(EVENTS.PICK_WORD, (roomId, pickedWord) =>
  pickWord(source, roomId, pickedWord),
);
//#endregion

//#region KÖR UGRÁS
onNet(EVENTS.SKIP_ROUND, (roomId) => skipRound(source, roomId));
//#endregion

//#region Lelép a játékos a szerverről
on("playerDropped", () => {
  const droppedId = source;

  for (const [roomId, room] of rooms) {
    if (room.players.some((p) => p.id === droppedId)) {
      leaveRoom(roomId, droppedId);
    }
  }
});

on("onResourceStop", (resourceName) => {
  if (resourceName !== GetCurrentResourceName()) return;

  for (const { entity } of placedBoards.values())
    if (DoesEntityExist(entity)) DeleteEntity(entity);
});
//#endregion
