const request = require("request");

module.exports.sendMessage = function (msg, color, url, space, token) {
  const appMessage = {
    "type": "appMessage",
    "version": "1",
    "annotations": [{
      "type": "generic",
      "version": "1",

      "title": "",
      "text": "",
      "color": color,
    }]
  };

  const sendMessageOptions = {
    "url": url + "/v1/spaces/" + space + "/messages",
    "headers": {
      "Content-Type": "application/json",
      "jwt": JSON.parse(token.req.res.body).access_token
    },
    "method": "POST",
    "body": ""
  };

  appMessage.annotations[0].text = msg;
  sendMessageOptions.body = JSON.stringify(appMessage);

  request(sendMessageOptions, function(err, response, sendMessageBody) {
    if (err || response.statusCode !== 201) {
      console.log("ERROR: Posting to " +
          sendMessageOptions.url +
          "resulted on http status code: " +
          response.statusCode +
          " and error " +
          err);
    }
  });
}

module.exports.makeGraphQLCall = function (body, token, url, callback) {
  const sendMessageOptions = {
    "url": url + "/v1/spaces/" + space + "/messages",
    "headers": {
      "Content-Type": "application/graphql",
      "x-graphql-view": "PUBLIC",
      "jwt": JSON.parse(token.req.res.body).access_token},
    "method": "POST",
    "body": body
  };
  request(sendMessageOptions, function(err, res, body) {
    if (err) {
      callback(err, null);
    } else {
      callback(null, JSON.parse(body));
  });
}
