# Changelog

Notable changes to Mount Rushmore Daily.

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
