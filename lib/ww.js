const request = require("request");
const crypto = require("crypto");

module.exports.sendMessage = function (msg, color, url, space, token) {
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

  request(sendMessageOptions, function(err, response, sendMessageBody) {
    if (err || response.statusCode !== 201) {
      console.log("ERROR: Posting to " +
          sendMessageOptions.url +
          "resulted on http status code: " +
          response.statusCode +
          " and error " +
          err);
    }
  });
};

module.exports.makeGraphQLCall = function (body, token, url, callback) {
  console.log("Entered makeGraphQLCall");
  console.log("Provided body is " + body);
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
      callback(err, null);
    } else {
      console.log("GraphQL request succeeded with " + body);
      callback(null, JSON.parse(body));
    }
  });
};

///////////////////////////////////////////////////////////////////////////////
//                                                                           //
// Verification function                                                     //
//                                                                           //
///////////////////////////////////////////////////////////////////////////////
module.exports.verifyWorkspace = function (response, challenge, secret) {

  // Create the object that is going to be sent back to Workspace for
  // verification.
  var bodyChallenge = {
    // This is what we end up hashing
    "response": challenge
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

///////////////////////////////////////////////////////////////////////////////
//                                                                           //
// Obtain a token for oAuth                                                  //
//                                                                           //
///////////////////////////////////////////////////////////////////////////////
module.exports.getToken = function (url, id, secret, callback) {
  request({
      url: url,
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
    }
    callback(null, res);
  });
};
