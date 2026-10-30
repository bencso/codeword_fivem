//#region NUI callback regisztrálások
RegisterNuiCallbackType("joinRoom");
RegisterNuiCallbackType("leaveRoom");
RegisterNuiCallbackType("pickSpymaster");
RegisterNuiCallbackType("close");
RegisterNuiCallbackType("giveClue");
RegisterNuiCallbackType("pickWord");
RegisterNuiCallbackType("skipRound");

on("__cfx_nui:joinRoom", (data, cb) => {
  emitNet(EVENTS.JOIN_ROOM, data.roomId);
  cb({});
});

on("__cfx_nui:leaveRoom", (data, cb) => {
  emitNet(EVENTS.LEAVE_ROOM, data.roomId);
  cb({});
});

on("__cfx_nui:skipRound", (data, cb) => {
  emitNet(EVENTS.SKIP_ROUND, data.roomId);
  cb({});
});

on("__cfx_nui:pickSpymaster", (data, cb) => {
  emitNet(EVENTS.PICK_SPYMASTER, data.roomId);
  cb({});
});

on("__cfx_nui:close", (_data, cb) => {
  uiOpen = false;
  SetNuiFocus(false, false);

  cb({});
});

on("__cfx_nui:giveClue", (data, cb) => {
  emitNet(EVENTS.ADD_CLUE, data.roomId, data.clue, data.count);
  cb({});
});

on("__cfx_nui:pickWord", (data, cb) => {
  emitNet(EVENTS.PICK_WORD, data.roomId, data.pickedWord);
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
