/* Mount Rushmore Daily: topics, matching, the daily calendar and scoring.
   Shared by the page (loaded as a plain script, so these names are globals) and the server
   function that re-checks leaderboard posts (loaded with require). Keep it free of browser APIs. */
"use strict";
/* ------------------------------------------------------------------
   TOPICS: each list is the consensus board, ranked 1..24.
   Format per line: Label|alias|alias
------------------------------------------------------------------- */
const TOPICS = [
{id:"nba",name:"NBA Players",note:"All-time",items:`Michael Jordan|mj
LeBron James|lebron|king james|bron
Kareem Abdul-Jabbar|kareem
Magic Johnson|magic
Bill Russell
Wilt Chamberlain|wilt
Larry Bird|bird
Kobe Bryant|kobe
Tim Duncan|duncan
Shaquille O'Neal|shaq
Stephen Curry|steph|curry
Hakeem Olajuwon|hakeem|the dream
Kevin Durant|kd|durant
Oscar Robertson|big o
Kevin Garnett|kg
Jerry West|the logo
Julius Erving|dr j
Nikola Jokic|jokic|joker
Dirk Nowitzki|dirk
Giannis Antetokounmpo|giannis|greek freak
Moses Malone
Karl Malone|the mailman
Elgin Baylor
David Robinson|the admiral`},
{id:"breakfast",name:"Breakfast Foods",items:`Pancakes|flapjacks|hotcakes
Bacon
Eggs|scrambled eggs|fried eggs
Waffles
French Toast
Breakfast Burrito
Bagel|bagel and cream cheese|lox bagel
Hash Browns|hashbrowns
Omelette|omelet
Biscuits and Gravy
Cereal
Eggs Benedict|benedict
Sausage|breakfast sausage
Breakfast Sandwich|egg sandwich|bacon egg and cheese|bec
Chicken and Waffles
Croissant
Cinnamon Roll
Avocado Toast
Oatmeal|porridge
Donut|doughnut
Grits
Yogurt Parfait|yogurt|parfait
Muffin|blueberry muffin
Shakshuka`},
{id:"pizza",name:"Pizza Toppings",items:`Pepperoni
Sausage|italian sausage
Mushrooms
Extra Cheese|cheese
Onions
Bacon
Green Peppers|peppers|bell peppers
Black Olives|olives
Pineapple
Ham
Jalapeños|jalapenos|jalapeno
Chicken
Hot Honey
Basil|fresh basil
Spinach
Garlic
Tomatoes|tomato
Meatballs
Banana Peppers
Ricotta
Prosciutto
Anchovies
Artichokes|artichoke
Arugula`},
{id:"pixar",name:"Pixar Movies",items:`Toy Story
Up
Inside Out
WALL-E|walle
Finding Nemo|nemo
Ratatouille
The Incredibles
Coco
Toy Story 3
Monsters, Inc.|monsters inc
Toy Story 2
Soul
Cars
Incredibles 2
Toy Story 4
Inside Out 2
Brave
A Bug's Life|bugs life
Finding Dory|dory
Monsters University
Luca
Turning Red
Onward
Elemental`},
{id:"fastfood",name:"Fast Food Chains",items:`In-N-Out|innout|in and out
Chick-fil-A|chickfila|cfa
McDonald's|mcdonalds|mickey ds
Taco Bell
Wendy's
Chipotle
Five Guys
Raising Cane's|canes
Popeyes
Whataburger
Shake Shack
Culver's
Burger King|bk
Subway
Panda Express|panda
KFC|kentucky fried chicken
Jack in the Box
Sonic
Wingstop
Jersey Mike's
Arby's
Dairy Queen|dq
Del Taco
Carl's Jr.|carls junior`},
{id:"music",name:"Musical Artists",note:"All-time",items:`The Beatles
Michael Jackson|mj
Elvis Presley|elvis
Queen
Led Zeppelin|zeppelin
The Rolling Stones|stones
Prince
Bob Dylan|dylan
Taylor Swift|taylor
Beyoncé
Pink Floyd
Madonna
David Bowie|bowie
Stevie Wonder
Whitney Houston|whitney
Aretha Franklin|aretha
Nirvana
Jimi Hendrix|hendrix
Bruce Springsteen|springsteen|the boss
Elton John
Johnny Cash
Frank Sinatra|sinatra
Bob Marley|marley
Fleetwood Mac`},
{id:"golf",name:"Golfers",note:"All-time",items:`Tiger Woods|tiger
Jack Nicklaus|nicklaus|golden bear
Arnold Palmer|arnie
Ben Hogan
Bobby Jones
Sam Snead
Gary Player
Tom Watson
Phil Mickelson|phil|lefty
Scottie Scheffler|scheffler
Rory McIlroy|rory|mcilroy
Byron Nelson
Walter Hagen
Seve Ballesteros|seve
Lee Trevino|trevino
Annika Sörenstam|annika
Nick Faldo|faldo
Gene Sarazen
Ernie Els|els
Harry Vardon
Mickey Wright
Greg Norman|the shark
Vijay Singh|vijay
Brooks Koepka|koepka`},
{id:"sitcoms",name:"Sitcoms",items:`Seinfeld
The Office
Friends
Parks and Recreation|parks and rec
Arrested Development
The Simpsons
Curb Your Enthusiasm|curb
It's Always Sunny in Philadelphia|always sunny|iasip
Cheers
Frasier
Brooklyn Nine-Nine|b99|brooklyn 99
30 Rock
Modern Family
How I Met Your Mother|himym
Community
Schitt's Creek
The Fresh Prince of Bel-Air|fresh prince
M*A*S*H|mash
Everybody Loves Raymond|raymond
Scrubs
I Love Lucy
Abbott Elementary|abbott
New Girl
That '70s Show|70s show`},
{id:"candy",name:"Candy",items:`Reese's Peanut Butter Cups|reeses|reeses cups|peanut butter cups
Snickers
Kit Kat|kitkat
Twix
M&M's|mms
Sour Patch Kids|sour patch
Skittles
Peanut M&M's|peanut mms
Butterfinger
Starburst
Hershey's Bar|hersheys|hershey bar
3 Musketeers|three musketeers
Swedish Fish
Nerds
Milky Way
Twizzlers
Reese's Pieces
Gummy Bears|gummies
Airheads
Jolly Ranchers|jolly rancher
Almond Joy
Nerds Gummy Clusters|nerds clusters
Junior Mints
Whoppers`},
{id:"villains",name:"Movie Villains",items:`Darth Vader|vader
The Joker|joker
Hannibal Lecter|hannibal
Voldemort|lord voldemort
Thanos
Anton Chigurh|chigurh
Hans Gruber|gruber
Norman Bates
Scar
Emperor Palpatine|palpatine|the emperor
Nurse Ratched|ratched
Agent Smith
The Terminator|t 800
Freddy Krueger|freddy
Michael Myers
Hans Landa|colonel landa|landa
Loki
Gollum|smeagol
Sauron
Bane
Ursula
Maleficent
Pennywise
Jaws|the shark`},
{id:"sandwiches",name:"Sandwiches",items:`Philly Cheesesteak|cheesesteak|philly cheese steak
BLT
Grilled Cheese
Reuben
Italian Sub|italian hoagie|italian
Fried Chicken Sandwich|chicken sandwich
Cuban|cubano
Banh Mi
French Dip
Club Sandwich|club|turkey club
Meatball Sub
Pastrami on Rye|pastrami
Chicken Parm|chicken parmesan
Peanut Butter and Jelly|pbj|pb and j
Tuna Melt
Po' Boy|poboy
Lobster Roll
Muffuletta
Gyro
Patty Melt
Monte Cristo
Sloppy Joe
Caprese
Egg Salad`},
{id:"boardgames",name:"Board Games",items:`Monopoly
Catan|settlers of catan
Chess
Scrabble
Clue|cluedo
Risk
Ticket to Ride
Codenames
Trivial Pursuit
The Game of Life|life|game of life
Sorry!
Connect Four|connect 4
Battleship
Pandemic
Candy Land|candyland
Checkers
Stratego
Backgammon
Guess Who?
Operation
Carcassonne
Wingspan
Mouse Trap|mousetrap
Chutes and Ladders`},
{id:"superheroes",name:"Superheroes",items:`Spider-Man|spiderman|spidey
Batman
Superman
Iron Man|ironman|tony stark
Wonder Woman
Captain America|cap
Wolverine|logan
The Hulk|hulk
Thor
Black Panther
The Flash|flash
Deadpool
Doctor Strange|dr strange
Aquaman
Green Lantern
Black Widow
Captain Marvel
Daredevil
Storm
Ant-Man|antman
Green Arrow
Hawkeye
Cyclops
Shazam`},
{id:"holidays",name:"Holidays",items:`Christmas|xmas
Thanksgiving
Halloween
Fourth of July|july 4th|4th of july|independence day
New Year's Eve|nye|new years
Easter
Valentine's Day|valentines
St. Patrick's Day|saint patricks day|st paddys
Super Bowl Sunday|super bowl
Hanukkah|chanukah
Mother's Day
Memorial Day
Labor Day
Father's Day
Lunar New Year|chinese new year
Diwali
Cinco de Mayo
Mardi Gras
Juneteenth
Kwanzaa
Veterans Day
MLK Day|martin luther king day
April Fools' Day|april fools
Groundhog Day`},
{id:"videogames",name:"Video Games",note:"All-time",items:`Super Mario 64|mario 64|sm64
The Legend of Zelda: Ocarina of Time|ocarina of time|ocarina|oot
The Legend of Zelda: Breath of the Wild|breath of the wild|botw
Tetris
Minecraft
Super Mario Bros.|super mario brothers
Grand Theft Auto V|gta 5|gta v|gta
Red Dead Redemption 2|rdr2|red dead 2|red dead
The Last of Us|tlou
Halo: Combat Evolved|halo|halo ce
Pokémon Red and Blue|pokemon red|pokemon blue|pokemon
The Elder Scrolls V: Skyrim|skyrim
Elden Ring
The Witcher 3|witcher
Street Fighter II|street fighter 2|street fighter
Pac-Man|pacman
Half-Life 2|half life
GoldenEye 007|goldeneye
Super Smash Bros. Melee|melee|smash bros|smash
Final Fantasy VII|ff7|final fantasy 7
Portal 2|portal
Mario Kart 8|mario kart
Call of Duty 4: Modern Warfare|cod4|modern warfare|call of duty
Fortnite`},
{id:"cereal",name:"Breakfast Cereals",items:`Cinnamon Toast Crunch|ctc
Frosted Flakes
Honey Nut Cheerios
Reese's Puffs
Lucky Charms
Froot Loops|fruit loops
Cap'n Crunch|captain crunch
Frosted Mini-Wheats|mini wheats
Honey Bunches of Oats
Fruity Pebbles
Cocoa Puffs
Cheerios
Apple Jacks
Golden Grahams
Cocoa Pebbles
Rice Krispies
Raisin Bran
Corn Flakes
Cookie Crisp
Trix
Crispix
Corn Pops
Honey Smacks
Kix`},
{id:"events",name:"Sporting Events",items:`Super Bowl
World Cup Final|world cup
March Madness|ncaa tournament
The Masters
NBA Finals
World Series
Summer Olympics|olympics
Kentucky Derby
Wimbledon
Stanley Cup Final|stanley cup
Champions League Final|ucl final
Ryder Cup
Daytona 500
Indianapolis 500|indy 500
College Football Playoff|cfp
Tour de France
The Open Championship|british open|the open
Winter Olympics
US Open Tennis|us open
NFL Draft
Home Run Derby
Rose Bowl
Army-Navy Game|army navy
Boston Marathon`},
{id:"condiments",name:"Condiments",items:`Ketchup|catsup
Ranch
Hot Sauce
Mayonnaise|mayo
Mustard|yellow mustard
BBQ Sauce|barbecue sauce|bbq
Sriracha
Soy Sauce
Salsa
Buffalo Sauce|buffalo
Honey Mustard
Guacamole|guac
Chick-fil-A Sauce|cfa sauce
Aioli|garlic aioli
Tzatziki
Chimichurri
Pesto
Sweet Chili Sauce|sweet chili
Tartar Sauce
Relish
Horseradish
Gochujang
Teriyaki Sauce|teriyaki
Worcestershire Sauce|worcestershire`},
{id:"movies",name:"Movies",note:"All-time",items:`The Godfather|godfather
The Shawshank Redemption|shawshank
The Dark Knight
Pulp Fiction
Star Wars|a new hope
The Empire Strikes Back|empire strikes back
Goodfellas
Casablanca
Jaws
Back to the Future|bttf
Schindler's List
Forrest Gump
Jurassic Park
The Godfather Part II|godfather 2|godfather part 2
Raiders of the Lost Ark|raiders|indiana jones
The Lord of the Rings: The Return of the King|return of the king|lotr|lord of the rings
Titanic
The Matrix
Fight Club
Gladiator
Saving Private Ryan
Inception
E.T. the Extra-Terrestrial|et
Citizen Kane`},
{id:"dogs",name:"Dog Breeds",items:`Golden Retriever|golden
Labrador Retriever|lab|labrador
German Shepherd
Bernese Mountain Dog|berner|bernese
French Bulldog|frenchie
Australian Shepherd|aussie
Border Collie
Corgi
Siberian Husky|husky
Beagle
Goldendoodle|doodle
Poodle
Dachshund|wiener dog|sausage dog
Boxer
Cavalier King Charles Spaniel|cavalier
Pit Bull|pitbull|pittie
Great Dane
Rottweiler|rottie
Shiba Inu|shiba
Doberman
English Bulldog|bulldog
Pug
Dalmatian
Chihuahua`},
{id:"cocktails",name:"Cocktails",items:`Margarita
Old Fashioned
Espresso Martini
Negroni
Mojito
Martini|dry martini
Moscow Mule|mule
Aperol Spritz|spritz
Manhattan
Piña Colada
Whiskey Sour
Paloma
Daiquiri
Mai Tai
Gin and Tonic|g and t|gin tonic
French 75
Cosmopolitan|cosmo
Bloody Mary
Long Island Iced Tea|long island
Mint Julep
Tom Collins
Sazerac
Dark 'n' Stormy|dark and stormy
Gimlet`},
{id:"desserts",name:"Desserts",items:`Chocolate Chip Cookies|cookies|chocolate chip cookie
Cheesecake
Ice Cream
Brownies
Tiramisu
Apple Pie
Chocolate Cake
Crème Brûlée
Key Lime Pie
Churros
Banana Pudding
Carrot Cake
Cinnamon Rolls|cinnamon roll
Red Velvet Cake|red velvet
Cannoli
Pumpkin Pie
Peach Cobbler|cobbler
Strawberry Shortcake
Lava Cake|molten lava cake
Donuts|doughnuts
Macarons
S'mores
Bread Pudding
Milkshake`},
{id:"rappers",name:"Rappers",note:"All-time",items:`Tupac|2pac|tupac shakur
The Notorious B.I.G.|biggie|biggie smalls
Jay-Z|jayz|hov
Eminem|slim shady
Kendrick Lamar|kendrick
Nas
Kanye West|kanye|ye
Lil Wayne|weezy|wayne
Drake
André 3000|andre|3 stacks
Snoop Dogg|snoop
Rakim
Ice Cube
J. Cole|cole
Lauryn Hill
Dr. Dre|dre
Nicki Minaj|nicki
Missy Elliott|missy
50 Cent|fifty cent
DMX
Method Man
KRS-One
Busta Rhymes|busta
Travis Scott`},
{id:"disney",name:"Disney Animated Movies",items:`The Lion King
Beauty and the Beast
Aladdin
The Little Mermaid
Moana
Frozen
Tangled
Mulan
Lilo & Stitch
Zootopia
Cinderella
Snow White and the Seven Dwarfs|snow white
The Jungle Book
Encanto
Sleeping Beauty
Tarzan
Peter Pan
Hercules
Pinocchio
Bambi
101 Dalmatians
The Emperor's New Groove
Wreck-It Ralph
Fantasia`},
{id:"fruit",name:"Fruits",items:`Strawberries|strawberry
Mango
Watermelon
Pineapple
Blueberries|blueberry
Grapes
Peaches|peach
Raspberries|raspberry
Bananas
Cherries|cherry
Apples
Oranges
Kiwi
Blackberries|blackberry
Cantaloupe
Pears
Clementines|clementine|cuties|mandarin
Plums
Pomegranate
Lychee
Papaya
Grapefruit
Dragon Fruit
Passion Fruit`},
{id:"qbs",name:"NFL Quarterbacks",note:"All-time",items:`Tom Brady|brady|tb12
Peyton Manning|peyton
Joe Montana|montana
Patrick Mahomes|mahomes
Johnny Unitas|unitas
Dan Marino|marino
John Elway|elway
Aaron Rodgers|rodgers
Drew Brees|brees
Brett Favre|favre
Steve Young
Otto Graham
Roger Staubach|staubach
Terry Bradshaw
Troy Aikman|aikman
Bart Starr
Fran Tarkenton|tarkenton
Kurt Warner
Jim Kelly
Josh Allen
Lamar Jackson|lamar
Ben Roethlisberger|big ben
Warren Moon
Joe Burrow|burrow`},
{id:"chips",name:"Chips & Salty Snacks",items:`Doritos Nacho Cheese|doritos|nacho cheese doritos
Cool Ranch Doritos|cool ranch
Flamin' Hot Cheetos|hot cheetos
Cheetos
Lay's Classic|lays
Takis
Pringles
Ruffles
Kettle Chips|kettle
Salt and Vinegar Chips|salt and vinegar
Tostitos
Fritos
Sun Chips|sunchips
Goldfish
Cheez-It|cheezits
Funyuns
Pretzels
Chex Mix
Popcorn
Cape Cod Chips|cape cod
Sour Cream & Onion Chips|sour cream and onion
BBQ Chips|barbecue chips
Veggie Straws
Bugles`},
{id:"soccer",name:"Soccer Players",note:"All-time",items:`Lionel Messi|messi|leo messi
Cristiano Ronaldo|cr7|cristiano|ronaldo
Pelé
Diego Maradona|maradona
Johan Cruyff|cruyff
Zinedine Zidane|zidane|zizou
Ronaldo Nazário|r9|brazilian ronaldo
Franz Beckenbauer|beckenbauer
Alfredo Di Stéfano|di stefano
Ronaldinho
Kylian Mbappé|mbappe
Thierry Henry|henry
Paolo Maldini|maldini
Ferenc Puskás|puskas
Andrés Iniesta|iniesta
Xavi
George Best
Eusébio
Lev Yashin|yashin
Kaká
Zlatan Ibrahimović|zlatan
Erling Haaland|haaland
Luka Modrić|modric
Neymar`},
{id:"dramas",name:"TV Dramas",items:`Breaking Bad
The Sopranos
The Wire
Game of Thrones|got
Mad Men
Better Call Saul
Succession
The West Wing
Lost
Friday Night Lights|fnl
True Detective
Stranger Things
Six Feet Under
Band of Brothers
Chernobyl
Twin Peaks
The Leftovers
Deadwood
Severance
The Crown
Yellowstone
Ozark
Peaky Blinders
House of the Dragon`},
{id:"pasta",name:"Pasta Shapes",items:`Spaghetti
Penne
Rigatoni
Fettuccine|fettucine
Linguine|linguini
Bucatini
Orecchiette
Pappardelle
Farfalle|bow ties|bowtie
Rotini
Macaroni|elbows|elbow macaroni
Tortellini
Ravioli
Gnocchi
Lasagna|lasagne
Fusilli
Angel Hair|capellini
Cavatappi
Ziti
Orzo
Shells|conchiglie
Tagliatelle
Cavatelli
Ditalini`}
];

/* Topic revisions take effect from REVISE_FROM so games already played keep the list they were scored on. */
const REVISE_FROM = 2;
const CATEGORY = {breakfast:"food",pizza:"food",fastfood:"food",candy:"food",sandwiches:"food",condiments:"food",cocktails:"food",desserts:"food",fruit:"food",chips:"food",pasta:"food",cereal:"food",
  nba:"sports",golf:"sports",events:"sports",qbs:"sports",soccer:"sports",
  pixar:"screen",sitcoms:"screen",villains:"screen",movies:"screen",disney:"screen",dramas:"screen",superheroes:"screen",videogames:"screen",
  music:"music",rappers:"music", boardgames:"play",holidays:"life",dogs:"life"};
function revise(base, id, drop, insert){
  const lines=base.items.trim().split("\n").filter(l=>!drop.includes(l.split("|")[0].trim()));
  for(const [pos,line] of insert) lines.splice(pos-1, 0, line);
  return {...base, id, base:base.id, items:lines.join("\n")};
}
const REVISED = [
  revise(TOPICS.find(t=>t.id==="villains"), "villains2", ["Loki","Bane"],
    [[10,"The Wicked Witch of the West|wicked witch|wicked witch of the west"],[15,"Cruella de Vil|cruella|cruella deville"]]),
  revise(TOPICS.find(t=>t.id==="boardgames"), "boardgames2", ["Wingspan","Mouse Trap"],
    [[5,"Uno"],[12,"Jenga"]]),
];
const REV = Object.fromEntries(REVISED.map(t=>[t.base,t]));
const ALL_TOPICS = TOPICS.concat(REVISED);

/* ---------------- matching ---------------- */
function key(s){
  let t = String(s).normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase()
    .replace(/&/g," and ").replace(/['’.]/g,"").replace(/[^a-z0-9]+/g," ").trim();
  t = t.replace(/^the /,"");
  return t.split(" ").filter(Boolean).map(w => (w.length>=2 && w.endsWith("s") && !w.endsWith("ss")) ? w.slice(0,-1) : w).join(" ");
}
for (const t of ALL_TOPICS){
  t.entries = t.items.trim().split("\n").map((line,i)=>{
    const [label,...al] = line.split("|").map(x=>x.trim());
    const k = key(label);
    return {label, rank:i+1, keys:[k, ...al.map(key)], tokens:k.split(" ").filter(w=>w.length>=4)};
  });
  t.size = t.entries.length;
}
const TOPIC = Object.fromEntries(ALL_TOPICS.map(t=>[t.id,t]));
function matchEntry(t, text){
  const k = key(text); if(!k) return null;
  const exact = t.entries.find(e=>e.keys.includes(k)); if(exact) return exact;
  if(!k.includes(" ") && k.length>=4){ const c=t.entries.filter(e=>e.tokens.includes(k)); if(c.length===1) return c[0]; }
  if(k.length>=6){ const c=t.entries.filter(e=>e.keys[0].includes(k)); if(c.length===1) return c[0]; }
  return null;
}
function titleCase(s){ return s.trim().replace(/\s+/g," ").slice(0,40).replace(/\b([a-z])/g,(m,c)=>c.toUpperCase()); }

/* ---------------- daily (one calendar for everyone: the day turns over at midnight Pacific) ---------------- */
const TZ = "America/Los_Angeles";
function ptParts(d=new Date()){
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-US",{timeZone:TZ,year:"numeric",month:"numeric",day:"numeric",hour:"numeric",minute:"numeric",hourCycle:"h23"}).formatToParts(d).map(x=>[x.type,x.value]));
  return {y:+p.year, m:+p.month, d:+p.day, h:+p.hour, min:+p.minute};
}
function dayNumber(d=new Date()){ const p=ptParts(d); return Math.round((Date.UTC(p.y,p.m-1,p.d)-Date.UTC(2026,8,27))/864e5)+1; } // #1 = Sep 27 2026
function shortDay(n){ return new Date(Date.UTC(2026,8,27)+(n-1)*864e5).toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric",timeZone:"UTC"}); }
function dayLabel(n){ const t=new Date(Date.UTC(2026,8,27)+(n-1)*864e5); return t.toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric",timeZone:"UTC"}); }
function untilTomorrow(){ const p=ptParts(); const m=Math.max(1,1440-(p.h*60+p.min)); return `${Math.floor(m/60)}h ${m%60}m`; }
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function shuffled(list, seed){ const r=mulberry(seed), p=list.slice(); for(let i=p.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[p[i],p[j]]=[p[j],p[i]]} return p; }
function hash(str){ let h=2166136261; for(const c of str){ h^=c.charCodeAt(0); h=Math.imul(h,16777619); } return h>>>0; }
/* The daily rotation runs in cycles. Each cycle shuffles the topics available when it starts, so a
   new topic (add it at the END of TOPICS with from: <first day it may appear>) never changes a day
   that has already been played. Cycle 1 is the original order (seed 1776). */
const avail = day => TOPICS.map((t,i)=>i).filter(i=>(TOPICS[i].from||1)<=day);
function dayIndex(n){
  if(n<1) return shuffled(avail(1),1776)[((n-1)%TOPICS.length+TOPICS.length)%avail(1).length];
  for(let start=1, c=0;; c++){
    const pool=avail(start), order=shuffled(pool, 1776+c);
    if(n<start+order.length) return order[n-start];
    start+=order.length;
  }
}
const onDay = (t, day) => (day>=REVISE_FROM && REV[t.id]) || t;
function topicForDay(n){ return onDay(TOPICS[dayIndex(n)], n); }
/* Reorder a shuffled list so two topics from the same category never sit back to back. */
function spreadOut(list, prevCat){
  const out=[], pool=list.slice();
  while(pool.length){
    const last = out.length ? CATEGORY[out[out.length-1].base||out[out.length-1].id] : prevCat;
    let i = pool.findIndex(t=>CATEGORY[t.base||t.id]!==last); if(i<0) i=0;
    out.push(pool.splice(i,1)[0]);
  }
  return out;
}
/* Round 1 is the shared daily topic. Bonus rounds deal from a crew-and-day shuffle of the rest,
   so every phone derives the same topic for "round 3 today" with no coordination and no repeats in a day. */
function roundDeck(g, day){
  const daily = topicForDay(day), dailyBase = daily.base || daily.id;
  let rest = shuffled(TOPICS.filter(t=>t.id!==dailyBase && (t.from||1)<=day), hash(g+":"+day)).map(t=>onDay(t, day));
  if(day>=REVISE_FROM) rest = spreadOut(rest, CATEGORY[dailyBase]);
  return rest;
}
function topicForRound(g, day, n){
  if(n<=1) return topicForDay(day);
  const rest = roundDeck(g, day);
  return rest[(n-2)%rest.length];
}
/* "New topic" in a bonus round's lobby deals from the BACK of the same deck (rounds deal from the front),
   skipping topics already dealt today and every topic this round has shown (seen = topic ids, oldest first),
   so a swap rarely collides with a later round. */
function swapTopic(g, day, n, seen){
  const rest = roundDeck(g, day), used = new Set(seen);
  for(let k=2;k<=n;k++) used.add(topicForRound(g, day, k).id);
  const fresh = rest.slice().reverse().filter(t=>!used.has(t.id));
  return fresh[0] || rest.find(t=>t.id!==seen[seen.length-1]) || rest[0];
}

/* ---------------- scoring ---------------- */
const WRITE_IN = 15;
function basePts(rank){ return rank ? 100-(rank-1)*3 : WRITE_IN; }
function tierOf(rank){ return !rank ? 4 : rank<=4 ? 1 : rank<=10 ? 2 : 3; }
const TIER_EMO = {1:"\u{1F7E9}",2:"\u{1F7E8}",3:"\u{1F7E7}",4:"⬜"};
const TIER_TXT = {1:"Consensus top 4",2:"Top 10",3:"On the board",4:"Write-in"};
const SPOTS = ["Washington spot","Jefferson spot","Roosevelt spot","Lincoln spot"];
function scoreFaces(faces){
  // faces: 4 picks in the player's chosen order (slot 0 = #1)
  const eff = f => f.rank || 999;
  const ideal = faces.map((f,i)=>({f,i})).sort((a,b)=>eff(a.f)-eff(b.f)||a.i-b.i).map(x=>x.f);
  const rows = faces.map((f,slot)=>{
    const base = basePts(f.rank);
    const right = f.rank && ideal[slot]===f ? 10 : 0;
    const exact = f.rank===slot+1 ? 15 : 0;
    return {f, slot, base, right, exact, pts:base+right+exact};
  });
  return {rows, total: rows.reduce((s,r)=>s+r.pts,0)};
}

if (typeof module !== "undefined") module.exports = {TOPICS, ALL_TOPICS, TOPIC, key, matchEntry, dayNumber, topicForDay, topicForRound, swapTopic, scoreFaces, basePts, tierOf};
