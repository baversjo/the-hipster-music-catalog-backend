var express = require("express");
var app = express();

/* serves main page */
app.get("/", function(req, res) {
	res.sendfile('index.html');
});

app.post("/howhipsteris", function(req, res) { 
/* some server side logic */
res.send("Error: to be implemented");
});

var port = process.env.PORT || 5000;
 app.listen(port, function() {
   console.log("Listening on " + port);
 });