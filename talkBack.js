//This is what is going to be used to sent out for processing//
const apiai = require("apiai");
const app = apiai(process.env.CLIENT_ACCESS_TOKEN);

module.exports = {
    
  talkBack: function talkBack(text, userName) {
      
      var name = userName.split(" ")[0];
      
      //////getting our response setup
      let myResponse = app.textRequest(text, {
        sessionId: "Luke"
      });
      
      myResponse.on('response', (response) => {
        
         console.log("I got a response back: " + response);
      });
      
      myResponse.on('error', (error) => {
        console.log(error);
      });
      
      
      //////
      if(text === "hi"){
        
        
        //the return needs to be the output from the stuff you need
          return "Hi " + name;
      }
     return "I'm reading from my talkBack function you did say hi";
  },

};
