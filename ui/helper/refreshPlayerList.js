function refreshPlayerList(players, view) {
  if (!players) return;

  const playerListUl = document.querySelector(
    `#codename_view-${view} #codename_lobbyPlayers`,
  );

  playerListUl.textContent = "";

  players.forEach((p) => {
    const li = document.createElement("li");

    if (p.photo) {
      const img = document.createElement("img");
      img.className = "codename_avatar";
      img.dataset.playerId = p.id;
      img.src = p.photo;
      img.alt = p.name.toUpperCase();

      if (p.team)
        img.style.backgroundColor =
          p.team === TEAM_ONE ? TEAM_ONE_COLOR : TEAM_TWO_COLOR;

      li.appendChild(img);
    } else {
      const fallback = document.createElement("span");
      fallback.dataset.playerId = p.id;
      fallback.className = "codename_avatar codename_avatar-fallback";
      fallback.textContent = p.name.charAt(0).toUpperCase();
      li.appendChild(fallback);
    }

    playerListUl.appendChild(li);
  });
}
