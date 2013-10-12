var express = require("express");
var app = express();
var request = require('request');
var _ = require('underscore');
var Pusher = require('pusher');

var pusher = new Pusher({
  appId: process.env.PUSHER_APP,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET
});

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
		console.log('a');
		var outer_counter = 0;
		if(!users){
			pusher_error(fb_id,"could not fetch friends (invalid access token?)");
			return;
		}
		var total_users = users.length;
		var outer_done = function(){
			pusher_count(outer_counter,total_users);
			outer_counter++;
			if(outer_counter == total_users){
				pusher_notify_ok();
				console.log('completely done!');
			}
		}

		console.log("users length:", users.length);
		for(var i=0; i < users.length; i++){
			console.log('b');
			find_band_likes(users[i],access_token,fb_id,function(user, band_likes){
				var counter = 0;
				var cont_user = function(fail){
					if(fail){
						counter++;
						return;
					}
					if(counter == band_likes.length-1){
						console.log('one done!');
						outer_done();
						//calculate and save users score.
						hipster_score(user,fb_id);
					}else{
						counter++;
					}
				}
				user.band_likes = band_likes;
				if(band_likes == null || band_likes.length == 0){
					outer_done();
					return;
				}
				for(var j=0; j<band_likes.length; j++){
					var like = band_likes[j];
					var cached_band = fb_band_repo[like.page_id];


					if(cached_band){
						like.wiki_date = cached_band.wiki_date;
						cont_user();
					}else{
						find_wiki_date(like,access_token,fb_id,cont_user);
					}
				}
			});
		}
	});
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
		fb_id+'/friends?limit=500&offset=0&access_token='+
		access_token;

	request(req_str, function (error, response) {
		var body = JSON.parse(response.body);
		if(error){
			pusher_error(fb_id,error);
		}else{
			var users = body.data;
			return callback(users);
		}
	});
}

//step 2
function find_band_likes(obj_user,access_token,original_user_id, callback){ //or just: /517185072/likes

	var query = 'SELECT page_id, type, created_time FROM page_fan WHERE uid='+obj_user.id+' AND (type = "MUSICIAN/BAND" OR type = "ARTIST") LIMIT 40;';

	var req_str = 'https://graph.facebook.com/fql?q='+
	encodeURIComponent(query)+'&access_token='+
	access_token;

	request(req_str, function (error, response) {
		var body = JSON.parse(response.body).data;

		if(error){
			pusher_error(original_user_id, error);
			callback();
		}else{
			callback(obj_user,body);
		}
	});
}

function find_wiki_date(like,access_token,original_user_id,callback){
	var query = "select name FROM page WHERE page_id = " + like.page_id;

	var req_str = 'https://graph.facebook.com/fql?q='+
	encodeURIComponent(query)+'&access_token='+
	access_token;

	request(req_str, function (error, response) {
		var body = JSON.parse(response.body);
		if(error){
			pusher_error(original_user_id,error);
			callback(true);
		}else{
			var name = body.data[0].name;
			wikipedia_creation_date_by_name(name,function(date){
				console.log('=> new wiki date:', date, "for:", name);
				like.wiki_date = date;
				fb_band_repo[like.page_id] = {wiki_date: date};
				callback();
			});
			
		}
	});
}

//step 3
function wikipedia_creation_date_by_name(name, callback){
//    var request = require('request');
    var reqStr = "http://en.wikipedia.org/w/api.php?action=query&prop=revisions&titles="+
    	encodeURIComponent(name)+
    	"&rvprop=timestamp%7Cuser&rvdir=newer&rvlimit=1&format=json";

    request(reqStr,
        function (error, response, body) {
        	var date;

        	var data = JSON.parse(body);
        	if(data && data.query && data.query.pages){
	        	var page_key = Object.keys(data.query.pages)[0];
	        	var revisions = data.query.pages[page_key].revisions;
	        	if(revisions){
	        		date = new Date(revisions[0].timestamp);
	        	}
        	}
        	callback(date);
    	});
}

/*


*/


//step 4
function hipster_score(user, original_user_id){
    for(var i=0; i<user.band_likes.length; i++){
    	var data = user.band_likes[i];
    	data.created_time = new Date(date.created_time*1000)
    	if( data.wiki_date === null ){
    		user.score += 5;
    	}
    	else {
    		var like_year = data.getFullYear();
    		var like_month = data.getMonth();

    		var wiki_year = data.wiki_date.getFullYear();
    		var wiki_month = data.wiki_date.getMonth();

    		var year_diff = wiki_year - like_year;
    		var month_diff = wiki_month - like_month;
    		if(year_diff >= 0){
    			if(month_diff > 0){
    				user.score += year_diff * 12 + month_diff;
    			}
    			else{
    				user.score += (year_diff-1) * 12 + 12 - month_diff;
    			}
    		}
    	}
    }

    client.query('SELECT id, score FROM users WHERE id = $1', [user.id], function(err, result) {
    	if(result && result.rows[0]){
    		//UPDATE
    		//create relationship
    		client.query('UPDATE users SET score = $1 WHERE id = $2', [user.score, user.id]);
    	}else{

    		client.query('INSERT INTO users (id,name,score,created_at,updated_at) VALUES ($1,$2,$3,$4,$5)',
    			[user.id, user.name, user.score, new Date(), new Date()]);
    		
    	}
    	client.query('SELECT user_id FROM friendships WHERE user_id = $1 and friend_id = $2', [original_user_id,user.id], function(err, result) {
    		if(!(result && result.rows[0])){
    			client.query('INSERT INTO friendships (user_id,friend_id) VALUES ($1,$2)', [original_user_id,user.id]);
    		}
    	});
    	
    });

}


function pusher_count(original_user_id, current, total){
 //todo: call pusher!
 	if(current % 20 == 0){
 		pusher.trigger(original_user_id, 'progress', {current:current,total:total});
 	}
}

function pusher_error(original_user_id, error){
 //todo: call pusher!
 	console.log(error);
 	console.log("PUSHER: ERROR");
 	pusher.trigger(original_user_id, 'error', {error:error});
}
function pusher_notify_ok(original_user_id){
	console.log("PUSHER: DONE");
	setTimeout(function(){
		pusher.trigger(original_user_id, 'done', {});
	},1000);
}