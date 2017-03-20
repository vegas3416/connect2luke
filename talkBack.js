//This is what is going to be used to sent out for processing

module.exports = {
    
  talkBack: function talkBack(text, userName) {
      
      var name = userName.split(" ")[0];
      if(text === "hi"){
          return "Hi " + name;
      }
     return "I'm reading from my talkBack function you did say hi";
  },

};