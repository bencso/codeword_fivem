function modifyClueHistory(clueHistory) {
  if (!Array.isArray(clueHistory)) return;

  const lists = {
    [TEAM_ONE]: document.getElementById("codename_teamOneClues"),
    [TEAM_TWO]: document.getElementById("codename_teamTwoClues"),
  };
  lists[TEAM_ONE].textContent = "";
  lists[TEAM_TWO].textContent = "";

  clueHistory.forEach(({ clue, count, team }) => {
    const li = document.createElement("li");
    const word = document.createElement("span");
    const num = document.createElement("span");
    word.textContent = clue;
    num.textContent = count === 0 ? "∞" : count;
    li.append(word, num);
    lists[team]?.prepend(li);
  });
}
