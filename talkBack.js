///////////////////////////////////////////////////////////////////////////////
//                                                                           //
// For each message in the space mentioning the bot's name, we determine     //
// what the user is requesting. Based on that, we make the apropriate call   //
// to Zendesk for the info. We then format that info nicely, and spit it     //
// back into the space.                                                      //
//                                                                           //
///////////////////////////////////////////////////////////////////////////////
const request = require("request");
var zendesk = require("./zendesk");
var ww = require("./lib/ww");


module.exports.talkback = function (data, token, url, space) {
  console.log("Entered talkBack.talkback");
  console.log("Provided data is " + data);
  var msg_id = data.messageId;
  var body = "{ message (id: \"" + msg_id + "\")" +
    "{ createdBy { displayName id }" +
    " created content contentType annotations } }";
  ww.makeGraphQLCall(body, token, url, function (err, res) {
    if (err) {
      return;
    }

    // We don't do anything with the metadata we get back yet, but we have
    // an easy way to do more later if we wish.
    var data = res.data.message;
    var WKeywords = [];
    var annotation_length = data.annotations.length;
    var msg = "";

    for (var i = 0; i < annotation_length; i++) {
      var note = JSON.parse(data.annotations[i]);
      if (note.type === "message-nlp-keywords") {
        WKeywords = note.keywords;
      }
    }
    console.log("Alchemy keywords are: " + WKeywords.toString());
    // The message text is UTF-8, so we need to first decode it to be safe.
    var message = decode_utf8(data.content);
    var re = /[0-9]+/;
    if (message.match(re)) {
      var ID = message.match(re)[0];
      console.log("Extracted ticket number " + ID);
    }

    // "Luke, show me my tickets"
    // "Give me more information on ticket 56 Luke"
    // "What tickets are open right now Luke"
    if (ID && (message.search("details") || message.search("information"))) {
      var query = "search.json?query=" + ID;
      zendesk.callZendesk(query, function (err, res) {
        if (err) {
          console.log("Problem calling the Zendesk API");
          console.log(err);
          return;
        }
        console.log("Information about a specific ticket was requested");
        if (res.count === 0) {
          msg = "I'm sorry but either that ticket number is invalid," +
            " the ticket has recently been deleted, or " +
            "the ticket has been abducted by aliens.";
        }
        else {
          var id = res.results[0].id;
          var status = res.results[0].status;
          var description = res.results[0].description;
          // Make another call to grab the comments
          var query = "tickets/" + ID + "/comments.json";
          zendesk.callZendesk(query, function (err, res) {
            comment = "";
            if (!err) {
              if (res.comments) {
                comment = res.comments[0].value;
              }
            }

            msg = "[*ID: " + id + "*](" +
              "https://ibmworkspace.zendesk.com/agent/tickets/" +
              id + ") (_" + status +
              "\n*Description:* " +
              description + "\n";
            if (comment) {
              msg += "*Last update:* " + comment;
            }
            ww.sendMessage(msg, '#016F4A', url, space, token);
          });
        }
      });
    } else if (message.search("my") && message.search("tickets")) {
      console.log("A user requested their tickets");
      // Who asked?
      var sender = data.createdBy.displayName;
      console.log("Looks like " + sender + " was the requesting party");
      var query = "search.json?query=" + '"' + sender + '"';
      zendesk.callZendesk(query, function (err, res) {
        if (err) {
          console.log("Problem calling the Zendesk API");
          console.log(err);
          return;
        }
        for (var x = 1; x < res.results.length; x++) {
          var status = res.results[x].status;
          if (status !== "closed" && status !== "solved") {
            msg += "*[Ticket " + res.results[x].id + "*] " +
              "[" + res.results[x].subject + "](" +
              "https://ibmworkspace.zendesk.com/agent/tickets/" +
              res.results[x].id + ") (_" + res.results[x].status +
              "_)\n";
          }
        }
        ww.sendMessage(msg, '#016F4A', url, space, token);
      });
    } else if (message.search("open") && message.search("tickets")) {
      var query = "search.json?query=type:ticket status:open";
      zendesk.callZendesk(query, function (err, res) {
        if (err) {
          console.log("Problem calling the Zendesk API");
          console.log(err);
          return;
        }
        for (var x = 0; x < res.results.length; x++) {
          msg += "*ID: " +
            res.results[x].id +
            "* - " +
            res.results[x].subject +
            ' \n';
        }
        ww.sendMessage(msg, '#016F4A', url, space, token);
      });
    } else {
      msg = help();
      ww.sendMessage(msg, '#016F4A', url, space, token);
    }
  });
}

function decode_utf8(s) {
  return unescape(encodeURIComponent(s));
}

function contains(array, obj) {
  for (var i = 0; i < array.length; i++) {
    if (array[i] === obj) {
      return true;
    }
  }
  return false;
}

function help() {
  return "You can ask me for open tickets, your tickets, or details about " +
    "an existing ticket if you know the ID number.";
}
