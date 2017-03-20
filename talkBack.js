//This is what is going to be used to sent out for processing//
var apiai = require("apiai");
var request = require("request");
var app = apiai(process.env.CLIENT_ACCESS_TOKEN);


module.exports = {
    
  talkBack: function talkBack(text, userName, token) {
      
      var firstName = userName.split(" ")[0];
      var firstL = firstName.substr(0,1).toUpperCase();
      var rest = firstName.substr(1).toLowerCase();
      var name = firstL + rest;
   
      //////getting our response setup
      let apiai = app.textRequest(text, {
        sessionId: "Luke"
      });
      
      //got response back to use
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
                "url": "https://api.watsonwork.ibm.com/v1/spaces/58c4c152e4b0a3f2c30975e5/messages",
                "headers": {
                    "Content-Type": "application/json",
                    "jwt": JSON.parse(token.req.res.body)["access_token"]
                },
                "method": "POST",
                "body": ""
            };

            //appMessage.annotations[0].title = "Luke";
            //talkBack function -- going to try to implement this
            appMessage.annotations[0].text = name + " " + response.result.fulfillment.speech ;
            sendMessageOptions.body = JSON.stringify(appMessage);    

    //console.log("Testing to make sure token is still here: " + JSON.parse(token.req.res.body)["access_token"]);

    request(sendMessageOptions, function(err, response, sendMessageBody) {

              if (err || response.statusCode !== 201) {
                  console.log("ERROR: Posting to " + sendMessageOptions.url + "resulted on http status code: " + response.statusCode + " and error " + err);
              }

    }); 
    
      
      });  /////End of apiai resposne request
      
      apiai.on('error', (error) => {
        console.log(error);
      });
      
      apiai.end();
    
  },
};
