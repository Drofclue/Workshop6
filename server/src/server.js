var express = require('express');
var app = express();
var bodyParser = require('body-parser');





app.listen(3000, function () {
  console.log('Example app Listening on port 3000!');
});

app.use(bodyParser.text());


app.use(express.static('../client/build'));
