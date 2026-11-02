const hideColors = (words) =>
  words.map((w) => ({
    word: w.word,
    team: w.revealed ? w.team : "",
    revealed: w.revealed,
  }));
