
var request = require('request'),
    https = require('https'),
    request = request.defaults({
       
    });
    
var cheerio = require('cheerio');    


var str;
var options = {
    hostname: 'moneymex.com',
    path: '/Home/Welcome',
    method: 'GET',
    headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux i686) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/23.0.1271.64 Safari/537.11',
            'Cookie': "",
            'Accept': '/',
            'Connection': 'keep-alive'
    }
};


module.exports.getRates = function(callback){
    loadFirstPage(function(content){
        var $ = cheerio.load(content);
        var prices = $(".bazarprice");
        var rates = {
            "buy": parseNumeric(prices[0].children[0].data),
            "sell": parseNumeric(prices[1].children[0].data),
            "last": parseNumeric(prices[2].children[0].data)
        };
        callback(rates);
    });
}

function parseNumeric(s){
    return parseInt(s.replace(',', ''));
}

function  loadFirstPage(done) {  
    https.get(options, function (resp) {
        resp.setEncoding('utf8');
        // console.log(resp.headers);
        // set the cookies and make another request to the same page
        options.headers.Cookie = resp.headers["set-cookie"];
        
        https.get(options, function (resp) {
           // console.log(resp.headers);
        
        if (resp.statusCode) {
            resp.on('data', function (part) {
                str += part;
            });
            resp.once('end', function (part) {
                done(str);
            });
    
            resp.on('error', function (e) {
                console.log('Could not get Moneymex rates. Problem with request: ' + e.message);
            });
        }
        });
    }).end(str);
}
