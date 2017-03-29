var request = require("request");

module.exports = {

        weather: function weather(info, res) {
            
            var body = info;

            if (body.result.action === 'weather') {
                var city = body.result.parameters["geo-city"];
                //console.log("This is your city: " + city);
                var restURL = "http://api.openweathermap.org/data/2.5/weather?units=imperial&APPID=" + process.env.WEATHER + "&q=" + city;

                request.get(restURL, function(err, response, body) {

                    if (!err && response.statusCode == 200) {
                        var json = JSON.parse(body);
                        //console.log(json);

                        var msg = "Looks to be " + json.weather[0].description + " and temperature currently is " + ~~json.main.temp + " °F";
                        //console.log(msg);
                        return res.json({
                            speech: msg,
                            displayText: msg,
                            source: "weather"
                        });
                    }
                });
            }
            else if (body.result.action === 'forecast') {
                var city = body.result.parameters["geo-city"];
                //console.log("This is your city: " + city);
                var restURL = "http://api.openweathermap.org/data/2.5/forecast/daily?units=imperial&q=" + city + "&cnt=5&APPID=" + process.env.WEATHER;
                
                console.log(restURL);

                request.get(restURL, function(err, response, body) {

                    if (!err && response.statusCode == 200) {
                        var json = JSON.parse(body);

                        var today = new Date();
                        var weekday = new Array(7);
                        weekday[0] = "Sunday";
                        weekday[1] = "Monday";
                        weekday[2] = "Tuesday";
                        weekday[3] = "Wednesday";
                        weekday[4] = "Thursday";
                        weekday[5] = "Friday";
                        weekday[6] = "Saturday";
                        //console.log((today.getDay() + 3)%7);
                        var msg = {

                            day1: "*" + weekday[(today.getDay()) % 7] + "*: " + json.list[0].weather[0].description + " and temperature currently is " + ~~json.list[0].temp.day + " °F",
                            day2: "*" + weekday[(today.getDay() + 1) % 7] + "*: " + json.list[1].weather[0].description + " and temperature will be " + ~~json.list[1].temp.max + " °F",
                            day3: "*" + weekday[(today.getDay() + 2) % 7] + "*: " + json.list[2].weather[0].description + " and temperature will be " + ~~json.list[2].temp.max + " °F",
                            day4: "*" + weekday[(today.getDay() + 3) % 7] + "*: " + json.list[3].weather[0].description + " and temperature will be " + ~~json.list[3].temp.max + " °F",
                            day5: "*" + weekday[(today.getDay() + 4) % 7] + "*: " + json.list[4].weather[0].description + " and temperature will be " + ~~json.list[4].temp.max + " °F",

                        };
                        //console.log(msg);
                        return res.json({
                            speech: msg.day1 + "\n" + msg.day2 + "\n" + msg.day3 + "\n" + msg.day4 + "\n" + msg.day5,
                            displayText: msg.day1 + "\n" + msg.day2 + "\n" + msg.day3 + "\n" + msg.day4 + "\n" + msg.day5,
                            source: "weather"
                        });
                    }
                });
            }
        }
    
    };