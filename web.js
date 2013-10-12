var express = require("express");
var app = express();

app.use(express.bodyParser());

/* serves main page */
app.get("/", function(req, res) {
	res.sendfile('index.html');
});

app.get("/howhipsteris", function(req, res) { 
	var fb_id = req.query.fb_id,
	access_token = req.query.access_token;

	var resp = "fb_id:" + fb_id + " access_token:" + access_token;

	if(fb_id && access_token){
		resp += " request is OK!";
		res.status(200);
	}else{
		resp += " bad request, missing param!";
		res.status(400);
	}



	//step one:
	//get list of friend's fb_ids:
	//input: fb_id, access_token
	//callback: array with fb_ids
	//friends_for(fb_id,access_token,callback);

	//step two:
	//find user's all band likes
	//input: one fb_id
	//callback: array elements: {band: "Madeon", like_date: 1235125213}
	//find_band_likes(fb_id,callback)

	//step three:
	//add each band's wikipedia creation date to hash above (step three will be done per-user)
	//input: array elements: {band: "Madeon", like_date: 1235125213}
	//callback: array elements: {band: "Madeon", like_date: 1235125213, wiki_date: 12784122}

	//step four:
	//calculate a hipster score for a user. if wiki_date is null, ignore entry completely.
	//input: array elements: {band: "Madeon", like_date: 1235125213, wiki_date: 12784122}
	//direct output: a float between 0.0-100.0


	//step five: just call the pusher api.
	res.end(resp);
});

var port = process.env.PORT || 5000;
 app.listen(port, function() {
   console.log("Listening on " + port);
 });


//step 1
function friends_for(fb_id,access_token,callback){

}

//step 2
function find_band_likes(fb_id,callback){

}

//step 3
function get_wiki_creation_date(arr_bands,callback){

}

//step 4
function hipster_score(arr_bands){

	return 0.0;
}