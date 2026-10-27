const EVENTS = {
  CREATE_ROOM: "codenames:createRoom",
  REMOVE_ROOM: "codenames:removeRoom",

  JOIN_ROOM: "codenames:joinRoom",
  LEAVE_ROOM: "codenames:leaveRoom",

  JOINED_ROOM: "codenames:joinedRoom",
  LEAVED_ROOM: "codenames:leavedRoom",

  SPAWN_PROP: "codenames:spawnProp",
  REMOVE_PROP: "codenames:removeProp",
};

const PROP = "vw_prop_casino_cards_02";

const MIN_PLAYERS = 4;
const AFTERMIN_COUNTDOWN_MS = 30 * 1000;
