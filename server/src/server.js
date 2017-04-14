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

app.use(bodyParser.text());


// Handle POST /reverse [data]
app.post('/reverse', function (req, res) {
  // If the request came with text, then the text() middleware handled it
  // and made `req.body` a string.
  // Check that req.body is a string.
  if (typeof(req.body) === 'string') {
    var reversed = reverseString(req.body);
    res.send(reversed);
  } else {
    // POST did not contain a string. Send an error code back!
    res.status(400).end();
  }
});
