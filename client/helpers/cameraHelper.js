let boardCam = null;

function openBoardCam(obj) {
  if (boardCam || !DoesEntityExist(obj)) return;

  const [bx, by, bz] = GetEntityCoords(obj);
  const heading = GetEntityHeading(obj);

  boardCam = CreateCam("DEFAULT_SCRIPTED_CAMERA", true);
  SetCamCoord(boardCam, bx, by, bz + 0.8);
  SetCamRot(boardCam, -89.9, 0.0, heading, 2); 
  SetCamFov(boardCam, 50.0);

  RenderScriptCams(true, true, 800, true, false);
}

function closeBoardCam() {
  if (!boardCam) return;

  const cam = boardCam;
  boardCam = null;

  RenderScriptCams(false, true, 800, true, false);
  setTimeout(() => DestroyCam(cam, false), 900);
}
