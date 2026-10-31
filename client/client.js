const propModel = GetHashKey(PROP);
let currentRoomId = null;

function boardRoomId(obj) {
  const [x, y, z] = GetEntityCoords(obj);
  return `${PROP}_${x.toFixed(1)}_${y.toFixed(1)}_${z.toFixed(1)}`;
}

makeInteractible();
