var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var util = require('./util');
var reverseString = util.reverseString;

app.get('/',function (req, res) {
  res.send('Hello World!');
});

app.listen(3000, function () {
  console.log('Example app Listening on port 3000!');
});

app.post('/reverse', function (req, res) {

  if (typeof(req.body) === 'string') {
    var reversed = reverseString(req.body);
    res.send(reversed);
  }

else{
  res.status(400).end();
}

});

app.use(bodyParser.text());
