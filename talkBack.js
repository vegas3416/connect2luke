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
        
         console.log("I got a response back: ");
      });
      
      apiai.on('error', (error) => {
        console.log(error);
      });
      
      apiai.end();
      
      //////
      if(text === "hi"){
        
        
        //the return needs to be the output from the stuff you need
          return "Hi " + name;
      }
     return "I'm reading from my talkBack function you did say hi";
  },

};
