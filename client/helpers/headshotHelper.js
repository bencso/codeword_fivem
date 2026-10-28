const headshots = new Map();

async function getPlayerHeadshot(serverId) {
  const cached = headshots.get(serverId);
  if (cached && IsPedheadshotValid(cached.handle)) return cached.url;

  const player = GetPlayerFromServerId(serverId);
  if (player === -1) return null;

  const ped = GetPlayerPed(player);
  if (!ped || !DoesEntityExist(ped)) return null;

  const handle = RegisterPedheadshotTransparent(ped);
  const timeout = Date.now() + 3000;

  while (!IsPedheadshotReady(handle) || !IsPedheadshotValid(handle)) {
    if (Date.now() > timeout) {
      UnregisterPedheadshot(handle);
      return null;
    }
    await Delay(0);
  }

  const txd = GetPedheadshotTxdString(handle);
  const url = `https://nui-img/${txd}/${txd}`;

  headshots.set(serverId, { handle, url });
  return url;
}

function removePlayerHeadshot(serverId) {
  const cached = headshots.get(serverId);
  if (!cached) return;
  UnregisterPedheadshot(cached.handle);
  headshots.delete(serverId);
}

function clearHeadshots() {
  for (const { handle } of headshots.values()) UnregisterPedheadshot(handle);
  headshots.clear();
}
