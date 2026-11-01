const headshots = new Map();
const pending = new Map();
let queue = Promise.resolve();

async function waitHeadshot(handle) {
  if (!handle) return false;

  const timeout = Date.now() + 3000;

  while (!IsPedheadshotReady(handle) || !IsPedheadshotValid(handle)) {
    if (Date.now() > timeout) {
      UnregisterPedheadshot(handle);
      return false;
    }
    await Delay(0);
  }

  return true;
}

async function createHeadshot(serverId) {
  const player = GetPlayerFromServerId(serverId);

  if (player === -1) return null;

  const ped = GetPlayerPed(player);

  if (!ped || !DoesEntityExist(ped)) return null;

  let handle = RegisterPedheadshotTransparent(ped);

  if (!(await waitHeadshot(handle))) {
    handle = RegisterPedheadshot(ped);
    if (!(await waitHeadshot(handle))) return null;
  }

  const txd = GetPedheadshotTxdString(handle);
  const url = `https://nui-img/${txd}/${txd}`;
  headshots.set(serverId, { handle, url });

  return url;
}

function getPlayerHeadshot(serverId) {
  if (serverId < 0) return Promise.resolve(null);

  const cached = headshots.get(serverId);
  if (cached && IsPedheadshotValid(cached.handle))
    return Promise.resolve(cached.url);

  if (cached) headshots.delete(serverId);

  if (pending.has(serverId)) return pending.get(serverId);

  const job = queue.then(() => createHeadshot(serverId));
  queue = job.catch(() => null);

  const promise = job.catch(() => null).finally(() => pending.delete(serverId));

  pending.set(serverId, promise);
  return promise;
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
