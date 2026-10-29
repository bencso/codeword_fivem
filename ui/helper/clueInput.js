const clueBar = document.getElementById("codename_clueBar");
const clueText = document.getElementById("codename_clueTextInput");
const clueCount = document.getElementById("codename_clueCountInput");
const clueSubmit = document.getElementById("codename_clueSubmit");

function showClueInput(show) {
  clueBar.classList.toggle("hidden", !show);
  if (show) clueText.focus();
}

function selectedClueCards() {
  return document.querySelectorAll("#codename_grid .codename_card.selected");
}

function updateClueState() {
  const count = selectedClueCards().length;
  clueCount.textContent = count;
  clueCount.classList.toggle("empty", count === 0);
  clueSubmit.disabled = clueText.value.trim() === "" || count === 1;
}

function toggleClueCard(card) {
  if (clueBar.classList.contains("hidden")) return;
  card.classList.toggle("selected");
  updateClueState();
}

function resetClueInput() {
  clueText.value = "";
  selectedClueCards().forEach((c) => c.classList.remove("selected"));
  updateClueState();
}

function submitClue() {
  if (clueSubmit.disabled) return;

  const clue = clueText.value.trim();
  const count = selectedClueCards().length;

  if (clue.length > 1) {
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
