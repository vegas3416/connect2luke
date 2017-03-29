var request = require("request");

module.exports = {

    zendesk: function zendeskOpen(info, res) {

            var type = '';
            var pick = '';
            var msg = ' ';
            var body = info;
            //console.log(body);
            var search = body.result.parameters;
            console.log(search);
            var errorMessage = (body.result.fulfillment.speech);
            if (search.open && !search['number-integer']) {
                console.log('open');
                type = 'type:ticket status:open';
                pick = 'open';
            }
            else if (search.id && search.description) {
                //console.log("ID search: " + search['number-integer']);
                type = search['number-integer'];
                //console.log(type);
                pick = 'id';
            }
            else if (search.keyword) {
                console.log("In search: " + search.description);
                type = search.description;
                console.log("This is type: " + type);
                pick = 'key';
            }

            var options = {
                url: 'https://ibmworkspace.zendesk.com/api/v2/search.json?query=' + type,
                'auth': {
                    'user': process.env.Z_USER,
                    'pass': process.env.Z_TOKEN,
                    'Accept': "application/json"
                }
            };

            function callback(error, response, body) {
                if (error && response.statusCode != 200) {
                    console.log("Show yourself");
                    console.log(error);
                }
                else if (!error) {
                    //&& response.statusCode == 200
                    console.log(body);
                    var json = JSON.parse(body);
                    //console.log("HHEHEHE: " + json);
                }
                //var msg = json.results;
                //console.log(msg);
                //var msg = ' ';

                switch (pick) {
                    case 'open':
                        for (var x = 0; x < json.results.length; x++) {
                            msg += "*ID: " + json.results[x].id + "* - " + json.results[x].subject + ' \n';
                            //console.log(msg);
                        }
                        break;
                    case 'id':
                        if (json.count == 0) {
                            msg = "I'm sorry but that Id is invalid, may have been recently deleted, or aliens abducted it";
                        }
                        else {
                            msg = "*ID: " + json.results[0].id + "* \n*Description:* " + json.results[0].description + "\n*Status:* " +
                                json.results[0].status;
                        }
                        break;
                    case 'key':
                            
                        break;
                    case 'pending':
                        break;
                    case 'solved':
                        break;
                    case 'email':
                        break;

                    default:
                        msg = errorMessage;
                }









                return res.json({
                    speech: msg,
                    displayText: msg,
                    source: "Zendesk"
                });
            }
            request(options, callback);
        } ///End of Function 
}; ///End of Moduel