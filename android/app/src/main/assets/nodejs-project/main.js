// This is the entry point for the nodejs-mobile engine
// It simply redirects to our main server logic
const path = require("path");

// When nodejs-mobile starts, it copies the assets/nodejs-project folder to a writable location
// We can now require our server.js
require("./server.js");
