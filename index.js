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


let db={
	pg:null,
	dbCalls:[],
	client:null,
	
	query:function(str, values, resolve){
		if(this.client==null){
			const { Client } = require('pg');
			this.client = new Client({
			  connectionString: process.env.DATABASE_URL,
			  ssl: true,
			});
			this.client.connect();
		}
		var client = this.client;
		let query = this.client.query(str,values,resolve);
		this.dbCalls.push( query );
		return query;
	},
	end:function(){
		this.client.end();
		return Promise.all(this.dbCalls).then(res =>{
			console.log("promises");
		});
	}
}


/*

class DB_TABLE{
	name:'',
	db:null,
	init:function(tname, db = null){
		if(!!db){
			if(db instanceOf DB){
				$this->db=$db;
			}else{
				// instanceOf mysqli
				$this->db=new DB($db);
			}
		}
		$this->name = $tname;
	}
	// $columns = [DB_COLUMN, ...]
	
	function create($columns, $db = null){
		$col = [];
		foreach($columns as $column){
			$type = DB_COLUMN_TYPE::name($column->type);
			$len = $column->length == 0 ? '' : "({$column->length})"; 
			array_push($col,"{$column->name} {$type}{$len} {$column->modificators} ");
		}
		$col = '(' . implode(',',$col) . ')';
		$res = $this->db->query("CREATE TABLE {$this->name} {$col};");
		if(is_array($res)){
			foreach($columns as $column){
				$column->db_table = $this;
			}
			return true;
		}
//		$res = array(array_flat($res));
		return false;
	//	CREATE TABLE t1 (a INTEGER,b CHAR(10));
	}
	function change_name($new_table_name){
		$res = $this->db->query("ALTER TABLE {$this->name} RENAME {$new_table_name};");
		if(is_array($res)){
			$this->name = $new_table_name;
			return true;
		}
		return false;
	//	ALTER TABLE t1 RENAME t2;
	}
	function del(){
		return is_array($this->db->query("DROP TABLE IF EXISTS {$this->name};"));
	//	DROP TABLE t1 ;
	}
	function clear(){
		return is_array($this->db->query("TRUNCATE TABLE {$this->name};"));
	//	TRUNCATE TABLE t1 ;
	}
	function exist(){
		return is_array($this->db->query("SHOW TABLES LIKE '{$this->name}';"));
	}
}
class DB_COLUMN_TYPE{
	const VARCHAR	= 0;
	const INT		= 1;
	const TEXT		= 2;
	const DATE		= 3;
	const TIMESTAMP	= 4;
	
	const names = ['VARCHAR', 'INT', 'TEXT', 'DATE', 'TIMESTAMP'];
	static function name($enum){
		return DB_COLUMN_TYPE::names[$enum];
	}
}
class DB_COLUMN{
	
	public $name		 = '';
	public $type 		 = DB_COLUMN_TYPE::VARCHAR;
	public $length		 = 64;
	public $modificators = '';
	public $primary		 = false;
	public $db_table	 = null;
	
	
	function __construct(string $cname, int $ctype = null, int $clength = null, string $cmodificators = null, DB_TABLE $table = null){
		if(!is_null($table)){	$this->db_table		= $table;	}
		if(!is_null($cname)){	$this->name 		= $cname;	}
		if(!is_null($ctype)){	$this->type 		= $ctype;	}
		if(!is_null($clength)){	$this->length 		= $clength;	}
		if(!is_null($cmodificators)){	$this->modificators	= $cmodificators;	}
	}
	
	function add($afterColumn = null){
		$result = DB_COLUMN::ALTER_TABLE(['action'=>'ADD', 'db_column'=> $this, 'insert'=>$afterColumn]);
		return $result;
	}
	function change($newName = null, $afterColumn = null){
		if(is_null($newName)){
			$result = DB_COLUMN::ALTER_TABLE(['action'=>'MODIFY', 'db_column'=> $this, 'insert'=>$afterColumn]);
		}else{
			$result = DB_COLUMN::ALTER_TABLE(['action'=>'CHANGE', 'db_column'=> $this, 'insert'=>$afterColumn, 'newName'=>$newName]);
		}
		return $result;
	}
	function del(){
		$result = DB_COLUMN::ALTER_TABLE(['action'=>'DROP', 'db_column'=> $this]);
		return $result;
	}
	
	function getInfo(){
		$db = $this->db_table->db;
		$res = $db->query("SHOW COLUMNS FROM objects LIKE '{$this->name}';");

		$header = ['Field','Type','Null','Key','Default','Extra'];
		if(is_array($res)){
			$res = array_flat($res);
			$this->name = $res[0];
			$this->type = preg_replace('/(\w+)\(\d+\)/',"$1",$res[1]);
			$this->length = preg_replace('/\w+\((\d+)\)/',"$1",$res[1]);
			$key = '';
			$key = $key . ($res[3]==='PRI' ? 'PRIMARY KEY ' : '');
			$key = $key . ($res[3]==='UNI' ? 'UNIQUE ' : '');
			$this->modificators = ($res[2]==='NO' ? 'NOT NULL ' : '').$key.($res[4]==='NULL'?'':"DEFAULT '{$res[4]}' ").$res[5];
		}
	//	SHOW COLUMNS FROM objects Like 'name'
	}
	
	
	static function ALTER_TABLE($hash=[]){
		$dbase = null;
		$db_table = null;
		
		$action = '';
		varArr($hash,'action',$action);
		
		$columnName 	= '';
		$type 			= DB_COLUMN_TYPE::VARCHAR;
		$columnLength 	= 64;
		$modificators	= '';
		
		if(varArr($hash,'db_column',$col)){
			$columnName 	= $col->name;
			$type 			= $col->type;
			$columnLength 	= $col->length;
			$modificators 	= $col->modificators;
			$db_table		= $col->db_table;
		}
		varArr($hash, 'columnName',		$columnName);
		varArr($hash, 'type',			$type);
		varArr($hash, 'columnLength',	$columnLength);
		varArr($hash, 'modificators',	$modificators);
		
		$type = DB_COLUMN_TYPE::name($type);
		
		$newName = '';
		varArr($hash, 'newName',		$newName);
		
		$insert = '';
		if(varArr($hash, 'insert',			$insert)){
			if($insert === true || $insert =='FIRST'){
				$insert = 'FIRST';
			}else{
				$insert = "AFTER {$insert}";
			}
		}
		
		$table_name = '';
		if(is_null($db_table)){	varArr($hash,'db_table',$db_table);	}
		varArr($hash,'table_name',$table_name);
		$table_name = $db_table->name;
		
		
		if(!is_null($db_table)){ $db = $db_table->db; }
		varArr($hash,'db',$db);
		
		
		if(is_null($db)){	trigger_error("Database not found", E_USER_ERROR);	}
		if($table_name === ''){	trigger_error("Table name not found", E_USER_ERROR); }
		if($action === ''){	trigger_error("Action not found", E_USER_ERROR); }
		
		//if($table_name === ''){	trigger_error("Table name not found", E_USER_ERROR); }
		$res = false;
		switch($action){
			case 'CHANGE':
				$res = $db->query("ALTER TABLE {$table_name} {$action} COLUMN {$columnName} {$newName} {$type}({$columnLength}) {$modificators} {$insert};");
			break;
			case 'ADD':
			case 'MODIFY':
				$res = $db->query("ALTER TABLE {$table_name} {$action} COLUMN {$columnName} {$type}({$columnLength}) {$modificators} {$insert};");
			break;
			case 'DROP':
				$res = $db->query("ALTER TABLE {$table_name} {$action} COLUMN {$columnName};");
			break;
		}
		return is_array($res);
		
		
//	ALTER TABLE table_name CHANGE COLUMN 	column_name new_name	column_definition [ FIRST | AFTER column_name2 ]
//	ALTER TABLE table_name ADD [COLUMN] 	column_name 			column_definition [ FIRST | AFTER column_name2 ];
//	ALTER TABLE table_name MODIFY 			column_name 			column_definition [ FIRST | AFTER column_name2 ];
//	ALTER TABLE table_name DROP COLUMN 		column_name;
		
	}
}

*/




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
  }else if(params[0]=='/db'){
	

	var query = "SELECT version();";
	//var query = 'SELECT table_schema,table_name FROM information_schema.tables;'
	
	console.log(db.query(query,"",function(err,result){
	  for (let row of result.rows) {
		  
		res.write(JSON.stringify(row));
	  }
	  db.client.end();
	  res.end("");
	}));
//	res.end("");
  } else {
    // иначе считаем это запросом к обычному файлу и выводим его
    file.serve(req, res); // (если он есть)
  }

//  res.end("OK");
}

var PORT = process.env.PORT || 80;
console.log("Server start at port "+PORT);
http.createServer(accept).listen(PORT);
