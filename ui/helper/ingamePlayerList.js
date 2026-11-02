function createIngamePlyerList(players) {
  const lists = {
    [TEAM_ONE]: document.getElementById("codeword_teamOnePlayers"),
    [TEAM_TWO]: document.getElementById("codeword_teamTwoPlayers"),
  };

  Object.values(lists).forEach((ul) => (ul.textContent = ""));

  const sorted = [...players].sort(
    (a, b) => (b.spymaster ? 1 : 0) - (a.spymaster ? 1 : 0),
  );

  sorted.forEach((p) => {
    const ul = lists[p.team];
    if (!ul) return;

    const li = document.createElement("li");
    li.className = "codeword_player-card";
    if (p.spymaster) li.classList.add("spymaster");

    const info = document.createElement("div");
    info.className = "codeword_player-info";

    const name = document.createElement("div");
    name.className = "codeword_player-name";
    name.textContent = p.name;

    info.append(name);

    const photo = document.createElement("div");
    photo.className = "codeword_player-photo";

    if (p.photo) {
      const img = document.createElement("img");
      img.src = p.photo;
      img.alt = "";
      img.onerror = () => {
        img.remove();
        photo.textContent = p.name.charAt(0).toUpperCase();
      };
      photo.appendChild(img);
    } else {
      photo.textContent = p.name.charAt(0).toUpperCase();
    }

    li.append(info, photo);
    ul.appendChild(li);
  });
}
