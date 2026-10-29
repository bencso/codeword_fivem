function createWordCards(words, isSpymaster) {
  const grid = document.getElementById("codename_grid");
  grid.textContent = "";

  words.forEach((word) => {
    const wordDiv = document.createElement("div");
    const textSpan = document.createElement("span");

    wordDiv.classList.add("codename_card");
    textSpan.classList.add("codename_card-text");
    textSpan.textContent = word.word;

    if (word.word.length > 12) wordDiv.classList.add("long");

    if (isSpymaster || word.revealed) {
      if (word.team === "") wordDiv.classList.add("neutral");
      else if (word.team === "black") wordDiv.classList.add("black");
      else
        wordDiv.classList.add(word.team === TEAM_ONE ? "teamOne" : "teamTwo");
    }

    if (word.revealed) wordDiv.classList.add("revealed");

    wordDiv.appendChild(textSpan);
    grid.appendChild(wordDiv);
  });
}
