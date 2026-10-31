//#region Szobából kilépett valaki, és alacsony szám
onNet(EVENTS.DROPED_USER, async (roomId, players, endsTime) => {
  console.log(roomId + "| Megszakadt a játék, kevés játékos miatt");

  const withPhotos = await Promise.all(
    players.map(async (p) => ({
      ...p,
      photo: await getPlayerHeadshot(p.id),
    })),
  );

  SendNuiMessage(
    JSON.stringify({
      action: "userDroped",
      roomId,
      lobbyPlayers: withPhotos,
      endsTime,
    }),
  );
});
//#endregion

//#region Játék inditása
onNet(
  EVENTS.STARTED_GAME,
  async (
    roomId,
    players,
    words,
    startingTeam,
    endsTime,
    isViewer,
    clue,
    clueHistory,
  ) => {
    console.log(roomId + "| Játék elindult");

    const withPhotos = await Promise.all(
      players.map(async (p) => ({
        ...p,
        photo: await getPlayerHeadshot(p.id),
      })),
    );

    SendNuiMessage(
      JSON.stringify({
        action: "gameStarted",
        roomId,
        players,
        lobbyPlayers: withPhotos,
        words,
        startingTeam,
        endsTime,
        isViewer,
        clue,
        clueHistory,
        playerId: GetPlayerServerId(PlayerId()),
      }),
    );
  },
);
//#endregion

//#region Clue megjelenítése
onNet(
  EVENTS.ADDED_CLUE,
  (roomId, clue, count, currentTeam, endsTime, clueHistory) => {
    console.log(roomId + "| Clue kiadva");

    SendNuiMessage(
      JSON.stringify({
        action: "clueAdded",
        roomId,
        clue,
        count,
        currentTeam,
        endsTime,
        clueHistory,
      }),
    );
  },
);
//#endregion

//#region Következő kör
onNet(
  EVENTS.NEXT_ROUND,
  (roomId, clue, count, words, currentTeam, endsTime) => {
    console.log(roomId + "| Következő kör");

    SendNuiMessage(
      JSON.stringify({
        action: "nextRound",
        roomId,
        clue,
        count,
        words,
        currentTeam,
        endsTime,
      }),
    );
  },
);
//#endregion

//#region Szó szavazás
onNet(EVENTS.VOTED_WORD, async (roomId, pickedWord, playerId, playerName) => {
  const voterWhitPhoto = {
    votedId: playerId,
    name: playerName,
    photo: await getPlayerHeadshot(playerId),
  };

  SendNuiMessage(
    JSON.stringify({
      action: "votedWord",
      roomId,
      pickedWord,
      voterWhitPhoto,
    }),
  );
});
//#endregion

//#region Szó felfordítása
onNet(
  EVENTS.SELECTED_WORD,
  async (roomId, words, playerId, amountClue, overallClue) => {
    SendNuiMessage(
      JSON.stringify({
        action: "selectedWord",
        roomId,
        words,
        playerId,
        amountClue,
        overallClue,
      }),
    );
  },
);
//#endregion

//#region Hibakezelés
onNet(EVENTS.ERROR, async (issue) => {
  SendNuiMessage(
    JSON.stringify({
      action: "error",
      issue,
    }),
  );
});
//#endregion

//#region Szavazat leadva a skippelésre
onNet(EVENTS.VOTED_SKIP, (roomId, playerTeamPlayercount, skipperCount) => {
  SendNuiMessage(
    JSON.stringify({
      action: "votedSkip",
      roomId,
      playerTeamPlayercount,
      skipperCount,
    }),
  );
});
//#endregion

//#region Játék vége
onNet(EVENTS.GAME_ENDED, (roomId, words, winnerTeam) => {
  SendNuiMessage(
    JSON.stringify({
      action: "gameEnded",
      roomId,
      words,
      winnerTeam,
    }),
  );
});
//#endregion

