RegisterCommand(
  "codename",
  () => {
    const ped = PlayerPedId();
    const [x, y, z] = GetOffsetFromEntityInWorldCoords(ped, 0.0, 1.0, 0.0);
    const heading = GetEntityHeading(ped);
    const pos = { x, y, z, heading };

    emitNet(EVENTS.CREATE_ROOM, pos);
  },
  false,
);
