function getNewId(){
	ajax("/server?newid",null,function(elem,response){
		var hash = to_hash(response);
		if(!!hash["SessionId"]){
			setNewId(hash["SessionId"]);
		}
	});
}
function setNewId(newSid){
	var d = new Date;
	d.setHours(d.getHours() + 1);
	document.cookie = "session="+newSid+"; expires="+d;
	console.log("newSid "+newSid);
}
function updateId(){
	var d = new Date();
	d.setHours(d.getHours() + 1);
	var hash = to_hash(document.cookie);
	if(!!hash["session"]){
		document.cookie = "session="+hash["session"]+"; expires="+d;
//		console.log("updateSid "+hash["session"]);
	}
}

var last_connection_success;
function last_connected(){
	return Date.now()-last_connection_success;
}


function ajax(url,elem,onReady){
	var xmlhttp;
	try {
		xmlhttp = new ActiveXObject("Msxml2.XMLHTTP");
	} catch (e) {
		try {
			xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
		} catch (E) {
			xmlhttp = false;
		}
	}
	if (!xmlhttp && typeof XMLHttpRequest!='undefined') {
		xmlhttp = new XMLHttpRequest();
	}

	xmlhttp.onreadystatechange = function() {  
		if (xmlhttp.readyState == 4) {
			//xmlhttp.statusText
			if(xmlhttp.status == 200) {
				updateId(); 
//console.log(">>"+xmlhttp.responseText);
				last_connection_success = Date.now();
			
				onReady(elem, xmlhttp.responseText);
				
			}else{
//console.log("ajax error:"+xmlhttp.statusText);
			}
		}
	}
//	console.log(url);								
	xmlhttp.open('GET', url, true);  
	xmlhttp.send(null);
	return xmlhttp;
}