# Researched topic lists

Each `<id>.json` is the ranked top 24 for one topic and the sources it was built from. From game #13 (Oct 9 2026) the game uses these lists in place of the original hand-written ones. Since Oct 10 2026 a weekly job (`~/.claude/scheduled-tasks/aria-rushmore-topics/`) adds new topics and re-ranks weak lists.

## The goal of a list

The board is a guess at **what a typical American adult would name** for the topic, in the order most people would name it. It is not a list of what is best. A player who types the obvious answer should find it near the top.

## Method (Oct 10 2026, after Jordan flagged wrong orders and obvious misses)

1. **Sources, best first:**
   - General-public polls that ask for favorites (YouGov, Harris, Gallup, Talker Research/OnePoll, Ipsos, Morning Consult), US where possible.
   - Popularity/fame data across the whole public: YouGov Ratings popularity, sales, box office, streams, viewership, registrations, search interest.
   - Large audience votes (IMDb, reader polls) only when nothing broader exists.
   - Critic, editorial and enthusiast lists (IGN, Rolling Stone, Metacritic, GOTY votes, fan forums) **only break ties**. They skew toward what experts admire, which is how The Witcher 3 ended up #1 in video games.
2. **Rank** by average position across the people sources (missing = list length + 5), ties by number of sources.
3. **Gut check (required):** write down, before looking at the ranking, the 12 answers a typical adult would say first. Any of those below #12 or missing from the 24 needs a source that puts it lower; otherwise move it up to where the people sources and the gut check agree. Record each move in `changes_vs_current` with the reason.
4. **Evidence floor:** every top-10 item is backed by at least 2 people sources. Tail spots may lean on one source, but no spot is a carryover with no data (`no_data_positions` should be empty).
5. **Aliases:** add the short names people type (nicknames, missing "The", common misspellings). Aliases must not collide across items (`build-lists.js` checks).

## Files

- `<id>.json`: the current list. Fields: `sources` (name, url, method, year, kind: `people` | `critic`), `list` (24 lines `Label|alias|alias`), `changes_vs_current`, `confidence`, `no_data_positions`, and `from` (first day it is used; default 13).
- `<id>.from<day>.json`: an earlier version still needed for days already played. **Never edit a list that is in play**: copy it to `<id>.from<its from>.json`, then write the new list into `<id>.json` with `from` set to a day not yet played (today + 2 or later). Old games keep the list they were scored on.
- New topics: a `<id>.json` with a `topic` block: `{"name": "Car Brands", "note": "optional subtitle", "cat": "brands", "from": <day>}`. `cat` is one of food, sports, screen, music, play, life, places, brands, people (two topics from one category never come back to back). Ids are 2-14 lowercase letters/digits and are never removed.
- `<id>.v1.json` / `.v2.json`: earlier research passes kept for the record (not used by the game).
- `_queue.json`: lists waiting to be re-ranked, worst first, and the suggestion box items already handled.

## Shipping

`node tools/ship.js "<message>"` builds the lists, proves no played day changed (`tools/check-history.js`), commits, pushes the page, deploys the server function and checks the live site. `--dry` stops before the commit.
