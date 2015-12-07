var http = require("http");
var options = {
  host: url,
  port: 80,
  path: 'https://www.bitstamp.net/api/ticker/',
  method: 'GET'
};


http.request(options, function(res) {
  console.log('STATUS: ' + res.statusCode);
  console.log('HEADERS: ' + JSON.stringify(res.headers));
  res.setEncoding('utf8');
  res.on('data', function (chunk) {
    console.log('BODY: ' + chunk);
  });
}).end();