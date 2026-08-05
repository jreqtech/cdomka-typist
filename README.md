# CDOMKA Typist

Offline typing challenge for CDOMKA event booths. It runs from static HTML, CSS, and JavaScript, so it can be copied to a flash drive and opened on a computer without installing a server or build tools.

Try it online: https://jreqtech.github.io/cdomka-typist/

## Download

To run it offline:

1. Open the GitHub repository.
2. Click `Code`.
3. Click `Download ZIP`.
4. Extract the ZIP file.
5. Open `index.html` in a browser.

The extracted folder can be copied to a flash drive and used on another computer.

## Features

- Time, words, quote, and Hot Takes typing modes
- Hot Takes mode with `thicc 15s`, `thicc 30s`, and `full run` options
- Local leaderboard stored in the browser
- Hidden Hot Takes text editor at `admin.html`
- Offline-first assets and data
- Monkeytype-inspired typing feedback and quote mode

## Running

Open `index.html` in a browser.

For local editing of Hot Takes prompts, open `admin.html` directly. It is intentionally not linked from the main page.

## Local Data

The app stores data in browser local storage:

- `cdomkaTypingLeaderboard` - local leaderboard scores
- `cdomkaCompetitionTexts` - edited Hot Takes prompts from `admin.html`

Clearing browser data will clear both.

## Files

- `index.html` - main typing challenge
- `admin.html` - hidden prompt editor
- `main.js` - typing logic, scoring, leaderboard, lazy quote loading
- `admin.js` - Hot Takes prompt editor
- `competition-quotes-data.js` - built-in Hot Takes prompt data
- `mt-english-data.js` - Monkeytype English quote data, lazy-loaded only for quote mode
- `assets/` - local logos and background image

## FAQ

### How is score calculated?

Score is calculated from speed and accuracy:

```text
score = WPM * (accuracy / 100)
```

For example, `80 WPM` at `95%` accuracy gives a score of `76`.

Accuracy is based on keypresses during the test:

```text
accuracy = correct keypresses / total counted keypresses
```

Incorrect keypresses count against accuracy even if the player fixes them afterward. This matches Monkeytype-style scoring: backspace can fix the visible text and let the player continue, but it does not erase the mistake from the accuracy calculation.

Empty runs show `0%` accuracy, `0 WPM`, and `0` score.

The leaderboard sorts by score first, then accuracy, then WPM.

### What are the rank thresholds?

Ranks are based on the final score:

```text
S+ = 120+
S  = 100-119
A  = 80-99
B  = 60-79
C  = 40-59
D  = 20-39
F  = below 20
```

### What happens if someone stops typing?

After a test has started, the app watches for inactivity. If there are no typing keypresses for 5 seconds, the test ends automatically.

Hot Takes mode does not start the timer or idle check while the blurred prompt is waiting for `space`. The run starts only after the player presses `space` to begin.

### How does backspace affect scoring?

Backspace only edits the current typed text. It does not remove earlier wrong keypresses from the accuracy record.

Example: if a player types the wrong letter, presses backspace, then types the correct letter, the final visible text can be correct, but the original wrong keypress still lowers accuracy. This prevents players from clearing mistakes for a perfect score after correcting them.

### Are the Hot Takes prompts serious opinions?

No. Hot Takes prompts are intentionally written as light ragebait for booth energy.

Prompt opinions do not reflect the keyboard club, probably.

## License

This project is licensed under the GNU General Public License v3.0 or later. See `LICENSE`.

Monkeytype-derived data and design references are also GPL-3.0. Event logos, partner logos, and bundled media assets may have separate rights and are included for the CDOMKA event build.
