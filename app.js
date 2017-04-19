const express = require("express");
const request = require("request");
const bodyParser = require("body-parser");
const fs = require("fs");
const http = require("http");
const https = require("https");

var talk = require("./talkBack");
var zendesk = require("./zendesk");
var ww = require("./lib/ww");

const WWS_OAUTH_URL = "https://api.watsonwork.ibm.com/oauth/token";
const SPACE_ID = "58f14f69e4b0418710518e55";
const WWS_URL = "https://api.watsonwork.ibm.com";
const AUTHORIZATION_API = "/oauth/token";
const WEBHOOK_VERIFICATION_TOKEN_HEADER = "X-OUTBOUND-TOKEN".toLowerCase();

var APP_ID = process.env.APP_ID;
var APP_SECRET = process.env.APP_SECRET;
var WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
var PORT = process.env.PORT;
var BLUEMIX = process.env.BLUEMIX;


// Global variables
var app = express(); // Request handler
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
if (!BLUEMIX) {
  // The cert *must* be the full chain cert to make Zendesk happy.
  var privateKey = fs.readFileSync("privkey.pem");
  var certificate = fs.readFileSync("fullchain.pem");
}
var user_db = {}; // Maps Zendesk user ID to names
var token = {}; // Auth token for WW


// This is just a way to confirm Luke is online.
app.get("/", function(req, res) {
  console.log("Received GET to /");
  res.send("Luke is alive!");
});

// This is our handler for WW callbacks.
app.post("/webhook", function(req, res) {
  console.log("Received POST to /webhook");
  var body = req.body;
  var eventType = body.type;

  // Verification event
  if (eventType === "verification") {
    console.log("Verifying...");
    ww.verifyWorkspace(res, body.challenge, WEBHOOK_SECRET);
    return;
  }

  res.status(200).end();

  // Message created event
  if (eventType === "message-created") {
    // Ignore our own messages
    if (body.userId === APP_ID) {
      return;
    }
    var text = body.content.toLowerCase();
    // Handle if we were mentioned
    if (text.includes('luke')) {
      console.log("We were mentioned in a message");
      talk.talkback(body, token, WWS_URL, SPACE_ID, user_db);
    }
  }

});

// This handles callbacks from Zendesk.
app.post('/api', function(req, res) {
  console.log("Received POST to /api");
  var body = req.body;

  if(body.zen){
      console.log("Got a callback from Zendesk");
      zendesk.handleTrigger(body, res, WWS_URL, SPACE_ID, token);
  }
});

///////////////////////////////////////////////////////////////////////////////
//                                                                           //
// Start the webserver                                                       //
//                                                                           //
// The presence of the 'BLUEMIX' env variable determines whether we start a  //
// SSL capable webserver or just listen on PORT with regular HTTP.           //
//                                                                           //
// The user_db is a simple mapping of userid to display name. That allows us //
// to translate ticket assignees to actual names without making an extra     //
// Zendesk API call.                                                         //
//                                                                           //
///////////////////////////////////////////////////////////////////////////////
if (BLUEMIX) {
  http.createServer(app).listen(PORT, function (err, res) {
    console.log("Insecure server started on port " + PORT);
    var query = "users.json";
    zendesk.callZendesk(query, function (err, res) {
      if (err) {
        console.log("Failed to retrieve users from Zendesk");
      } else {
        for (var i = 0; i < res.users.length; i++) {
          user_db[res.users[i].id] = res.users[i].name;
        }
        console.log("User database has been created.");
      }
    });
  });
} else {
  https.createServer({
    key: privateKey,
    cert: certificate
  }, app).listen(PORT, function (err, res) {
    console.log("Secure server started on port " + PORT);
    var query = "users.json";
    zendesk.callZendesk(query, function (err, res) {
      if (err) {
        console.log("Failed to retrieve users from Zendesk");
      } else {
        for (var i = 0; i < res.users.length; i++) {
          user_db[res.users[i].id] = res.users[i].name;
        }
        console.log("User database has been created.");
      }
    });
  });
}

// Grab our initial WW auth token. They're good for roughly 12 hours.
ww.getToken(WWS_URL, APP_ID, APP_SECRET, function (err, res) {
  if (err) {
    console.log("Failed to obtain initial token");
    console.log(err);
  } else {
    token = res;
  }
});
