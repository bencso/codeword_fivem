//#region NUI callback regisztrálások
RegisterNuiCallbackType("joinRoom");
RegisterNuiCallbackType("leaveRoom");
RegisterNuiCallbackType("pickSpymaster");
RegisterNuiCallbackType("close");
RegisterNuiCallbackType("giveClue");

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

on("__cfx_nui:giveClue", (data, cb) => {
  emitNet(EVENTS.ADD_CLUE, data.roomId, data.clue, data.count);
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
