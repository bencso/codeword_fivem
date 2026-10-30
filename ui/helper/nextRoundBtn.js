const playerClueBar = document.getElementById("codename_playerBar");
const nextRoundBtn = document.getElementById("codename_nextRoundBtn");

function showNextRoundBtn(show) {
  playerClueBar.classList.toggle("hidden", !show);
  if (show) nextRoundBtn.onclick = submitNextRoundBtn;
  else nextRoundBtn.onclick = null;
  nextRoundBtn.disabled = !show;
}

function submitNextRoundBtn() {
  if (playerClueSubmit.disabled) return;
  post("skipRound", { roomId });
}

function submitPickCard(pickedWord) {
  if (playerClueSubmit.disabled) return;
  if (pickedWord.length <= 0) return;

  post("pickWord", { roomId, pickedWord });
}
