var request = require("request");
const ZENDESK_URL = "https://ibmworkspace.zendesk.com/api/v2/search.json?query=";

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
    if(message.indexOf('ibm') > -1) {
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
    "url": WWS_URL + "/v1/spaces/" + SPACE_ID + "/messages",
    "headers": {
      "Content-Type": "application/json",
      "jwt": JSON.parse(token.req.res.body)["access_token"]
    },
    "method": "POST",
    "body": ""
  };

  appMessage.annotations[0].text = msg;
  sendMessageOptions.body = JSON.stringify(appMessage);

  request(sendMessageOptions, function(err, response) {
    if (err || response.statusCode !== 201) {
      console.log("ERROR: Posting to " +
          sendMessageOptions.url +
          " resulted in http status code: " +
          response.statusCode +
          " and error " + err);
    }
  });
}


module.exports = {
  zendesk: function zendeskOpen(body, res, sender) {
    var type = '';
    var pick = '';
    var msg = ' ';
    var search = body.result.parameters;
    var errorMessage = body.result.fulfillment.speech;

    console.log("Parameters are: " + search);

    if (search.open && !search.number-integer) {
      console.log('Request was for open tickets with no ID specified.');
      type = 'type:ticket status:open';
      pick = 'open';
    }
    else if (search.id && search.number-integer) {
      console.log("Received request for ticket matching ID: " + search.number-integer);
      type = search.number-integer;
      pick = 'id';
    }
    else if (search.keyword) {
      console.log("Got request for tickets matching this description: " + search.description);
      type = '"' + search.description + '"';
      pick = 'key';
    }
    else if (search.description && search.my) {
      console.log("Received request for 'my' (read: " + sender + "'s) tickets");
      type = '"' + sender + '"';
      pick = 'user';
    }

    var options = {
      url: ZENDESK_URL + type,
      'auth': {
        'user': process.env.Z_USER,
        'pass': process.env.Z_TOKEN,
        'Accept': "application/json"
      }
    };

    function callback(error, response, body) {
      if (error && response.statusCode != 200) {
        console.log("Show yourself");
        console.log(error);
      }
      else if (!error) {
        var json = JSON.parse(body);
      }
      switch (pick) {
        case 'open':
          for (var x = 0; x < json.results.length; x++) {
            msg += "*ID: " + json.results[x].id + "* - " + json.results[x].subject + ' \n';
          }
          break;
        case 'id':
          if (json.count == 0) {
            msg = "I'm sorry but that Id is invalid, may have been recently deleted, or aliens abducted it";
          }
          else {
            msg = "*ID: " + json.results[0].id + "* \n*Description:* " + json.results[0].description + "\n*Status:* " +
            json.results[0].status + "\n*URL: *" + "https://ibmworkspace.zendesk.com/agent/tickets/" + json.results[0].id + "\n";
          }
          break;
        case 'key':
          for (var x = 0; x < json.results.length; x++) {
            if (json.results[x].subject) {
              msg += "*ID: " + json.results[x].id + "*\n*Subject: *" + json.results[x].subject;
            }
          }
          break;
        case 'user':
          for (var x = 0; x < json.results.length; x++) {
            if (json.results[x].subject) {
              msg += "*ID: *" +
                json.results[x].id +
                "\n*Status: *" +
                json.results[x].status +
                "\n*Subject: *" +
                json.results[x].subject +
                "\n*URL: *" +
                "https://ibmworkspace.zendesk.com/agent/tickets/" +
                json.results[x].id +
                "\n";
            }
          }
          break;
        case 'solved':
          break;
        case 'email':
          break;
        default:
          msg = errorMessage;
      }
      return res.json({
        speech: msg,
        displayText: msg,
        source: "Zendesk"
      });
    }
  request(options, callback);
  }
};
