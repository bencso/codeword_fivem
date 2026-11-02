const Delay = (ms) => new Promise((res) => setTimeout(res, ms));

const EVENTS = {
  JOIN_ROOM: "codenames:joinRoom",
  LEAVE_ROOM: "codenames:leaveRoom",

  JOINED_ROOM: "codenames:joinedRoom",
  LEAVED_ROOM: "codenames:leavedRoom",

  PLACE_BOARD: "codenames:spawnProp",
  REMOVE_BOARD: "codenames:removeProp",

  SPYMASTER_SELECTION: "codenames:spymasterSelection",
  SPYMASTER_SELECTED: "codenames:spymasterSelected",
  STARTED_GAME: "codenames:startedGame",

  PICK_SPYMASTER: "codenames:pickSpymaster",
  DROPED_USER: "codenames:dropedUser",

  ADD_CLUE: "codenames:addClue",
  ADDED_CLUE: "codenames:addedClue",

  NEXT_ROUND: "codenames:nextRound",

  PICK_WORD: "codenames:pickWord",
  VOTED_WORD: "codenames:votedWord",
  SELECTED_WORD: "codenames:selectedWord",
  ERROR: "codenames:error",

  SKIP_ROUND: "codenames:skipRound",
  VOTED_SKIP: "codenames:votedSkip",

  GAME_ENDED: "codenames:gameEnded",
  SPYMASTER_CHANGED: "codenames:spymasterChanged",
};

const PROP = "codenames_board";

const MIN_PLAYERS = 4;
const TEAM_ONE = "blue";
const TEAM_TWO = "red";
const TEAM_ONE_COLOR = "rgba(255, 0, 0, 0.6)";
const TEAM_TWO_COLOR = "rgba(0, 132, 255, 0.6)";

const AFTERMIN_COUNTDOWN_MS = 10 * 1000;
const ROUND_COUNTDOWN_MS = 10 * 1000;
const END_SCREEN_MS = 10 * 1000;

const WORDS_FILE = "/assets/magyar-szavak.txt";
const ONE_TEAM_WORDS = 6;

const TEAM_NAMES = {
  [TEAM_ONE]: "Csapat 1",
  [TEAM_TWO]: "Csapat 2",
};

const DEBUG = true;
