var http = require('http');
var url = require('url');
var querystring = require('querystring');
var static = require('node-static');
var file = new static.Server('.');

function to_kv(string, separator){
	var arr = string.split(separator);
	return {"key":arr[0],"value":arr.length<2?"":arr[1]};
}
function to_hash(record){
	var hash = [];
	var arr = record.split("&");
	for(var r in arr)
	{
		var t=to_kv(arr[r],"=");
//		var t=arr[r].split("=");
		hash[t.key]=t.value;
	}
	return hash;
}
function to_event_record(str){
	var rec = {};
	hash = to_hash(str);
	var t = new Date(hash["time"]);
	if(t!="Invalid Date"){
		rec["time"] = t;
	}
	if(hash["log"]=="empty"){
		rec["empty"] = true;
	}else{
		rec["empty"] = false;
		try{
		rec["id"]  = t.toISOString();
		}catch(ex)
		{console.log("Invalid eventRecord string : "+str)}
		rec["ids"] = hash["id"] || hash["ids"];
if(rec["ids"]=="undefined"){
	console.log(str);
}	
		rec["index"] = hash["index"];
	}
	rec["n"] = hash["n"];
	rec["state"] = hash["state"];
	rec["currentTime"]=false;
	return rec;
}

function db_query(str,client,response_fn){
	client.query(str, (err, res) => {
	  if (err) throw err;
	  response_fn(res);
	  client.end();
	});
	
}

function accept(req, res) {

//  res.writeHead(200, {
//    'Content-Type': 'text/plain',
//    'Cache-Control': 'no-cache'
//  });
  var params = req.url.split("?");
  if (params[0]=='/server') {
	
	if(params.length>1){
		hash = to_hash(params[1]);
		for(var key in hash){
  
			switch(key){
				case "date":
					res.write("date="+ (new Date()).toISOString());
				break;
				default:
console.log("Unhandled req:" + req.url);				
				break;
				
			}
		}
	}else{
		res.write("connection=1");
	}
	res.end("");
  } else {
    // иначе считаем это запросом к обычному файлу и выводим его
    file.serve(req, res); // (если он есть)
  }
  if(params[0]=='/db'){
	const { Client } = require('pg');

	const client = new Client({
	  connectionString: process.env.DATABASE_URL,
	  ssl: true,
	});

	client.connect();
	var query = "SELECT version();";
	//var query = 'SELECT table_schema,table_name FROM information_schema.tables;'
	db_query(query,client,function(result){
	  for (let row of result.rows) {
		  res.write(row);
		console.log(JSON.stringify(row));
	  }
	});
	res.write("<br /> db");
  }

//  res.end("OK");
}

var PORT = process.env.PORT || 80;
console.log("Server start at port "+PORT);
http.createServer(accept).listen(PORT);
