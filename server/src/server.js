var express = require('express');
var app = express();
var bodyParser = require('body-parser');
// var Util = require('./util');
// var RevString = Util.reverseString;




app.use(bodyParser.text());

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});

// You run the server from `server`, so `../client/build` is `server/../client/build`.
// '..' means "go up one directory", so this translates into `client/build`!
app.use(express.static('../client/build'));
