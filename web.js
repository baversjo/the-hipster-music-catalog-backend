var express = require("express");
var app = express();
var request = require('request');
var _ = require('underscore');

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
		/*for(var i=0; i < users.length; i++){
			find_band_likes(users[i],access_token,function(user, bands){

			});
		}*/
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

var port = process.env.PORT || 5000;
 app.listen(port, function() {
   console.log("Listening on " + port);
 });


//step 1
function friends_for(fb_id,access_token,callback){
	var req_str = 'https://graph.facebook.com/'+
		fb_id+'/friends?limit=5000&offset=0&access_token='+
		access_token;

	request(req_str, function (error, response) {
		var body = JSON.parse(response.body);
		if(error){
			error();
		}else{
			var users = body.data;
			return callback(users);
		}
	});
}

//step 2
function find_band_likes(obj_user,access_token,callback){ //or just: /517185072/likes

	//SELECT page_id, type, created_time FROM page_fan WHERE uid=1526632 AND "MUSICIAN/BAND" LIMIT 300;

	var req_str = 'https://graph.facebook.com/'+
	obj_user.id+'/friends?limit=1&offset=0&access_token='+
	access_token;

	request(req_str, function (error, response) {
		var body = JSON.parse(response.body);
		console.log(body);
		if(error){
			error();
		}else{
			//var users = body.data;
			//return callback(users);
		}
	});
}
getWikiDate({'band':'cuba', 'like_date': '1235125213'}, function(num){
    console.log(num);
});

//step 3
function getWikiDate(array_bands, callback){
//    var request = require('request');
    var date='';
    request("http://en.wikipedia.org/w/api.php?action=query&prop=revisions&titles="+array_bands.band+"&rvprop=timestamp%7Cuser&rvdir=newer&rvlimit=1&format=json&callback=?",
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var a =  body.indexOf("timestamp");
                var date ='';
                if(a){
                    for(var b=a+12; b<= a+31;b++)
                        date+=body[b];
                    //console.log(date);
                }
                date = new Date(date);
                console.log("Date:", date);
                bandArray={
                    'band': array_bands.band,
                    like_date: array_bands.like_date,
                    wiki_date: date
                }
                callback(bandArray);
            }
    });
}
//hipster_score({'band':'cuba','like_date':'2002',wiki_date:'2003'});

//step 4
function hipster_score(arr_bands){
    var fbLike = arr_bands.like_date;
    var wiki   = arr_bands.wiki_date;



    if(fbLike.getYear()<= wiki.getYear()){
        if(fbLike.getMont() <= wiki.getMonth()){
            if(fbLike.getDay() <= wiki.getDay()){
                //increase score

            }
        }
    }


	return 0.0;
}


function error(){
 //todo: call pusher!
}
function pusher_notify_ok(){

}