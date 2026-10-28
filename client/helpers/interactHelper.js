const interactDistance = 2.0;
let uiOpen = false;

function distanceMe(a, b) {
  const dx = a[0] - b[0],
    dy = a[1] - b[1],
    dz = a[2] - b[2];

  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function openUI(roomId) {
  uiOpen = true;
  SetNuiFocus(true, true);
  SendNuiMessage(JSON.stringify({ action: "open", roomId }));
}

async function makeInteractible() {
  while (true) {
    let sleep = 1000;

    if (!uiOpen) {
      const me = GetEntityCoords(PlayerPedId());

      for (const [roomId, obj] of Object.entries(codeNameProps)) {
        if (!DoesEntityExist(obj)) continue;

        const dist = distanceMe(me, GetEntityCoords(obj));

        if (dist < interactDistance) {
          sleep = 0;
          BeginTextCommandDisplayHelp("STRING");
          AddTextComponentSubstringPlayerName(
            "Nyomd meg ~INPUT_CONTEXT~ a csatlakozáshoz, vagy ~INPUT_CELLPHONE_CANCEL~ a törléshez",
          );
          EndTextCommandDisplayHelp(0, false, true, -1);

          if (IsControlJustReleased(0, 38)) openUI(roomId);
          if (IsControlJustReleased(0, 252))
            emitNet(EVENTS.REMOVE_ROOM, roomId);

          break;
        } else if (dist < 20.0) {
          sleep = Math.min(sleep, 250);
        }
      }
    }

    await Delay(sleep);
  }
}
