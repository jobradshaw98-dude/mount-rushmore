# Researched topic lists

Each `<id>.json` is the ranked top 24 for one topic and the sources it was built from. From game #13 (Oct 9 2026) the game uses these lists in place of the original hand-written ones.

How they were built (Oct 2026):
- Sources are published US polls (YouGov, Harris, Talker Research/OnePoll), large audience votes (IMDb, reader polls) and popularity data (sales, box office, viewership). Each source in a file lists its method and year.
- What people pick wins over critics: critic and editorial lists only break ties or fill spots with no audience data.
- Items are ranked by their average position across sources. `no_data_positions` marks spots no source covered; those keep the original list's order.
- `<id>.v1.json` / `.v2.json` are earlier passes kept for the record (for example, critic-led versions that were replaced).

Rebuild the game's lists after editing a file: `node tools/build-lists.js`.
