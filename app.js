var express = require("express");
var app = express();
var request = require("request");
var crypto = require("crypto");
/*const apiai = require("apiai");
const ai = apiai(process.env.CLIENT_ACCESS_TOKEN);*/

var talk = require("./talkBack");
///


var APP_ID = process.env.APP_ID;
var APP_SECRET = process.env.APP_SECRET;
var WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

console.log(APP_ID);

const WWS_URL = "https://api.watsonwork.ibm.com";
const AUTHORIZATION_API = "/oauth/token";
var WEBHOOK_VERIFICATION_TOKEN_HEADER = "X-OUTBOUND-TOKEN".toLowerCase();
const WWS_OAUTH_URL = "https://api.watsonwork.ibm.com/oauth/token";


/*var APP_ID = "64cf20e3-aa5d-4fb8-85d2-c0ffb42f0509";
var APP_SECRET = "4vced0sp4j01lghq8f3eoim8jzt3z0ls";
var WEBHOOK_SECRET = "4w5t7po3b9yalemdujab9lhlg5zy13mh";*/


//probably dont need th ejs stuff
// app.set("view engine", "ejs");

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

///Event type message-created  start
  if (eventType === "message-created") {
    
    var Luke = talk.talkBack(body["content"], body.userName);
    
    res.status(200).end();

    if (body.userId === APP_ID) {
      console.log("INFO: Skipping our own message Body: " + JSON.stringify(body));
      return;
    }

    // TODO
    // console.log(JSON.parse(token.req.res.body)["access_token"]);
    // JSON.parse((token.req.res.body).access_token)
    // DONT DELETE ANYTHING BETWEEN HERE!!!!

    ///////////////
           const appMessage = {
                "type": "appMessage",
                "version": "1",
                "annotations": [{
                    "type": "generic",
                    "version": "1",

                    "title": "",
                    "text": "",
                    "color": "blue",
                }]
            };

            const sendMessageOptions = {
                "url": "https://api.watsonwork.ibm.com/v1/spaces/58c4c152e4b0a3f2c30975e5/messages",
                "headers": {
                    "Content-Type": "application/json",
                    "jwt": JSON.parse(token.req.res.body)["access_token"]
                },
                "method": "POST",
                "body": ""
            };

            //appMessage.annotations[0].title = "Luke";
            //talkBack function -- going to try to implement this
            appMessage.annotations[0].text = Luke ;
            sendMessageOptions.body = JSON.stringify(appMessage);    

    //console.log("Testing to make sure token is still here: " + JSON.parse(token.req.res.body)["access_token"]);

    request(sendMessageOptions, function(err, response, sendMessageBody) {

              if (err || response.statusCode !== 201) {
                  console.log("ERROR: Posting to " + sendMessageOptions.url + "resulted on http status code: " + response.statusCode + " and error " + err);
              }

    }); 

  } //closing bracking for IF statement 'message-created'

}); /////END OF app.post 


///Listener
app.listen(process.env.PORT, process.env.IP, function() {
  console.log("Started App");
});

////////Where my functions start for everything. May need to separate to different files///

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
