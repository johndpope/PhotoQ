
var http = require('http');
var static = require('node-static'); //new
var fs = require('fs');
var sqlite3 = require("sqlite3").verbose();
var auto = require("./makeTagTable");

//create a new server and a file server that serves out of the public directory
var server = http.createServer(handler);
var fileServer = new static.Server('./public');

var dbFileName = "PhotoQ.db";
var db = new sqlite3.Database(dbFileName);

var tagTable = {};
auto.makeTagTable(tagTableCallback);
function tagTableCallback(data){
  tagTable = data;
}

// like a callback
function handler (request, response) {
    var url = request.url;
    url = url.split("/");

    if(url[1]){  //if it exists
      var newurl = url[1];
      var searchurl = url[1];
      var deleteurl = url[1];
      var autourl = url[1];
      newurl = newurl.split("?numList=");
      searchurl = searchurl.split("?keyList=");
      deleteurl = deleteurl.split("?key=");
      autourl = autourl.split("?autocomplete=");

      if ((newurl[0] == "query") && newurl[1])  // if its in the form query?num=482
      {
          var arrToStringify = [];    //to store all the list of numbers to stringify later
          var input = newurl[1];      //grab the list of numbers

	        if (input.split("%20"))
	        {
	           input = input.replace("%20", " ");
	        }

          if(input.split("+"))
          {
            input = input.split("+");
            var counter = input.length;
            callDatabase();
          }   //end of if statement

          function callDatabase(){
            for(let i = 0; i < input.length; i++){
              var cmd = db.get('SELECT * FROM photoTags WHERE idNum = ' + input[i], function (err, arrData) {
                counter -= 1;
                if(Number(input[i]) == "NaN" || Number(input[i]) <  0 || Number(input[i]) > 989 || err) {
                  console.log("error: ", err, "\n");
                } else {
                  console.log("array: ", arrData, "\n");
                  arrToStringify.push({"src": 'http://lotus.idav.ucdavis.edu/public/ecs162/UNESCO/' + arrData.src, "width": arrData.width, "height": arrData.height });
                }
                if(counter == 0){ // if we are done with the list
                  console.log("Done with list. Now writing to response...\n");
                  console.log(arrToStringify);
	                response.write("There are all the photos satisfying the query.");
                  response.write(JSON.stringify(arrToStringify));
		              response.end();
                }
              });
            } //end of the forloop
          }
      }
      else if ((searchurl[0] == "query") && searchurl[1]) //searching part
      {
          var searches = searchurl[1];  //get the tag search
          if (searches.split("%20"))
      	  {
      	    searches = searches.replace("%20", " ");
       	  }
          searches = searches.split("+");

          var counter = searches.length;
          var arrToStringify = [];    //to store all the list of numbers to stringify late

          //loop that concatenates all the tags together
          var tagsConcatenated = "";
          for(var i = 0; i < searches.length; i++){
            if(i == searches.length - 1){
              tagsConcatenated += '(location = "' + searches[i] + '"'+ ' OR tags LIKE ' + '"%' + searches[i] + '%")';
            }
            else{
              tagsConcatenated += '(location = "' + searches[i] + '"'+ ' OR tags LIKE ' + '"%' + searches[i] + '%") AND';
            }
          }

          //select
          var cmd = db.all('SELECT * FROM phototags WHERE ' + tagsConcatenated, function (err, data){
		          counter = 0;
              if(err){
                console.log("error with search tags: ", err, "\n");
              } else {
                console.log("ehh data?: ", data, "\n");
                //loop the array and push each photo
                for(let j = 0; j < data.length; j++)
                {
		              var src = data[j].src;
		              //var src = decodeURIComponent(data[j].src);
                  arrToStringify.push({"src": 'http://lotus.idav.ucdavis.edu/public/ecs162/UNESCO/' + src, "width": data[j].width, "height": data[j].height, "location": data[j].location, "tags": data[j].tags, "idNum": data[j].idNum });
                }
              }
              if(counter == 0){
                console.log("Done searching all tags. Now writing to response...");
                console.log(arrToStringify);
                response.write(JSON.stringify(arrToStringify));
                response.end();
              }
          });
      }
      else if((deleteurl[0] == "delete") && deleteurl[1]) //if url == delete?key
      {
        //deleteurl[1] contains the tag to be deleted
      	var deleteurl = deleteurl[1];
      	deleteurl = deleteurl.split("DEL");
        //	 if (deleteurl[1].split("%20"))
        //      {
          //     deleteurl[1] = deleteurl[1].replace('%20', " ");
            //  }
      	var uri = deleteurl[1];
      	var uri_dec = decodeURIComponent(uri);
      	console.log(uri_dec);
      	console.log("after replace: " + deleteurl[0] + " "+  deleteurl[1]);

      	var cmdStr = 'UPDATE photoTags SET tags= "_tags" WHERE idNum = "_idX"';
      	var cmd = cmdStr.replace("_tags", uri_dec);
               cmd = cmd.replace("_idX", deleteurl[0]);
      	console.log(cmd);
      	db.run(cmd, updateCallback);

      	function updateCallback(err)
      	{
      	   console.log("update callback successful!");
      	   response.end();
      	}
      }
      else if((autourl[0] == "query") && autourl[1]){ //autocomplete query
    	   //console.log("autobots"); 
    	   var inputs = autourl[1];
    	   console.log(inputs);
    	   var completions = tagTable[inputs];
    	   completions = Object.keys(completions.tags);
    	   console.log(completions);

    	   response.write(JSON.stringify(completions));
    	   response.end();
    	   //parse through tagtable and find whatever tags matches, send back to browser
    	   //and use Object.keys(whateverSentBack) to an arr to get just the tags and display it
      }
      else{
        fileServer.serve(request, response, function (e, res) {
          if (e && (e.status === 404)) { // If the file wasn't found
           fileServer.serveFile('/not-found.html', 404, {}, request, response);
          }
        });
      }
    } //if url[1] does not exist
    else{
      //otherwise it should be in the form http://server162.site:58490/testWHS.html or a similar nature
         fileServer.serve(request, response, function (e, res) {
           if (e && (e.status === 404)) { // If the file wasn't found
            fileServer.serveFile('/not-found.html', 404, {}, request, response);
         }
       }); //end of function call
    }
}

//new
 require('http').createServer(function (request, response) {
     request.addListener('end', function () { // run a custom callback function in response to query changing
       handler(request, response);

     }).resume();
 }).listen(55851);
