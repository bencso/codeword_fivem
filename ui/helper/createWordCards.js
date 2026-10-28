function createWordCards(words, isSpymaster) {
  const grid = document.getElementById("codename_grid");

  if (words.length > 0) {
    words.forEach((word) => {
      const wordDiv = document.createElement("div");
      const textSpan = document.createElement("span");

      wordDiv.revealed = word.revealed;
      wordDiv.classList.add("codename_card");
      textSpan.classList.add("codename_card-text");
      textSpan.textContent = word.word;

      if (word.team === "") wordDiv.classList.add("neutral");
      if (isSpymaster || word.revealed) {
        if (word.team === "black") wordDiv.classList.add("black");
        else
          wordDiv.classList.add(word.team === TEAM_ONE ? "teamOne" : "teamTwo");
      }

      wordDiv.appendChild(textSpan);
      grid.appendChild(wordDiv);
    });
  }
}
