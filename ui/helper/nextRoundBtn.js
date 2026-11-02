const playerClueBar = document.getElementById("codeword_playerBar");
const nextRoundBtn = document.getElementById("codeword_nextRoundBtn");

function showNextRoundBtn(show) {
  playerClueBar.classList.toggle("hidden", !show);
  if (show) nextRoundBtn.onclick = submitNextRoundBtn;
  else nextRoundBtn.onclick = null;
  nextRoundBtn.disabled = !show;
  nextRoundBtn.textContent = SKIP_BTN_TEXT;
}

function submitNextRoundBtn() {
  if (nextRoundBtn.disabled) return;
  nextRoundBtn.disabled = true;
  post("skipRound", { roomId });
}

function submitPickCard(pickedWord) {
  if (pickedWord.length <= 0) return;

  post("pickWord", { roomId, pickedWord });
}
