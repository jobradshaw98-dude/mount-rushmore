# Mount Rushmore Daily

A daily snake-draft party game for 2-4 friends, each on their own phone, anywhere.

- Start a **crew** once and share its link. The same link works every day.
- Round 1 each day is the shared daily topic (turns over at midnight Pacific). Deal bonus rounds with new random topics any time, and swap any round's topic (daily included) before the draft starts.
- Draft four picks each, order them, and get scored against a consensus top 24. The crew record tracks wins and averages.
- React to picks with emoji, share your mountain as a picture, browse past topics, see your stats, and suggest new topics.

Single static page (`index.html`). Live sync and the global solo leaderboard use Firebase Realtime Database (anonymous sign-in, optional Google sign-in to sync devices). Rules in `database.rules.json`. Turn alerts are one Cloud Function in `functions/`.

Topic suggestions are write-only for players. Read them with `npx firebase-tools database:get /suggestions`.
