const revealedCards = new Set();

function createWordCards(words, isSpymaster, myTeam) {
  const grid = document.getElementById("codename_grid");
  grid.textContent = "";
  grid.classList.toggle("spymaster", !!isSpymaster);

  if (!words.some((w) => w.revealed)) revealedCards.clear();

  words.forEach((word, index) => {
    const wordDiv = document.createElement("div");
    const textSpan = document.createElement("span");

    wordDiv.classList.add("codename_card");
    wordDiv.dataset.index = index;
    textSpan.classList.add("codename_card-text");
    textSpan.textContent = word.word;

    if (word.word.length > 12) wordDiv.classList.add("long");

    if (isSpymaster || word.revealed) {
      wordDiv.style.cursor = !word.revealed ? "pointer" : "not-allowed";

      if (!word.team || word.team === "") wordDiv.classList.add("neutral");
      else if (word.team === "black") wordDiv.classList.add("black");
      else
        wordDiv.classList.add(word.team === TEAM_ONE ? "teamOne" : "teamTwo");
    } else wordDiv.classList.add("neutral");

    if (isSpymaster && !word.revealed && word.team === myTeam) {
      wordDiv.classList.add("own");
      wordDiv.addEventListener("click", () =>
        toggleClueCard(wordDiv, word.revealed),
      );
    }

    wordDiv.appendChild(textSpan);

    if (word.revealed) {
      wordDiv.classList.add("revealed");

      const cover = document.createElement("div");
      cover.className = "codename_card-cover";
      cover.style.backgroundImage = `url("../../assets/kartya/kartya_${index + 1}.png")`;

      if (!revealedCards.has(index)) {
        cover.classList.add("flip-in");
        revealedCards.add(index);
      }

      wordDiv.appendChild(cover);
    }

    grid.appendChild(wordDiv);
  });

  resetClueInput();
}
