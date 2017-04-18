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
var app = express();
var sender = "";
if (!BLUEMIX) {
  var privateKey = fs.readFileSync("key.pem");
  var certificate = fs.readFileSync("cert.pem");
}
var user_db = {};
var token = {};
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));



app.get("/", function(req, res) {
  console.log("Received GET to /");
  res.send("Luke is alive!");
});

app.post("/webhook", function(req, res) {
  console.log("Received POST to /webhook");
  var body = req.body;
  var eventType = body.type;
  var zen = body.zen;
  sender = body.userName;

  // Only for Zendesk trigger calls.
  if(zen)  {
    zendesk.handleTrigger(body, WWS_URL, SPACE_ID, token);
  }

  // Verification event
  if (eventType === "verification") {
    console.log("Verifying...");
    ww.verifyWorkspace(res, body.challenge, WEBHOOK_SECRET);
    return;
  }

  res.status(200).end();

  // Message created event
  if (eventType === "message-created") {
    var text = body.content.toLowerCase();

    // Ignore our own messages
    if (body.userId === APP_ID) {
      return;
    }
    // Handle if we were mentioned
    else if (text.indexOf('luke') > -1) {
      console.log("We were mentioned in a message");
      talk.talkback(body, token, WWS_URL, SPACE_ID, user_db);
    }
  }

});

///////////////////////////////////////////////////////////////////////////////
//                                                                           //
// This handles callbacks from Zendesk                                       //
//                                                                           //
///////////////////////////////////////////////////////////////////////////////
app.post('/api', function(req, res) {
  var body = req.body;
  console.log("In api post");

  if(body.result.action === 'zendesk'){
      console.log("Got a callback from Zendesk");
      zendesk.handleTrigger(body, res, WWS_URL, SPACE_ID, token);
  }
});

///////////////////////////////////////////////////////////////////////////////
//                                                                           //
// Start the webserver                                                       //
//                                                                           //
///////////////////////////////////////////////////////////////////////////////
if (BLUEMIX) {
  http.createServer(app).listen(PORT, function (err, res) {
    console.log("Bluemix server started on port " + PORT);
    var query = "users.json";
    zendesk.callZendesk(query, function (err, res) {
      if (err) {
        console.log("Failed to retrieve users from Zendesk");
      }
      for (var i = 0; i < res.users.length; i++) {
        user_db[res.users[i].id] = res.users[i].name;
      }
    });
  });
} else {
  https.createServer({
    key: privateKey,
    cert: certificate
  }, app).listen(PORT, function (err, res) {
    console.log("Server started on port " + PORT);
    var query = "users.json";
    zendesk.callZendesk(query, function (err, res) {
      if (err) {
        console.log("Failed to retrieve users from Zendesk");
      }
      for (var i = 0; i < res.users.length; i++) {
        user_db[res.users[i].id] = res.users[i].name;
      }
    });
  });
}

ww.getToken(WWS_URL + "/oauth/token", APP_ID, APP_SECRET, function (err, res) {
  if (err) {
    console.log("Failed to obtain initial token");
    console.log(err);
  } else {
    token.value =  JSON.parse(res.req.res.body).access_token;
    token.expires = JSON.parse(res.req.res.body).expires_at;
    console.log("Obtained initial token: " + JSON.stringify(token));
  }
});
