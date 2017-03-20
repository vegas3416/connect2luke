//This is what is going to be used to sent out for processing//
var apiai = require("apiai");
var app = apiai(process.env.CLIENT_ACCESS_TOKEN);

module.exports = {
    
  talkBack: function talkBack(text, userName) {
      
      console.log("App id: " + app);
      var name = userName.split(" ")[0];
      
      //////getting our response setup
      var myResponse = app.textRequest(text, {
        sessionId: "Luke"
      });
      
      myResponse.on('response', function (response) {
        
         console.log("I got a response back: " + response.result.fulfillment.speech);
      });
      
      myResponse.on('error', function (error) {
        console.log(error);
      });
      
      myResponse.end();
      
      //////
      if(text === "hi"){
        
        
        //the return needs to be the output from the stuff you need
          return "Hi " + name;
      }
     return "I'm reading from my talkBack function you did say hi";
  },

};
