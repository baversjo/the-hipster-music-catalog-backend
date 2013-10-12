var express = require("express");
var app = express();
var request = require('request');
var _ = require('underscore');

var pg = require('pg');

var conString = process.env.DATABASE_URL || "postgres://localhost/thmc_development";

var client;

app.use(express.bodyParser());

/* serves main page */
app.get("/", function(req, res) {
	res.sendfile('index.html');
});

var fb_band_repo = {};

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
	res.end(resp);



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

	friends_for(fb_id,access_token,function(users){
		var outer_counter = 0;
		var outer_done = function(){
			if(outer_counter == users.length.length-1){
				pusher_notify_ok();
			}else{
				outer_counter++;
				console.log('another friend done!');
			}
		}
		for(var i=0; i < users.length; i++){
			find_band_likes(users[i],access_token,function(user, band_likes){
				var counter = 0;
				var cont_user = function(){
					if(counter == band_likes.length-1){
						outer_done();
						//calculate and save users score.
						hipster_score(user,fb_id);
					}else{
						counter++;
					}
				}
				user.band_likes = band_likes;
				for(var i=0; i<band_likes.length; i++){
					var like = band_likes[i];
					var cached_band = fb_band_repo[like.page_id];


					if(cached_band){
						like.wiki_date = cached_band.wiki_date;
						cont_user();
					}else{
						find_wiki_date(like,access_token,cont_user);
					}
				}
			});
		}
	});



	//step three:
	//add each band's wikipedia creation date to hash above (step three will be done per-user)
	//input: array elements: {band: "Madeon", like_date: 1235125213}
	//callback: array elements: {band: "Madeon", like_date: 1235125213, wiki_date: 12784122}



	//step four:
	//calculate a hipster score for a user. if wiki_date is null, ignore entry completely.
	//input: array elements: {band: "Madeon", like_date: 1235125213, wiki_date: 12784122}
	//direct output: a float between 0.0-100.0


	//step five: just call the pusher api.
	
});



 pg.connect(conString, function(err, cli, done) {
 	client = cli;
 	if(err){
 		console.log(err);
 	}else{
 		console.log('connected to postgres!');
 		var port = process.env.PORT || 5000;
		app.listen(port, function() {
		  console.log("Listening on " + port);
		});
 	}
 });


//step 1
function friends_for(fb_id,access_token,callback){
	var req_str = 'https://graph.facebook.com/'+
		fb_id+'/friends?limit=5000&offset=0&access_token='+
		access_token;

	request(req_str, function (error, response) {
		var body = JSON.parse(response.body);
		if(error){
			pusher_error(error);
		}else{
			var users = body.data;
			return callback(users);
		}
	});
}

//step 2
function find_band_likes(obj_user,access_token,callback){ //or just: /517185072/likes

	var query = 'SELECT page_id, type, created_time FROM page_fan WHERE uid='+obj_user.id+' AND (type = "MUSICIAN/BAND" OR type = "ARTIST") LIMIT 40;';

	var req_str = 'https://graph.facebook.com/fql?q='+
	encodeURIComponent(query)+'&access_token='+
	access_token;

	request(req_str, function (error, response) {
		var body = JSON.parse(response.body).data;

		if(error || body){
			pusher_error(error || body);
		}else{
			callback(obj_user,body);
		}
	});
}

function find_wiki_date(like,access_token, callback){
	var query = "select name FROM page WHERE page_id = " + like.page_id;

	var req_str = 'https://graph.facebook.com/fql?q='+
	encodeURIComponent(query)+'&access_token='+
	access_token;

	request(req_str, function (error, response) {
		var body = JSON.parse(response.body);
		if(error){
			pusher_error(error);
		}else{
			var name = body.data[0].name;
			wikipedia_creation_date_by_name(name,function(date){
				like.wiki_date = date;
				callback();
			});
			
		}
	});
}

//step 3
function wikipedia_creation_date_by_name(name, callback){
//    var request = require('request');
    var date='';
    request("http://en.wikipedia.org/w/api.php?action=query&prop=revisions&titles="+
    	encodeURIComponent(name)+
    	"&rvprop=timestamp%7Cuser&rvdir=newer&rvlimit=1&format=json&callback=?",
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var a =  body.indexOf("timestamp");
                var date ='';
                if(a){
                    for(var b=a+12; b<= a+31;b++)
                        date+=body[b];
                }
                date = new Date(date);
                callback(date);
            }
    });
}

/*


*/


//step 4
function hipster_score(user, original_user_id){
    var fbLike = arr_bands.like_date;
    var wiki   = arr_bands.wiki_date;

    user.score = Math.floor(Math.random() * 99);//TODO: do fancy calculation instead of this line

    /*
    if(fbLike.getYear()<= wiki.getYear()){
        if(fbLike.getMonth() <= wiki.getMonth()){
            if(fbLike.getDay() <= wiki.getDay()){
                //increase score

	            }
	        }
	    }
	*/

    client.query('SELECT id, score FROM users WHERE id = $1', [user.id], function(err, result) {
    	if(result.rows[0]){
    		//UPDATE
    		//create relationship
    		client.query('UPDATE users SET score = $1 WHERE id = $2', [user.score, user.id]);
    		client.query('INSERT INTO friendships (user_id,friend_id) VALUES ($1,$2)', [original_user_id,user.id]); //TODO: validate uniqueness
    	}else{

    		client.query('INSERT INTO users (id,name,score,created_at,updated_at) VALUES ($1,$2,$3,$4,$5)',
    			[user.id, user.name, user.score, +new Date(), +new Date()]);


    		client.query('INSERT INTO friendships (user_id,friend_id) VALUES ($1,$2)', [original_user_id,user.id]);
    	}
    	
    });

}


function pusher_error(error){
 //todo: call pusher!
 	console.log(error);
 	console.log("PUSHER: ERROR");
}
function pusher_notify_ok(){
	console.log("PUSHER: DONE");
}