const revealedCards = new Set();

function modifyWordCards(words, isSpymaster, myTeam, currentTeam, isViewer) {
  const grid = document.getElementById("codename_grid");
  grid.textContent = "";
  grid.classList.toggle("spymaster", !!isSpymaster);

  if (!words.some((w) => w.revealed)) revealedCards.clear();

  words.forEach((word, index) => {
    const wordDiv = document.createElement("div");
    const wordVoterDiv = document.createElement("div");
    const textSpan = document.createElement("span");

    wordVoterDiv.className = "codename_card-votes";

    wordDiv.classList.add("codename_card");
    wordDiv.dataset.index = index;
    wordDiv.dataset.word = word.word;
    wordDiv.id = `codename_card-${word.word}`;

    textSpan.classList.add("codename_card-text");
    textSpan.textContent = word.word;

    if (currentTeam === myTeam) wordDiv.style.cursor = "pointer";
    else wordDiv.style.cursor = "default";

    if (word.word.length > 12) wordDiv.classList.add("long");

    if (isSpymaster || word.revealed || isViewer) {
      if (currentTeam === myTeam && word.team === myTeam)
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

    wordDiv.appendChild(wordVoterDiv);
    wordDiv.appendChild(textSpan);

    if (!isSpymaster && !isViewer && currentTeam === myTeam && !word.revealed)
      wordDiv.onclick = () => submitPickCard(word.word);

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
