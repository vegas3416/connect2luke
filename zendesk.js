var request = require("request");
var ww = require("./lib/ww");

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

  ww.sendMessage(msg, color, url, space, token);

}


module.exports.zendeskOpen = function (body, res, sender) {
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

    // Create our request to the Zendesk API
    var options = {
      url: ZENDESK_URL + type,
      'auth': {
        'user': process.env.Z_USER,
        'pass': process.env.Z_TOKEN,
        'Accept': "application/json"
      }
    };

    request(options, function (err, res, body) {
      if (err && res.statusCode != 200) {
        console.log("Problem calling the Zendesk API:");
        console.log(err);
        return;
      }

      var data = JSON.parse(body);
      switch (pick) {
        case 'open':
          for (var x = 0; x < data.results.length; x++) {
            msg += "*ID: " +
              data.results[x].id +
              "* - " +
              data.results[x].subject +
              ' \n';
          }
          break;
        case 'id':
          if (data.count == 0) {
            msg = "I'm sorry but that ID is either invalid," +
              " recently deleted, or abducted by aliens.";
          }
          else {
            msg = "*ID: " +
              data.results[0].id +
              "* \n*Description:* " +
              data.results[0].description +
              "\n*Status:* " +
              data.results[0].status +
              "\n*URL: *" +
              "https://ibmworkspace.zendesk.com/agent/tickets/" +
              data.results[0].id +
              "\n";
          }
          break;
        case 'key':
          for (var x = 0; x < data.results.length; x++) {
            if (data.results[x].subject) {
              msg += "*ID: " +
                data.results[x].id +
                "*\n*Subject: *" +
                data.results[x].subject;
            }
          }
          break;
        case 'user':
          for (var x = 0; x < data.results.length; x++) {
            if (data.results[x].subject) {
              msg += "*ID: *" +
                data.results[x].id +
                "\n*Status: *" +
                data.results[x].status +
                "\n*Subject: *" +
                data.results[x].subject +
                "\n*URL: *" +
                "https://ibmworkspace.zendesk.com/agent/tickets/" +
                data.results[x].id +
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
      res.json({
        speech: msg,
        displayText: msg,
        source: "Zendesk"
      });
    }
  }
};
