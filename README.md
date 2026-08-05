# CDOMKA Typist

Offline typing challenge for CDOMKA event booths. It runs from static HTML, CSS, and JavaScript, so it can be copied to a flash drive and opened on a computer without installing a server or build tools.

## Features

- Time, words, quote, and competition typing modes
- Competition mode with `thicc 15s` and `thicc 30s` options
- Local leaderboard stored in the browser
- Hidden competition text editor at `admin.html`
- Offline-first assets and data
- Monkeytype-inspired typing feedback and quote mode

## Running

Open `index.html` in a browser.

For local editing of competition prompts, open `admin.html` directly. It is intentionally not linked from the main page.

## Local Data

The app stores data in browser local storage:

- `cdomkaTypingLeaderboard` - local leaderboard scores
- `cdomkaCompetitionTexts` - edited competition prompts from `admin.html`

Clearing browser data will clear both.

## Files

- `index.html` - main typing challenge
- `admin.html` - hidden prompt editor
- `main.js` - typing logic, scoring, leaderboard, lazy quote loading
- `admin.js` - competition prompt editor
- `competition-quotes-data.js` - built-in competition prompt data
- `mt-english-data.js` - Monkeytype English quote data, lazy-loaded only for quote mode
- `assets/` - local logos and background image

## Scoring

Score is calculated from speed and accuracy:

```text
score = WPM * accuracy
```

The leaderboard sorts by score first, then accuracy, then WPM.

## License

This project is licensed under the GNU General Public License v3.0 or later. See `LICENSE`.

Monkeytype-derived data and design references are also GPL-3.0. Event logos, partner logos, and bundled media assets may have separate rights and are included for the CDOMKA event build.
