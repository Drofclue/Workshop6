var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var Db = require('./database');
var ReadDocument = Db.readDocument;



app.use(bodyParser.text());



// You run the server from `server`, so `../client/build` is `server/../client/build`.
// '..' means "go up one directory", so this translates into `client/build`!
app.use(express.static('../client/build'));

/**  * Get the feed data for a particular user.  */
function getFeedData(user) {
  var userData = ReadDocument('users', user);
  var feedData = ReadDocument('feeds', userData.feed);
  // While map takes a callback, it is synchronous,
  // not asynchronous. It calls the callback immediately.
  feedData.contents = feedData.contents.map(getFeedItemSync);
  // Return FeedData with resolved references.
  return feedData;
}

/**  * Resolves a feed item. Internal to the server, since it's synchronous.  */
function getFeedItemSync(feedItemId) {
  var feedItem = ReadDocument('feedItems', feedItemId);
  // Resolve 'like' counter.
  feedItem.likeCounter = feedItem.likeCounter.map((id) => ReadDocument('users', id));
  // Assuming a StatusUpdate. If we had other types of
  // FeedItems in the DB, we would
  // need to check the type and have logic for each type.
  feedItem.contents.author = ReadDocument('users', feedItem.contents.author);
  // Resolve comment author.
  feedItem.comments.forEach((comment) => {
    comment.author = ReadDocument('users', comment.author);
  });
  return feedItem;
}


/**  * Get the user ID from a token. Returns -1 (an invalid ID)  * if it fails.  */
function getUserIdFromToken(authorizationLine) {
  try {
    // Cut off "Bearer " from the header value.
    var token = authorizationLine.slice(7);
    // Convert the base64 string to a UTF-8 string.
    var regularString = new Buffer(token, 'base64').toString('utf8');
    // Convert the UTF-8 string into a JavaScript object.
    var tokenObj = JSON.parse(regularString);
    var id = tokenObj['id'];
    // Check that id is a number.
    if (typeof id === 'number') {
      return id;
    } else {
      // Not a number. Return -1, an invalid ID.
      return -1;
    }
  } catch (e) {
    // Return an invalid ID.
    return -1;
  }
}

/**
 * Get the feed data for a particular user.
 */
app.get('/user/:userid/feed', function(req, res) {
  var userid = req.params.userid;
  var fromUser = getUserIdFromToken(req.get('Authorization'));
  // userid is a string. We need it to be a number.
  // Parameters are always strings.
  var useridNumber = parseInt(userid, 10);
  if (fromUser === useridNumber) {
    // Send response.

    res.send(getFeedData(userid));
  } else {
    // 401: Unauthorized request.
    res.status(401).end();
  }
});

var StatusUpdateSchema = require('./schemas/statusupdate.json');
var validate = require('express-jsonschema').validate;
var writeDocument = Db.writeDocument;
var addDocument = Db.addDocument;

// Support receiving text in HTTP request bodies
app.use(bodyParser.text());
// Support receiving JSON in HTTP request bodies
app.use(bodyParser.json());


/**
 * Adds a new status update to the database.
 */
function postStatusUpdate(user, location, contents) {
  // If we were implementing this for real on an actual server, we would check
  // that the user ID is correct & matches the authenticated user. But since
  // we're mocking it, we can be less strict.

  // Get the current UNIX time.
  var time = new Date().getTime();
  // The new status update. The database will assign the ID for us.
  var newStatusUpdate = {
    "likeCounter": [],
    "type": "statusUpdate",
    "contents": {
      "author": user,
      "postDate": time,
      "location": location,
      "contents": contents,
      "likeCounter": []
    },
    // List of comments on the post
    "comments": []
  };

  // Add the status update to the database.
  // Returns the status update w/ an ID assigned.
  newStatusUpdate = addDocument('feedItems', newStatusUpdate);

  // Add the status update reference to the front of the current user's feed.
  var userData =ReadDocument('users', user);
  var feedData = ReadDocument('feeds', userData.feed);
  feedData.contents.unshift(newStatusUpdate._id);

  // Update the feed object.
  writeDocument('feeds', feedData);

  // Return the newly-posted object.
  return newStatusUpdate;
}

// `POST /feeditem { userId: user, location: location, contents: contents  }`
app.post('/feeditem',
         validate({ body: StatusUpdateSchema }), function(req, res) {
  // If this function runs, `req.body` passed JSON validation!
  var body = req.body;
  var fromUser = getUserIdFromToken(req.get('Authorization'));

  // Check if requester is authorized to post this status update.
  // (The requester must be the author of the update.)
  if (fromUser === body.userId) {
    var newUpdate = postStatusUpdate(body.userId, body.location, body.contents);
    // When POST creates a new resource, we should tell the client about it
    // in the 'Location' header and use status code 201.
    res.status(201);
    res.set('Location', '/feeditem/' + newUpdate._id);
     // Send the update!
    res.send(newUpdate);
  } else {
    // 401: Unauthorized.
    res.status(401).end();
  }
});


/**
 * Translate JSON Schema Validation failures into error 400s.
 */
app.use(function(err, req, res, next) {
  if (err.name === 'JsonSchemaValidation') {
    // Set a bad request http response status
    res.status(400).end();
  } else {
    // It's some other sort of error; pass it to next error middleware handler
    next(err);
  }
});



app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
