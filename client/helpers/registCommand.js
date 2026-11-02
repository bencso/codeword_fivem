RegisterCommand(
  "codeword",
  () => {
    const ped = PlayerPedId();
    const [x, y, z] = GetOffsetFromEntityInWorldCoords(ped, 0.0, 1.0, 0.0);
    const [found, groundZ] = GetGroundZFor_3dCoord(x, y, z + 1.0, false);

    emitNet(EVENTS.PLACE_BOARD, {
      x,
      y,
      z: found ? groundZ : z,
      heading: GetEntityHeading(ped),
    });
  },
  false,
);
