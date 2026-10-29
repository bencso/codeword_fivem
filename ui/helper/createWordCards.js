function createWordCards(words, isSpymaster, myTeam) {
  const grid = document.getElementById("codename_grid");
  grid.textContent = "";
  grid.classList.toggle("spymaster", !!isSpymaster);

  words.forEach((word, index) => {
    const wordDiv = document.createElement("div");
    const textSpan = document.createElement("span");

    wordDiv.classList.add("codename_card");
    wordDiv.dataset.index = index;
    textSpan.classList.add("codename_card-text");
    textSpan.textContent = word.word;

    if (word.word.length > 12) wordDiv.classList.add("long");

    if (isSpymaster || word.revealed) {
      if (!word.team || word.team === "") wordDiv.classList.add("neutral");
      else if (word.team === "black") wordDiv.classList.add("black");
      else
        wordDiv.classList.add(word.team === TEAM_ONE ? "teamOne" : "teamTwo");
    } else wordDiv.classList.add("neutral");

    if (word.revealed) wordDiv.classList.add("revealed");

    if (isSpymaster && !word.revealed && word.team === myTeam) {
      wordDiv.classList.add("own");
      wordDiv.addEventListener("click", () => toggleClueCard(wordDiv));
    }

    wordDiv.appendChild(textSpan);
    grid.appendChild(wordDiv);
  });

  resetClueInput();
}
