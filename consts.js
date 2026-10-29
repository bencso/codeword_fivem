const Delay = (ms) => new Promise((res) => setTimeout(res, ms));

const EVENTS = {
  CREATE_ROOM: "codenames:createRoom",
  REMOVE_ROOM: "codenames:removeRoom",

  JOIN_ROOM: "codenames:joinRoom",
  LEAVE_ROOM: "codenames:leaveRoom",

  JOINED_ROOM: "codenames:joinedRoom",
  LEAVED_ROOM: "codenames:leavedRoom",

  SPAWN_PROP: "codenames:spawnProp",
  REMOVE_PROP: "codenames:removeProp",

  START_GAME: "codenames:startGame",
  SPYMASTER_SELECTION: "codenames:spymasterSelection",
  SPYMASTER_SELECTED: "codenames:spymasterSelected",
  STARTED_GAME: "codenames:startedGame",

  PICK_SPYMASTER: "codenames:pickSpymaster",
  DROPED_USER: "codenames:dropedUser",
};

const PROP = "vw_prop_casino_cards_02";

const MIN_PLAYERS = 1;
const TEAM_ONE = "blue";
const TEAM_TWO = "red";
const TEAM_ONE_COLOR = "rgba(255, 0, 0, 0.6)";
const TEAM_TWO_COLOR = "rgba(0, 132, 255, 0.6)";

const AFTERMIN_COUNTDOWN_MS = 5 * 1000;

const WORDS_FILE = "magyar-szavak.txt";
const RANDOM_WORDS = 25;
const ONE_TEAM_WORDS = 6;
