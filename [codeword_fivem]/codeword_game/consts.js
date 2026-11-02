const Delay = (ms) => new Promise((res) => setTimeout(res, ms));

const EVENTS = {
  JOIN_ROOM: "codeword:joinRoom",
  LEAVE_ROOM: "codeword:leaveRoom",

  JOINED_ROOM: "codeword:joinedRoom",
  LEAVED_ROOM: "codeword:leavedRoom",

  PLACE_BOARD: "codeword:spawnProp",
  REMOVE_BOARD: "codeword:removeProp",

  SPYMASTER_SELECTION: "codeword:spymasterSelection",
  SPYMASTER_SELECTED: "codeword:spymasterSelected",
  STARTED_GAME: "codeword:startedGame",

  PICK_SPYMASTER: "codeword:pickSpymaster",
  DROPED_USER: "codeword:dropedUser",

  ADD_CLUE: "codeword:addClue",
  ADDED_CLUE: "codeword:addedClue",

  NEXT_ROUND: "codeword:nextRound",

  PICK_WORD: "codeword:pickWord",
  VOTED_WORD: "codeword:votedWord",
  SELECTED_WORD: "codeword:selectedWord",
  ERROR: "codeword:error",

  SKIP_ROUND: "codeword:skipRound",
  VOTED_SKIP: "codeword:votedSkip",

  GAME_ENDED: "codeword:gameEnded",
  SPYMASTER_CHANGED: "codeword:spymasterChanged",
};

const PROP = "codeword_board";

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
