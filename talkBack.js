///////////////////////////////////////////////////////////////////////////////
//                                                                           //
// We send each message from the space to Api.ai for processing.             //
// Based on the result of that processing, Api.ai makes the required         //
// callback to our app - zendesk, weather etc. That callback result is then  //
// processed by Api.ai and Api.ai sends us a formatted message to return to  //
// the space we are in, along with some meta-data about the result.          //
//                                                                           //
///////////////////////////////////////////////////////////////////////////////
var apiai = require("apiai");
var request = require("request");
var app = apiai(process.env.API_AI);


module.exports = {

  talkBack: function talkBack(text, userName, token, url, space) {
    var firstName = userName.split(" ")[0];
    var firstL = firstName.substr(0, 1).toUpperCase();
    var rest = firstName.substr(1).toLowerCase();
    var name = firstL + rest;

    // Send our text to be processed
    var apiai = app.textRequest(text, {
      sessionId: "Luke"
    });

    // Response from process
    apiai.on('response', (response) => {
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
        "url": url + "/v1/spaces/" + space + "/messages",
        "headers": {
          "Content-Type": "application/json",
          "jwt": JSON.parse(token.req.res.body).access_token
        },
        "method": "POST",
        "body": ""
      };

      appMessage.annotations[0].text = response.result.fulfillment.speech;
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

    });

    apiai.on('error', (error) => {
      console.log(error);
    });
    apiai.end();
  },
};
