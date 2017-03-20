//This is what is going to be used to sent out for processing//
var apiai = require("apiai");
var app = apiai(process.env.CLIENT_ACCESS_TOKEN);

module.exports = {
    
  talkBack: function talkBack(text, userName) {
      
      console.log("App id: " + app);
      var name = userName.split(" ")[0];
      
      //////getting our response setup
      let apiai = app.textRequest(text, {
        sessionId: "Luke"
      });
      
      apiai.on('response', (response) => {
        
         console.log(response.result.fulfillment.speech);
         return(name + " " + response.result.fulfillment.speech);
         
      });
      
      apiai.on('error', (error) => {
        console.log(error);
      });
      
      apiai.end();
    
  },

};
