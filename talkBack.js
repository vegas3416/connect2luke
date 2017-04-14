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
const request = require("request");
var ww = require("./lib/ww");
var app = apiai(process.env.API_AI);


module.exports.talkback = function (text, userName, token, url, space) {
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
      msg = response.result.fulfillment.speech;
      ww.sendMessage(msg, 'blue', url, space, token);
    });

    apiai.on('error', (error) => {
      console.log(error);
    });
    apiai.end();
  },
};
