//This is what is going to be used to sent out for processing//
var apiai = require("apiai");
var request = require("request");
var app = apiai(process.env.API_AI);


module.exports = {

  talkBack: function talkBack(text, userName, token) {

    var firstName = userName.split(" ")[0];
    var firstL = firstName.substr(0, 1).toUpperCase();
    var rest = firstName.substr(1).toLowerCase();
    var name = firstL + rest;

    //////Sending our text to be processed
    var apiai = app.textRequest(text, {
      sessionId: "Luke"
    });
    //Response from process
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
        "url": "https://api.watsonwork.ibm.com/v1/spaces/58debcace4b090f924bac8ea/messages",
        "headers": {
          "Content-Type": "application/json",
          "jwt": JSON.parse(token.req.res.body)["access_token"]
        },
        "method": "POST",
        "body": ""
      };
   
      //console.log("Response results: " + JSON.stringify(response.result));
      appMessage.annotations[0].text = response.result.fulfillment.speech;
      sendMessageOptions.body = JSON.stringify(appMessage);
      
      
      request(sendMessageOptions, function(err, response, sendMessageBody) {
        if (err || response.statusCode !== 201) {
          console.log("ERROR: Posting to " + sendMessageOptions.url + "resulted on http status code: " + response.statusCode + " and error " + err);
        }
      });

    }); /////End of apiai response request for basic talk back
    apiai.on('error', (error) => {
      console.log(error);
    });
    apiai.end();
  },
};
