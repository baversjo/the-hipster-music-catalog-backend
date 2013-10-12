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
function getWikiDate(array_bands, callback){
    var request = require('request');
    var date='';
    request("http://en.wikipedia.org/w/api.php?action=query&prop=revisions&titles="+array_bands.band+"&rvprop=timestamp%7Cuser&rvdir=newer&rvlimit=1&format=json&callback=?", function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var a =  body.indexOf("timestamp");
            var date ='';
            if(a){
                for(var b=a+12; b<= a+31;b++)
                    date+=body[b];
                console.log(date);
            }
            bandArray={
                'band': array_bands.band,
                like_date: array_bands.like_date,
                wiki_date: date
            }
            callback(bandArray);
        }
    })
}
hipster_score({'band':'cuba','like_date':'2002',wiki_date:'2003'});

//step 4
//step 4
function hipster_score(arr_bands){
    var likeYear='',wikiYear='';
    for(var i=0;i<=3;i++){
        likeYear+=arr_bands.like_date[i];
        wikiYear+=arr_bands.wiki_date[i];
    }
    var likeMonth='',wikiMonth='';
    for(var i=5;i<=6;i++){
        likeMonth+=arr_bands.like_date[i];
        wikiMonth+=arr_bands.wiki_date[i];
    }
    var likeDay='', wikiDay='';
    for(vari=8;i<=9;i++){
        likeDay+=arr_bands.like_date[i];
        wikiDay+=arr_bands.wiki_date[i];
    }


    if(parseInt(likeYear) <= parseInt(wikiYear)){
        if(parseInt(likeMonth) <= parseInt(wikiMonth)){
            if(parseInt(likeDay) <= parseInt(wikiDay)){
                //increase score

            }
        }
    }

    return 0.0;
}