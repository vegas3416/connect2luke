var request = require("request");
var ww = require("./lib/ww");

const ZENDESK_URL = "https://ibmworkspace.zendesk.com/api/v2/";

module.exports.handleTrigger = function (body, res, url, space, token) {
  console.log("Entered zendesk.handleTrigger");
  res.status(200).end();
  var msg = "";
  var color = "";
  // New ticket was created
  if (body.create) {
    console.log("Zendesk notified us of a newly created ticket");
    msg = body.id + "\n" + body.title + "\n*URL: *" + body.url +
          "\n" + body.info;
    // This needs to be refactored to check against a list of target email
    // domains. This will give us better visibility of tickets from important
    // companies.
    if(msg.includes("ibm")) {
      color = 'green';
    }
    else {
      color = 'red';
    }
  }
  // Existing ticket was updated
  else if (body.update) {
    console.log("Zendesk notified us of an updated ticket");
    msg = body.id + "\n" + body.title + "\n*Assigned To: *" + body.assigned +
          "\n*Latest request came from: *" + body.requester + "\n*URL: *" +
          body.url + "\n" + body.info;
    // Probably ought to include a similar check to what we have for new tickets
    // - checking against certain email domains.
    color = 'yellow';
  } else {
    console.log("Unexpected callback from Zendesk");
    console.log("Body from Zendesk was: " + JSON.stringify(body));
    return;
  }

  ww.sendMessage(msg, color, url, space, token);

};

module.exports.callZendesk = function (type, callback) {
  console.log("Entered zendesk.callZendesk.");
  var options = {
    url: ZENDESK_URL + type,
    'auth': {
      'user': process.env.Z_USER,
      'pass': process.env.Z_TOKEN,
      'Accept': "application/json"
    }
  };
  console.log("Performing Zendesk API call of type: " + type);
  request(options, function (err, res, body) {
    if (err) {
      console.log("Zendesk API call failed.");
      callback(err, null);
    } else {
      console.log("Zendesk API call succeeded.");
      callback(null, JSON.parse(body));
    }
  });
};
