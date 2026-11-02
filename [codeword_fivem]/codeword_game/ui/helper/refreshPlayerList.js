function refreshPlayerList(players, view) {
  if (!players) return;

  const playerListUl = document.querySelector(
    `#codeword_view-${view} .codeword_lobby-players`,
  );

  playerListUl.textContent = "";

  if (players.length === 0) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = "Várakozás a többiekre";
    playerListUl.appendChild(li);
    return;
  }

  players.forEach((p) => {
    const li = document.createElement("li");
    li.className = "codeword_chip";
    li.dataset.playerId = p.id;

    if (p.team) li.classList.add(p.team === TEAM_ONE ? "teamOne" : "teamTwo");
    if (p.spymaster) li.classList.add("spymaster");

    if (p.photo) {
      const img = document.createElement("img");
      img.className = "codeword_avatar";
      img.src = p.photo;
      img.alt = "";
      li.appendChild(img);
    } else {
      const fallback = document.createElement("span");
      fallback.className = "codeword_avatar codeword_avatar-fallback";
      fallback.textContent = p.name.charAt(0).toUpperCase();
      li.appendChild(fallback);
    }

    const name = document.createElement("span");
    name.className = "codeword_chip-name";
    name.textContent = p.name;
    li.appendChild(name);

    playerListUl.appendChild(li);
  });
}
