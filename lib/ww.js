const request = require("request");
const crypto = require("crypto");

// These global variables get set on the initial auth token call. They won't
// change during the lifetime of the program.
var _id = "";
var _secret = "";

// Send a message to a WW space.
module.exports.sendMessage = function (msg, color, url, space, token) {
  console.log("Entered ww.sendMessage.");
  // Check for token expiration
  now = new Date();
  // If we are within 10 seconds of having our token expire, go ahead and grab a
  // new one.
  if (now.getTime() > token.expires.getTime() - 10000) {
    module.exports.getToken(url, _id, _secret, function (err, res) {
      if (err) {
        console.log("Unable to renew token. App will no longer post to the space.");
      } else {
        token = res;
        console.log("Renewed token which now expires at " + token.expires.toString());
        module.exports.sendMessage(msg, color, url, space, token);
      }
    });
  } else {

    const appMessage = {
      "type": "appMessage",
      "version": "1",
      "annotations": [{
        "type": "generic",
        "version": "1",
        "title": "",
        "text": "",
        "color": color,
      }]
    };

    const sendMessageOptions = {
      "url": url + "/v1/spaces/" + space + "/messages",
      "headers": {
        "Content-Type": "application/json",
        "jwt": token.value
      },
      "method": "POST",
      "body": ""
    };

    appMessage.annotations[0].text = msg;
    sendMessageOptions.body = JSON.stringify(appMessage);

    request(sendMessageOptions, function(err, res, sendMessageBody) {
      if (err) {
        console.log("Could not send message to WW space because:" + err);
        console.log("The status code from WW was " + res.status_code);
      } else {
        console.log("Successfully sent message to WW space.");
      }
    });
  }
};

// Make a call to the WW GraphQL API endpoint.
module.exports.makeGraphQLCall = function (body, token, url, callback) {
  console.log("Entered ww.makeGraphQLCall.");
  const sendMessageOptions = {
    "url": url + "/graphql",
    "headers": {
      "Content-Type": "application/graphql",
      "x-graphql-view": "PUBLIC",
      "jwt": token.value},
    "method": "POST",
    "body": body
  };
  request(sendMessageOptions, function(err, res, body) {
    if (err) {
      console.log("Could not make GraphQL request.");
      callback(err, null);
    } else {
      console.log("GraphQL request succeededi.");
      callback(null, JSON.parse(body));
    }
  });
};

// Respond to a verification request for a WW webhook.
module.exports.verifyWorkspace = function (response, challenge, secret) {
  console.log("Entered ww.verifyWorkspace.");
  // Create the object that is going to be sent back to Workspace for
  // verification.
  var bodyChallenge = {
    "response": challenge // This is what we end up hashing
  };

  var responseBodyString = JSON.stringify(bodyChallenge);

  var tokenForVerification = crypto
    // Use the webhook secret as hash key
    .createHmac("sha256", secret)
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
};

// Obtain a token for posting to a WW space.
module.exports.getToken = function (url, id, secret, callback) {
  console.log("Entered ww.getToken");
  _id = id;
  _secret = secret;
  request({
      url: url + "/oauth/token",
      method: 'POST',
      auth: {
        user: id,
        pass: secret
      },
      form: {
        'grant_type': 'client_credentials'
      }
  }, function(err, res) {
    if (err) {
      callback(err, null);
    } else {
      var token = {};
      token.value =  JSON.parse(res.req.res.body).access_token;
      expires = JSON.parse(res.req.res.body).expires_in;
      // expiration is set to "now"
      var expiration = new Date();
      // extract epoch time in milliseconds
      var timeobj = expiration.getTime();
      // add the token expiration time in milliseconds to it
      timeobj += (expires * 1000);
      // Finally, update expiration to reflect actual token expiration
      expiration.setTime(timeobj);
      token.expires = expiration;
      console.log("Obtained initial token that expires at " + token.expires.toString());
      callback(null, token);
    }
  });
}
