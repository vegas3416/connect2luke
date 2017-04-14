const express = require("express");
var app = express();
const request = require("request");
const crypto = require("crypto");
var bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var talk = require("./talkBack");
var weather = require("./weather");
var lookUp = require("./google");
var graph = require("./graph");
var zendesk = require("./zendesk");

var APP_ID = process.env.APP_ID;
var APP_SECRET = process.env.APP_SECRET;

var WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
const SPACE_ID = "58c4c152e4b0a3f2c30975e5";


const WWS_URL = "https://api.watsonwork.ibm.com";
const AUTHORIZATION_API = "/oauth/token";
const WEBHOOK_VERIFICATION_TOKEN_HEADER = "X-OUTBOUND-TOKEN".toLowerCase();
const WWS_OAUTH_URL = "https://api.watsonwork.ibm.com/oauth/token";

// Global variable
var sender = "";

app.get("/", function(req, res) {
  res.send("Luke is alive!");
});

app.post("/webhook", function(req, res) {
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
    verifyWorkspace(res, body.challenge);
    return;
  }

  res.status(200).end();

  // Message created event
  if (eventType === "message-created") {
    var message = body["content"].toLowerCase();

    // Ignore our own messages
    if (body.userId === APP_ID) {
      return;
    }
    // Handle if we were mentioned
    else if (message.indexOf('luke') > -1) {
      console.log("We were mentioned in a message");
      talk.talkBack(body.content, body.userName, token, WWS_URL, SPACE_ID);
    }
    // To be implemented
    else if(message.indexOf('!graphit') > -1){
      console.log("Got shortcut 'graphit' in a message");
      graph.graphit(body,res);
    }

  }

});

///////////////////////////////////////////////////////////////////////////////
//                                                                           //
// This handles callbacks from API.ai.                                       //
//                                                                           //
// Trying out this weather API here:                                         //
// http://www.girliemac.com/blog/2017/01/06/facebook-apiai-bot-nodejs/       //
//                                                                           //
///////////////////////////////////////////////////////////////////////////////
app.post('/api', function(req, res) {
  var body = req.body;
  console.log("In api post");
  if (body.result.action === 'weather' || body.result.action === 'forecast'){
      console.log("Action: Weather");
      weather.weather(body,res);
  }
  else if(body.result.action === 'google'){
      console.log("Action: Google");
      lookUp.lookUp(body,res);
  }
  else if(body.result.action === 'zendesk'){
      console.log("Action: Zendesk");
      zendesk.zendesk(body,res, sender);
  }
});

///////////////////////////////////////////////////////////////////////////////
//                                                                           //
// Listener                                                                  //
//                                                                           //
///////////////////////////////////////////////////////////////////////////////
app.listen(process.env.PORT, process.env.IP, function() {
  console.log("Started App");
});

///////////////////////////////////////////////////////////////////////////////
//                                                                           //
// Verification function                                                     //
//                                                                           //
///////////////////////////////////////////////////////////////////////////////
function verifyWorkspace(response, challenge) {

  // Create the object that is going to be sent back to Workspace for
  // verification.
  var bodyChallenge = {
    // This is what we end up hashing
    "response": challenge
  };

  var endPointSecret = WEBHOOK_SECRET;
  var responseBodyString = JSON.stringify(bodyChallenge);

  var tokenForVerification = crypto
    // Use the webhook secret as hash key
    .createHmac("sha256", endPointSecret)
    // and hash the body ("response": challenge)
    .update(responseBodyString)
    // ending up with the hex formatted hash.
    .digest("hex");
  // Write our response headers
  response.writeHead(200, {
    "Content-Type": "application/json; charset=utf-8",
    "X-OUTBOUND-TOKEN": tokenForVerification
  });

  // Add our body and send it off.
  response.end(responseBodyString);
  console.log("Webhook was verified");
}

///////////////////////////////////////////////////////////////////////////////
//                                                                           //
// Obtain a token for oAuth                                                  //
//                                                                           //
///////////////////////////////////////////////////////////////////////////////
var token = request({
  url: WWS_URL + '/oauth/token',
  method: 'POST',
  auth: {
    user: APP_ID,
    pass: APP_SECRET
  },
  form: {
    'grant_type': 'client_credentials'
  }
}, function(err, res) {

  if (!err == 200) {
    console.log("Failed to obtain Oauth token", err);
  }
});
