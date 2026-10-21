# Changelog

Notable changes to Mount Rushmore Daily.

## 2026-10-21: join after the start

### Changed
- Missed the Start? You can still take a seat until the first pick is made. Late joiners go to the end of the pick order. Four players max, as before.

## 2026-10-19: National Parks, Clothing Brands, Comedians, Flowers and Toys; Desserts and Sandwiches re-ranked

### Added
- Five new topics: National Parks, Clothing Brands, Comedians (all-time), Flowers and Toys (all-time). They show up in bonus rounds from game #24 (Oct 21) and join the daily rotation when the next cycle starts.

### Changed
- From game #24, Desserts has data behind every spot: Ice Cream moves up to #1, then Chocolate Chip Cookies and Brownies. Donuts rise from #21 to #5; Apple Pie drops from #2 to #6 and Chocolate Cake from #4 to #10. "Cake" and "Pie" are now answers of their own, and Cupcakes, Fudge, Milkshake, Ice Cream Sandwich and Funnel Cake join; Tiramisu, Churros, Cannoli, Crème Brûlée and Macarons leave.
- From game #24, Sandwiches has data behind every spot: Grilled Cheese stays #1 and Turkey #2. Philly Cheesesteak rises from #13 to #6, Tuna from #7 to #3 and Pulled Pork from #8 to #5; Roast Beef drops from #4 to #9 and Reuben from #14 to #17. Bacon Egg and Cheese, Bologna and Fluffernutter join; Egg Salad, French Dip, Chicken Parm and Gyro leave.

## 2026-10-11: Countries, Actors, Beer, Pets and Card Games; Superheroes and Pasta re-ranked

### Added
- Five new topics: Countries to Visit (outside the US), Actors (all-time), Beer Brands, Pets and Card Games. They show up in bonus rounds from game #17 (Oct 13) and join the daily rotation when the next cycle starts.

### Changed
- From game #17, Superheroes follows public polls, box office and search interest instead of IGN's 2011 critic list: Spider-Man #1, then Batman and Superman. Iron Man rises from #7 to #4 and Wolverine from #6 to #5. Black Panther jumps from #18 to #9, Deadpool from #15 to #10 and Doctor Strange from #19 to #12. The Flash drops from #11 to #21. Black Widow, Jean Grey, The Punisher, Ghost Rider and Ant-Man join; Green Arrow, Cyclops, Storm, Hawkeye and Shazam leave.
- From game #17, Pasta Shapes has data behind every spot (search interest fills the tail): Penne rises from #5 to #2 and Farfalle from #10 to #7, Fettuccine drops from #2 to #5. Gnocchi rises from #18 to #13 and Orzo from #21 to #14; Manicotti drops from #11 to #15 and Orecchiette from #16 to #24.

## 2026-10-10: fewer repeated topics

### Changed
- From game #16 (Oct 12), bonus rounds and the New topic button offer topics your crew has not seen in the last 7 days first, including the daily topics you played. Before, a swap could offer a topic you played the day before.
- The weekly topic routine now adds 5 new topics a week instead of 3.

## 2026-10-10: US Presidents, US Cities and Sodas; Rappers and Fruits re-ranked

### Added
- Three new topics: US Presidents, US Cities (to visit) and Sodas. They show up in bonus rounds from game #16 (Oct 12) and join the daily rotation when the next cycle starts.

### Changed
- From game #16, Rappers follows what people name and know over critics: Eminem #1, then Drake, Tupac and Snoop Dogg. Biggie rises from #16 to #9 and Dr. Dre to #10. Ice Cube drops from #13 to #14 and J. Cole from #12 to #24. Cardi B, MC Hammer and Vanilla Ice join; Nas, André 3000 and Nelly leave.
- From game #16, Fruits puts the everyday favorites first: bananas, strawberries, grapes, watermelon, apples, then oranges. Lemons drop from #5 to #15, and peaches and cherries move up. Honeydew joins; grapefruit leaves.

## 2026-10-10: new topics weekly, Video Games and Breakfast re-ranked

### Added
- Three new topics from the suggestion box: Athletes (all-time, any sport), Car Brands and Summer Activities. They show up in bonus rounds from game #16 (Oct 12) and join the daily rotation when the next cycle starts.
- A weekly job now adds about 3 topics and re-ranks 2 weak lists every Sunday, starting from a day nobody has played yet.

### Changed
- From game #16, Video Games is ranked by what most people name, not what gamers and critics rate: Super Mario Bros. #1, then Minecraft and Tetris; Pokemon, Call of Duty, Pac-Man and Halo are on the board; The Witcher 3 and Cyberpunk are off.
- From game #16, Breakfast puts the dishes people name first: eggs, bacon, pancakes, waffles, French toast. Fruit and toast drop.

## 2026-10-07: researched lists from #13

### Changed
- From game #13 (Oct 9), every topic uses a top 24 ranked from published polls, fan votes and sales instead of a hand-written list, with what people pick ranked above what critics pick. Sources for each topic are in research/. Games before #13 keep the lists they were played on.

## 2026-10-07: steeper scoring from #12

### Changed
- From game #12 (Oct 8), points fall off fast so the top of the board is worth chasing: #1 is 150, #2 136, #4 112, #10 68, #24 36 (was 100 down to 31 by 3s). A perfect mountain scores 521.
- The order you carve your four in no longer scores (the +10 right-order and +15 exact-spot bonuses are gone). Games before #12 keep their old scores.

## 2026-10-04: swap a round's topic

### Changed
- "New topic" now works on the daily round too, for a crew that already played today's topic in person. Past topics shows which topic a swapped game used.


### Added
- Bonus rounds: a "New topic" button in the lobby (before the draft starts) deals a different topic for the whole crew. Any seated player can tap it, as many times as they like; it never repeats a topic already shown in that round or dealt as a bonus round that day.
- A phone running an older copy of the game now asks to update when it sees a move it doesn't understand, instead of silently keeping a different score. The daily topic (round 1) stays fixed.

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
