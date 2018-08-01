var sqlite3 = require("sqlite3").verbose();
var dbFileName = "PhotoQ.db"; //try a test database first
var db = new sqlite3.Database(dbFileName);
var APIrequest = require('request');
var fs = require("fs");

var imgList = JSON.parse(fs.readFileSync("photoList.json")).photoURLs;
var url = 'https://vision.googleapis.com/v1/images:annotate?key=AIzaSyCAIhCQcYZiuAHoPhef7IpYe0XdHeRTj9I';
var url_start = 'http://lotus.idav.ucdavis.edu/public/ecs162/UNESCO/';
//global variable so we can pass the ID to the other functions 
var count = 0 //is also the ID of each picture
//command string for sql
var cmdStr = 'UPDATE photoTags SET location = "_Location", tags= "_tags" WHERE idNum = "_idX"';
nextResponse(count);

function nextResponse(count)
{

 var temp = url_start+imgList[count];
//API request object 
APIrequestObject = {
  "requests": [
    {
      "image": {
        "source": {"imageUri": temp}
        },
      "features": [{ "type": "LABEL_DETECTION", "maxResults":6 },{ "type": "LANDMARK_DETECTION"} ]
    }
  ]
}
     annotateImage(count);
}

// function to send off request to the API
function annotateImage(count) {
	// The code that makes a request to the API
	// Uses the Node request module, which packs up and sends off 
	// an HTTP message containing the request to the API server
	APIrequest(
	    { // HTTP header stuff
		url: url,
		method: "POST",
		headers: {"content-type": "application/json"},
		// will turn the given object into JSON
		json: APIrequestObject
	    },
	    // callback function for API request
           APIcallback
	);


	// callback function, called when data is received from API
	function APIcallback(err, APIresponse, body) {
	//err, APIresponse, body,
		  if ((err) || (APIresponse.statusCode != 200)) {
		console.log("Got API error");
		console.log(body);
    	    	} else {
		APIresponseJSON = body.responses[0];
        	dbcallback(APIresponseJSON, count);
       			 if (count !=imgList.length-1)
			{
			count++;
			nextResponse(count);
    			} // end callback function
       	        }	
	function dbcallback(APIresponseJSON, temp2)
	{
         //if no location put a blank instead
	   var blank = "";
  	 var temp = [];
   	console.log("id: " + temp2);
  	 //checking if the label annotations exist and then putting them all in one        string
 	 if (APIresponseJSON.labelAnnotations)
   	{   for(let i =0; i< APIresponseJSON.labelAnnotations.length; i++)
            {
       		 temp[i] = APIresponseJSON.labelAnnotations[i].description;

            }
        }
         var tempstring = temp.join(",");
         console.log(tempstring);
         var cmd = cmdStr.replace("_tags", tempstring); 
         cmd = cmd.replace("_idX", temp2);
         //have to check if there exist landmark annotations
         if (APIresponseJSON.landmarkAnnotations)
        {
        var tempLandmark = APIresponseJSON.landmarkAnnotations[0].description; 
       cmd = cmd.replace("_Location", tempLandmark);
       }
       else {cmd = cmd.replace("_Location", blank)
           console.log("no location tag");          
        };	
	update(cmd);
    }


 }// end of APIcallback
} // end of annotateImage()



//making sure the cmd is right before running and then  
function update(cmd)
{
console.log(cmd);
 db.run(cmd, updateCallback);
}

//callback see if it worked or if it didnt
function updateCallback(err) {
  if (err)
  {console.log("Error while updating table!");}
  else {console.log("Successful update!");}

}





