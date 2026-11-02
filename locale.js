const ERROR_TEXTS = {
  isOnTable: "Ez a szó rajta van a táblán!",
  notEnoughLength: "Írj be egy tippet!",
  notCorrectCount: "Hibás szám!",
  moreWords: "Csak egy szó lehet!",
};

const SPYMASTER_TEXT_BANNER = (startingTeam) =>
  `${TEAM_NAMES[startingTeam] ?? ""} spymaster következik`;

const WINNER_TEXT = (winnerTeam) =>
  `${TEAM_NAMES[winnerTeam] ?? ""} nyert! A lobbyba kerülsz:`;

const JOIN_BTN_TEXT = "Csatlakozás";
const EXIT_BTN_TEXT = "Kilépés";
const LEAVE_BTN_TEXT = "Kilépés a szobából";
const SUBMIT_BTN_TEXT = "Beküldés";
const SKIP_BTN_TEXT = "Skippelés / Következő kör";

const WAITING_HEADING = "Várakozás";
const WAITING_SUBHEADING = "Játék hamarosan kezdődik";

const SPYMASTER_SELECTION_HEADING = "Spymaster választás";
const SPYMASTER_SELECTION_PICK_BTN = "Leszek a spymaster";

const CLUE_HINT_TEXT =
  " Jelöld ki a kártyákat, amelyekre a megadott szó vonatkozik";
