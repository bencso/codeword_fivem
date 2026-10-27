const rooms = new Map();
//TODO: Mikor elindul a játék shuffle-li a játékosokat a csapatokba, és választhanak 20 másodpercig ki megy be spymasternek, ha nem válaszottak akkor random tesz be
// TODO: A spymasterek kapnak egy emitNet-et, hogy ők a spymasterek és rákerül a html-ükre egy css tag és akkor ők látják kártyák színét

//#region SZOBA LÉTREHOZÁSA / PROP LETEVÉSE
onNet(EVENTS.CREATE_ROOM, (pos) => {
  const src = source;
  const roomId = crypto.randomUUID();

  const roomData = {
    id: roomId,
    createdBy: src,
    pos,
    players: [],
    blueTeam: [],
    redTeam: [],
    words: [],
    countDownTimer: null,
    state: "joinable",
  };

  rooms.set(roomId, roomData);

  emitNet(EVENTS.SPAWN_PROP, -1, roomId, pos);
});

//#region SZOBA TÖRLÉSE / PROP TÖRLÉSE
onNet(EVENTS.REMOVE_ROOM, (roomId) => {
  if (!rooms.has(roomId)) return;

  rooms.delete(roomId);
  emitNet(EVENTS.REMOVE_PROP, -1, roomId);
});

//#region SZOBÁBA BELÉPÉS
onNet(EVENTS.JOIN_ROOM, (roomId) => {
  const joinedPlayerId = source;

  if (rooms.size > 0 && rooms.has(roomId)) {
    const prevRoom = rooms.get(roomId);

    if (prevRoom.players.includes(joinedPlayerId)) return;
    if (prevRoom.state !== "joinable") return;

    const room = {
      ...prevRoom,
      players: [...prevRoom.players, joinedPlayerId],
    };

    rooms.set(roomId, room);
    room.players.forEach((playerId) =>
      emitNet(
        EVENTS.JOINED_ROOM,
        playerId,
        roomId,
        joinedPlayerId,
        room.players.map((id) => GetPlayerName(id)),
      ),
    );

    if (room.players.length >= MIN_PLAYERS && !room.countDownTimer) {
      room.countDownTimer = setTimeout(() => {
        const currentRoom = rooms.get(roomId);

        if (!currentRoom) return;
        if (currentRoom.players.length < MIN_PLAYERS) {
          currentRoom.countDownTimer = null;
          return;
        }

        currentRoom.countDownTimer = null;
      }, AFTERMIN_COUNTDOWN_MS);
    }
  }
});

//#region SZOBÁBA KILÉPÉS
onNet(EVENTS.LEAVE_ROOM, (roomId) => {
  const leaverId = source;

  if (rooms.size > 0 && rooms.has(roomId)) {
    const currentRoom = rooms.get(roomId);

    const room = {
      ...currentRoom,
      players: currentRoom.players.filter((p) => p !== leaverId),
    };

    rooms.set(roomId, room);

    emitNet(
      EVENTS.LEAVED_ROOM,
      leaverId,
      roomId,
      leaverId,
      room.players.map((id) => GetPlayerName(id)),
    );

    room.players.forEach((playerId) =>
      emitNet(
        EVENTS.LEAVED_ROOM,
        playerId,
        roomId,
        leaverId,
        room.players.map((id) => GetPlayerName(id)),
      ),
    );

    if (room.players.length < MIN_PLAYERS && room.countDownTimer) {
      clearTimeout(room.countDownTimer);
      room.countDownTimer = null;
    }
  }
});

//#region SZÖVEGEK KIOSZTÁSA
onNet(EVENTS.WORDS_PICK, (roomId) => {
  if (rooms.size > 0 && rooms.has(roomId)) {
    const currentRoom = rooms.get(roomId);

    //TODO: Ez a magyar szavak txt-ből random 25-öt kiveszünk és besorolunk random 4-4-et a csapatoknak, illetve egy random dead kártya
    const selectedWords = ["egy", "kettő", "három", "négy", "kis", "nagy"];
    let redTeamWords = ["kis"];
    let blueTeamWords = ["nagy"];

    const words = [];

    selectedWords.forEach((word) => {
      const isRed = redTeamWords.includes(word);
      const isBLue = blueTeamWords.includes(word);

      words.push({
        team: isBLue || isRed ? (isRed ? "red" : "blue") : "",
        word,
      });
    });

    const room = {
      ...currentRoom,
      words,
    };

    rooms.set(roomId, room);

    room.players.forEach((playerId) =>
      emitNet(EVENTS.WORDS_PICKED, playerId, roomId),
    );
  }
});
