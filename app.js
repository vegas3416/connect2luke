var express = require("express");
var app = express();
var request = require("request");
var crypto = require("crypto");
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

//Different from production
var WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;


const WWS_URL = "https://api.watsonwork.ibm.com";
const AUTHORIZATION_API = "/oauth/token";
var WEBHOOK_VERIFICATION_TOKEN_HEADER = "X-OUTBOUND-TOKEN".toLowerCase();
const WWS_OAUTH_URL = "https://api.watsonwork.ibm.com/oauth/token";

////////////////////
//Code taken from another to read in the Json object of the body
/*function rawBody(req, res, next) {
  var buffers = [];
  req.on("data", function(chunk) {
    buffers.push(chunk);
  });
  req.on("end", function() {
    req.rawBody = Buffer.concat(buffers);
    next();
  });
  console.log("I think I'm here");
}
app.use(rawBody);*/
////////////////////
app.get("/", function(req, res) {
  res.send("Luke is alive!");
});
////////////////////
app.post("/webhook", function(req, res) {

  //var body = JSON.parse(req.rawBody.toString());
  var body = req.body;
  var eventType = body.type;
  var zen = body.Title;
  
  ///Testing Zendesk
  if(zen === "Title")
  {
    console.log("Got something from zendesk");
  }
 
  //////verification event
  if (eventType === "verification") {
    //console.log("Got here: " + body.challenge);
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
      //console.log("INFO: Skipping our own message Body: " + JSON.stringify(body));
      return;
    }
    
    
    else if (message.indexOf('luke') > -1) {
      console.log("Got in here");
      talk.talkBack(body["content"], body.userName, token);
    }
    //NOT FULLY IMPLEMENTED TO DO ANYTHING AT THE MOMENT
    else if(message.indexOf('!graphit') > -1){
      console.log("yep");
      graph.graphit(body,res);
    }

  } //closing bracking for IF statement 'message-created'

}); /////END OF app.post 

////////////////////Trying OUT this weather API here
/////  http://www.girliemac.com/blog/2017/01/06/facebook-apiai-bot-nodejs/
app.post('/api', function(req, res) {
  
  var body = req.body;
  console.log("In api post");
  if (body.result.action === 'weather' || body.result.action === 'forecast'){
      weather.weather(body,res);
  }
  else if(body.result.action === 'google'){
      lookUp.lookUp(body,res);  
  }
  else if(body.result.action === 'zendesk'){
      console.log("See Zendesk as my action");
      zendesk.zendesk(body,res);
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