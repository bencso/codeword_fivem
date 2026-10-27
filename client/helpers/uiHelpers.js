let uiOpen = false;

const Delay = (ms) => new Promise((res) => setTimeout(res, ms));

function openUI(roomId) {
  uiOpen = true;
  SetNuiFocus(true, true);

  SendNuiMessage(JSON.stringify({ action: "open", roomId }));
}
