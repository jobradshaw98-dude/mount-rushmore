# Changelog

Notable changes to Mount Rushmore Daily.

## 2026-10-04: swap a bonus round's topic

### Added
- Bonus rounds: a "New topic" button in the lobby (before the draft starts) deals a different topic for the whole crew. Any seated player can tap it, as many times as they like; it never repeats a topic already shown that day. The daily topic (round 1) stays fixed.

## 2026-09-28: turn alerts fixed, "your move" highlight

### Fixed
- Turn alerts: phones can sign up for alerts again. Since the evening of 09-27 the database rejected every sign-up because the live page used an older format.
- A new crew's creator now gets alerts in that crew's first game.
- Write-in picks are capped at 60 characters instead of failing with a vague error.
- Offline mode no longer serves the page in place of a missing script.

### Added
- Home: a crew waiting on you (your pick, or your mountain to lock in) glows gold, moves to the front and says which. The home-screen icon shows a count.

### Changed
- Game rules and scoring live in game.js, shared with the server's solo-score check.

## 2026-09-27 (night): simplification pass

### Changed
- Home is the topic, your crews and one "You" row. Stats, past topics, sync, alerts, the app, how to play and topic suggestions live on the You page.
- Crew screens: one Share invite card; crew name, alerts, leave and the win record sit in a collapsed Crew section.
- Results and solo: compact scorecards (one line per face, bonus under the points), the winner's mountain up top, one Share button that previews the picture with Share picture / Share as text.
- Reactions: tap a friend's pick (or focus it and press Enter) instead of a "+" button.
- The color key and bonus explainer moved into How to play.

## 2026-09-27 (evening)

### Added
- Share your mountain as a picture (solo and crew results); falls back to an on-screen picture when the phone blocks the share
- Emoji reactions on crew picks, live for everyone in the round; tap again to take one back
- Past topics: each earlier day's full top 24, your solo mountain, your crew results and the global top 3
- Your stats: streaks, solo average and best, share of faces in the top 4, crew wins and win rate
- Topic suggestion box (write-only; database rule added)
- Signing in now also brings earlier days' solo games to a new device

## 2026-09-27

### Added
- Crew snake-draft game, daily topic (midnight PT), bonus rounds, crew names, nudge, leave crew
- Solo daily with global leaderboard (top-50 reads, recomputed scores)
- Google sign-in sync, how-to-play guide, device-specific add-to-home-screen guide, daily streak
- Turn alerts: Cloud Function sendTurnAlert (web push), per-crew alert toggle

### Fixed
- Fair-play rules (no auto-pick, undo own pick only) for new rounds
- Mobile layout, color pass, compact home, clearer bonus labels
- Security: alert slots bound to owner; API key restricted to the site
