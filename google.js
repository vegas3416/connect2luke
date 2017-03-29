var request = require("request");

module.exports = {

    lookUp: function lookUp(info, res) {

        var body = info;
        var search = body.result.parameters["given-name"];

        var restURL = "https://www.googleapis.com/customsearch/v1?key=" + process.env.SEARCH + "&prettyPrint&q=" +
            '"' + search + '"';

        //var restURL = "";
        request.get(restURL, function(err, response, body) {

            if (!err && response.statusCode == 200) {
                var json = JSON.parse(body);
                //console.log(json.items[0].title);
            }
            var msg = {};
            for (var i = 0; i < 5; i++) {
                msg[search + (i + 1)] = "*" + (i + 1) + ":* " + "*Title:* " + json.items[i].title + "\n*Link:* " + json.items[i].link;
            }
            //console.log(JSON.stringify(msg));
            //console.log("I see: " + msg.dogs0);
            return res.json({
                speech: "*5 Search results given*\n----------------------\n" + msg[search + 1] + "\n" + msg[search + 2] + "\n" + msg[search + 3] + "\n" + msg[search + 4] + "\n" + msg[search + 5],
                displayText: "*5 Search results given*\n----------------------\n" + msg[search + 1] + "\n" + msg[search + 2] + "\n" + msg[search + 3] + "\n" + msg[search + 4] + "\n" + msg[search + 5],
                source: "Search"
            });
        });
    }
};