// Firebase predeploy step: the server function scores leaderboard posts with the same game.js the page uses.
const fs = require("fs"), path = require("path");
fs.copyFileSync(path.join(__dirname, "game.js"), path.join(__dirname, "functions", "game.js"));
