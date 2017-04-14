var request = require("request");
const ZENDESK_URL = "https://ibmworkspace.zendesk.com/api/v2/search.json?query=";

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
