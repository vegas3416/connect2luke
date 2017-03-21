var express = require("express");
var app = express();
var request = require("request");
var crypto = require("crypto");

var talk = require("./talkBack");

var APP_ID = process.env.APP_ID;
var APP_SECRET = process.env.APP_SECRET;
var WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

console.log(APP_ID);

const WWS_URL = "https://api.watsonwork.ibm.com";
const AUTHORIZATION_API = "/oauth/token";
var WEBHOOK_VERIFICATION_TOKEN_HEADER = "X-OUTBOUND-TOKEN".toLowerCase();
const WWS_OAUTH_URL = "https://api.watsonwork.ibm.com/oauth/token";

////////////////////
//Code taken from another to read in the Json object of the body
function rawBody(req, res, next) {
  var buffers = [];
  req.on("data", function(chunk) {
    buffers.push(chunk);
  });
  req.on("end", function() {
    req.rawBody = Buffer.concat(buffers);
    next();
  });
}
app.use(rawBody);
////////////////////
app.get("/", function(req, res) {
  res.send("Luke is alive!");
});
////////////////////
app.post("/webhook", function(req, res) {

  //console.log("you tried me");
  var body = JSON.parse(req.rawBody.toString());
  //console.log(body);
  var eventType = body.type;
  //////verification event
  if (eventType === "verification") {
    //console.log("Got here");
    verifyWorkspace(res, body.challenge);
    return;
  }
  //////End of verification function//////

  res.status(200).end();
  ///Event type message-created  start
  if (eventType === "message-created") {

    var message = body["content"].toLowerCase();
    //kick out if message comes from Luke-bot
    if (body.userId === APP_ID) {
      console.log("INFO: Skipping our own message Body: " + JSON.stringify(body));
      return;
    }

    if (message.indexOf('luke') > -1) {

      talk.talkBack(body["content"], body.userName, token);

    }

  } //closing bracking for IF statement 'message-created'

}); /////END OF app.post 

////////////////////Trying OUT this weather API here
/////  http://www.girliemac.com/blog/2017/01/06/facebook-apiai-bot-nodejs/
app.post('/weather', (req, res) => {
  if (req.body.result.action === 'weather') {
    let city = req.body.result.parameters['geo-city'];
    let restUrl = 'http://api.openweathermap.org/data/2.5/weather?APPID='+ '39e2bf50b3cf596db0ef380231a7d22d' +'&q='+ city;

    request.get(restUrl, (err, response, body) => {
      if (!err && response.statusCode == 200) {
        let json = JSON.parse(body);
       json.weather[0].description + ' and the temperature is ' + json.main.temp + ' ℉';
        return res.json({
          speech: body.result.fulfillment.speech,
          displayText: body.result.fulfillment.speech,
          source: 'weather'});
      } else {
        return res.status(400).json({
          status: {
            code: 400,
            errorType: 'I failed to look up the city name.'}});
      }})
  }
});


//////////////////


///Listener
app.listen(process.env.PORT, process.env.IP, function() {
  console.log("Started App");
});

//Verification function
function verifyWorkspace(response, challenge) {

  //creating the object that is going to be used to send back to Workspace for verification
  var bodyChallenge = {
    //req.body.challenge is what is in the post request that I need to have for Workspace verification
    "response": challenge
  };

  var endPointSecret = WEBHOOK_SECRET;
  console.log("right after endpoint declaration");
  var responseBodyString = JSON.stringify(bodyChallenge);

  var tokenForVerification = crypto
    //has the webhook secrte
    .createHmac("sha256", endPointSecret)
    //update the responseBodyString and basically concatonating the webhook to end of it
    .update(responseBodyString)
    //converting that entire string to a hex value
    .digest("hex");
  console.log("before hash");
  //setting the header up with 200 response and the webhook hashed out
  response.writeHead(200, {
    "Content-Type": "application/json; charset=utf-8",
    "X-OUTBOUND-TOKEN": tokenForVerification
  });

  response.end(responseBodyString);
  console.log("All hashed up");
}
/////////////End of Verification function

//Assigning token for the oAuth token//
var token = request({

  url: 'https://api.watsonwork.ibm.com/oauth/token',
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
    console.log("Crap, not good!!", err);
  }
});
//////////////////End of oAuth piece after setting up token variable/////////////