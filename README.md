![Codeword for FiveM](banner.png)

# Codeword for FiveM

🇭🇺 [Magyar](#magyar) · 🇬🇧 [English](#english)

---

## Magyar

A **Codeword** egy FiveM-re készült, JavaScriptben írt társasjáték, amelyet a népszerű
**Codenames** ihletett.

Két csapat versenyez egy 5×5-ös táblán, hogy megtalálja a saját ügynökeit. A csapatok
kémfőnökei egyszavas tippeket adnak, a csapattársak pedig szavazással döntik el, melyik
kártyát fordítják fel. Az nyer, aki előbb megtalálja az összes ügynökét. A fekete kártyát
viszont messziről kerüld el!

A táblát a `/codeword` paranccsal bárhova lerakhatod (vagy beteheted a propot az MLO-dba).
Menj oda, és nyomd meg az **E** gombot a csatlakozáshoz.

### Használat

Szabadon használható, módosítható, és beépíthető a saját szerveredbe.
Ha használod, megköszönöm, ha feltünteted a nevem: **Bencso** 🙂

### Beállítások

Mindent két fájlban tudsz testreszabni, a kódhoz nem kell hozzányúlnod.

**`consts.js`** – játékbeállítások

| Beállítás | Mire jó |
|---|---|
| `MIN_PLAYERS` | Hány játékos kell az induláshoz (legalább 4 ajánlott: csapatonként egy kémfőnök és egy tippelő) |
| `AFTERMIN_COUNTDOWN_MS` | Visszaszámlálás a lobbyban (ha megvan a minimum létszám) és a kémfőnökválasztásnál, valamint egy megszakadt játék utáni újraindításnál (ms) |
| `ROUND_COUNTDOWN_MS` | Egy kör hossza (ms) |
| `END_SCREEN_MS` | Mennyi ideig látszik az eredmény a játék végén (ms) |
| `ONE_TEAM_WORDS` | A kezdő csapat kártyáinak száma (a másik csapaté eggyel kevesebb, egy a merénylő, a többi semleges) |
| `WORDS_FILE` | A szólista elérési útja (soronként egy szó, legalább 25 szó kell) |
| `TEAM_NAMES` | A csapatok megjelenített neve |
| `TEAM_ONE_COLOR`, `TEAM_TWO_COLOR` | A csapatok színe a felületen |

**`locale.js`** – a felület összes szövege (gombok, címek, hibaüzenetek, kör eleji kiírások).
Ha más nyelvre fordítanád, elég ezt az egy fájlt átírni.

### Jogi nyilatkozat

A Codeword egy nem hivatalos, rajongó által készített játék, amely a Codenames
játékmenetére épül. **Nem** az eredeti játék, és semmilyen kapcsolatban nem áll a
Czech Games Editionnel vagy a Codenames alkotóival, és nem is támogatják.
A „Codenames” és a „Fedőnevek” név, valamint az eredeti játék grafikái a jogtulajdonos
védjegyei, illetve szellemi tulajdonai. A projekt nem használ fel eredeti játékanyagot.

### Screenshots

<img width="100%" height="642" alt="Lobby" src="https://github.com/user-attachments/assets/a2823f94-94d3-4348-aa71-1d5fbcdbc107" />
<img width="1776" height="979" alt="Játékos nézet" src="https://github.com/user-attachments/assets/02185c55-0dc8-49b7-88f0-5d5b7de582d3" />
<img width="1919" height="1079" alt="Spymaster nézet" src="https://github.com/user-attachments/assets/163f7374-a91c-4a9f-9d92-e7bc8e266021" />

---

## English

**Codeword** is a party game for FiveM, written in JavaScript and inspired by the popular
board game **Codenames**.

Two teams compete to find their agents on a 5×5 board. Each team's spymaster gives
one-word clues, and their teammates vote on which cards to reveal. Find all your agents
first, but avoid the assassin!

Place the board anywhere with `/codeword` (or put the prop in your MLO), walk up to it,
and press **E** to join.

### Usage

Free to use, modify and include on your server.
If you use it, I'd appreciate it if you credited me: **Bencso** 🙂

### Configuration

Everything can be customised in two files, no need to touch the code.

**`consts.js`** – game settings

| Setting | What it does |
|---|---|
| `MIN_PLAYERS` | Players needed to start (at least 4 recommended: a spymaster and a guesser per team) |
| `AFTERMIN_COUNTDOWN_MS` | Visszaszámlálás a lobbyban (ha megvan a minimum létszám) és a kémfőnökválasztásnál, valamint egy megszakadt játék utáni újraindításnál (ms) |
| `ROUND_COUNTDOWN_MS` | Length of a round (ms) |
| `END_SCREEN_MS` | How long the result is shown after the game ends (ms) |
| `ONE_TEAM_WORDS` | Number of cards for the starting team (the other team gets one less, one is the assassin, the rest are neutral) |
| `WORDS_FILE` | Path to the word list (one word per line, at least 25 words) |
| `TEAM_NAMES` | Display names of the teams |
| `TEAM_ONE_COLOR`, `TEAM_TWO_COLOR` | Team colours in the UI |

**`locale.js`** – every text in the UI (buttons, headings, error messages, round banners).
To translate the game, you only need to edit this one file.

### Disclaimer

Codeword is an unofficial, fan-made game based on the gameplay of Codenames. It is
**not** the original game and is not affiliated with, endorsed by, or connected to
Czech Games Edition or the creator of Codenames. "Codenames" and its
original artwork are trademarks and intellectual property of their respective owners.
No original game assets are used in this project.

### Screenshots

<img width="100%" height="642" alt="Lobby" src="https://github.com/user-attachments/assets/a2823f94-94d3-4348-aa71-1d5fbcdbc107" />
<img width="1776" height="979" alt="Játékos nézet" src="https://github.com/user-attachments/assets/02185c55-0dc8-49b7-88f0-5d5b7de582d3" />
<img width="1919" height="1079" alt="Spymaster nézet" src="https://github.com/user-attachments/assets/163f7374-a91c-4a9f-9d92-e7bc8e266021" />

