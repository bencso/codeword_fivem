const clueBar = document.getElementById("codeword_clueBar");
const clueText = document.getElementById("codeword_clueTextInput");
const clueCount = document.getElementById("codeword_clueCountInput");
const clueSubmit = document.getElementById("codeword_clueSubmit");
const clueError = document.getElementById("codeword_clueHint");

function showClueInput(show) {
  clueBar.classList.toggle("hidden", !show);
  if (show) clueText.focus();
  clueCount.value = 0;
  clueCount.max = ONE_TEAM_WORDS;
  clueCount.min = -1;
  clueError.textContent = CLUE_HINT_TEXT;
  clueError.classList.remove("error");
}

function selectedClueCards() {
  return document.querySelectorAll("#codeword_grid .codeword_card.selected");
}

function updateClueState() {
  clueCount.classList.toggle("empty", (clueCount.value ?? 0) === 0);
  clueSubmit.disabled = clueText.value.trim() === "";
}

function toggleClueCard(card, isRevealed) {
  if (isRevealed) return;
  if (clueBar.classList.contains("hidden")) return;
  card.classList.toggle("selected");

  const count = selectedClueCards().length;
  clueCount.value = count;

  document.getElementById("codeword_clueSubmit").textContent = SUBMIT_BTN_TEXT;
  document.getElementById("codeword_clueHint").textContent = CLUE_HINT_TEXT;

  if (clueError.classList.contains("error")) {
    clueError.classList.remove("error");
    clueError.textContent = CLUE_HINT_TEXT;
  }
}

function resetClueInput() {
  clueText.value = "";
  selectedClueCards().forEach((c) => c.classList.remove("selected"));
  updateClueState();
}

function submitClue() {
  if (clueSubmit.disabled) return;

  const clue = clueText.value.trim();
  const count = clueCount.value ?? selectedClueCards().length;

  if (clue.length >= -1) {
    post("giveClue", { roomId, clue, count });
    resetClueInput();
    clueSubmit.disabled = true;
  }
}

clueText.addEventListener("keydown", (e) => {
  if (e.key === "Enter") submitClue();
});

clueText.addEventListener("input", () => {
  updateClueState();
});

clueSubmit.addEventListener("click", submitClue);
