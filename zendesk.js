var request = require("request");
var ww = require("./lib/ww");

const ZENDESK_URL = "https://ibmworkspace.zendesk.com/api/v2/";

module.exports.handleTrigger = function (body, request, url, space, token) {
  console.log("Body from Zen POST: " + JSON.stringify(body));
  var msg = "";
  var color = "";
  // New ticket was created
  if (body.create) {
    msg = body.id +
          "\n" +
          body.title +
          "\n*URL: *" +
          body.url +
          "\n" +
          body.info;
    if(msg.indexOf('ibm') > -1) {
      color = 'green';
    }
    else {
      color = 'red';
    }
  }
  // Existing ticket was updated
  else if (body.update) {
    console.log("I got into update");
    msg = body.id +
          "\n" +
          body.title +
          "\n*Assigned To: *" +
          body.assigned +
          "\n*Latest request came from: *" +
          body.requester +
          "\n*URL: *" +
          body.url +
          "\n" +
          body.info;
    color = 'yellow';
  }

  console.log("\nZendesk trigger event became: " + msg);

  ww.sendMessage(msg, color, url, space, token);

};

module.exports.callZendesk = function (type, callback) {
  var options = {
    url: ZENDESK_URL + type,
    'auth': {
      'user': process.env.Z_USER,
      'pass': process.env.Z_TOKEN,
      'Accept': "application/json"
    }
  };
  console.log("Performing Zendesk API call with " + JSON.stringify(options));
  request(options, function (err, res, body) {
    if (err) {
      callback(err, null);
    } else {
      console.log("Zendesk API call succeeded, with result: " + body);
      callback(null, JSON.parse(body));
    }
  });
};
