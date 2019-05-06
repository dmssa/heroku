<html>
	<head>
		<link rel="shortcut icon" href="/images/favicon.ico" type="image/x-icon">
		<style>
body{
	margin:0px;
	padding:0px;
	overflow:hidden;
}
#time
{
width:100%;
text-aligh:center;
}
#menu
{
float:right;
width:120px;
background:#eee;
margin-left:-120px;
height:100%;
}
#window
{
background:#eee;
margin-right:120px;
height:100%;
}
#window_wrap
{
float:left;
width:100%;
}
		</style>
		<script src="/script/ajax.js" ></script>
<script>

 
function to_kv(string, separator)
{
	var arr = string.split(separator);
	return {"key":arr[0],"value":arr[1]==null?"":arr[1]};
}


class DateToText{
  constructor(){
	  this.time;
	  this.time_div;	// элемент для отображения времени
	  this.time_int;	// Интервал обновлений
	  this.time_counter = 61; // Счётчик обновления с ардуино
	  this.time_nano = 60;// Обновляем с ардуино раз в 60 обращений (time_nano*период setInterval) 

	  this.year  = 0;
	  this.month = 1;
	  this.day   = 1;
	  this.hour  = 0;
	  this.min   = 0;
	  this.sec   = 0;
	  
	  this.format="hh:mm$ss dd/MM/yyyy";
	  this.year_days = [31,28,31,30,31,30,31,31,30,31,30,31];
  }
  fix(){
    while(this.sec < 0){
      this.sec += 60;
      this.min--;
    }
    while(this.sec >= 60){
      this.sec -= 60;
      this.min++;
    }
    
    while(this.min < 0){
      this.min += 60;
      this.hour--;
    }
    while(this.min >= 60){
      this.min -= 60;
      this.hour++;
    }

    while(this.hour < 0){
      this.hour += 24;
      this.day--;
    }
    while(this.hour >= 24){
      this.hour -= 24;
      this.day++;
    }
    
    while(this.month<1){
      this.month +=12;
      this.year--;
    }
    while(this.month>12){
      this.month -=12;
      this.year++;
    }
    
    var days_in_month;
    while(this.day < 1){
      this.month--;
      if(this.month < 1){
        this.month += 12;
        this.year--;
      }
      days_in_month = this.year_days[this.month-1]+((this.month==2 && this.year%4==0)?1:0);
      this.day += days_in_month;
    }
    days_in_month = this.year_days[this.month-1]+((this.month==2 && this.year%4==0)?1:0);
    while(this.day > days_in_month){
      days_in_month = this.year_days[this.month-1]+((this.month==2 && this.year%4==0)?1:0);
      this.day -= days_in_month;
      this.month++;
      if(this.month > 12){
        this.month -= 12;
        this.year++;
      }
    }
  }
  toText(){
    var result="";
    var currChr = ' ';
    var chrCount = 0;
    var len = this.format.length;
    var str="";
    for(var i=0;i<=len;i++){
      var chr = this.format[i];
	
      switch(chr){
        case 'h':
        case 'm':
        case 's':
        case 'd':
        case 'M':
        case 'y':
          if(currChr == chr){            
            chrCount++;
          }else{
            if(currChr != ' '){
              result += this.getByFormat(currChr,chrCount);
            }
            currChr = chr;
            chrCount = 1;
          }
        break;
        default:
          if(currChr != ' '){
            result += this.getByFormat(currChr,chrCount);
            currChr=' ';
            chrCount=0;
          }
          if(chr=='$'){
            if(this.sec%2==0){
              str=':';
            }else{
              str=' ';
            }
          }else{
			str=chr?chr:"";
            
          }
          result+=str;
        break;
      }
    }
    return result;
  }
  fromText(text){
    var currChr = ' ';
    var chrCount = 0;
    var len = this.format.length;
    var str_len = text.length;
    var str="";
    for(var i=0;i<=len && i<=str_len;i++){
      var chr = this.format[i];
      switch(chr){
        case 'h':
        case 'm':
        case 's':
        case 'd':
        case 'M':
        case 'y':
          if(currChr == chr){            
            chrCount++;
          }else{
            if(currChr != ' '){
              this.setByFormat(text,currChr,chrCount,i-chrCount);
            }
            currChr = chr;
            chrCount = 1;
          }
        break;
        default:
          if(currChr != ' '){
            this.setByFormat(text,currChr,chrCount,i-chrCount);
            currChr=' ';
            chrCount=0;
          }
          str=chr?chr:"";
        break;
      }
    }
    this.fix();
  }
  now(){
	var t =  new Date();
	this.time = t;
	this.hour = t.getHours();
    this.min = t.getMinutes();
    this.sec = t.getSeconds();
    this.day  = t.getDate();
    this.month = t.getMonth()+1;
    this.year = t.getFullYear();
  }
  getByFormat(chr,chrCount){
	
    var result = "";
    var number;
    switch(chr){
      case 'h':
        number = this.hour;
      break;
      case 'm':
        number = this.min;
      break;
      case 's':
        number = this.sec;
      break;
      case 'd':
        number = this.day;
      break;
      case 'M':
        number = this.month;
      break;
      case 'y':
        number = this.year;
      break;
      default:
        return result;
      break;
    }
    
    var numbers = [];
    for(var i=0;i<chrCount;i++){
      numbers[chrCount-i-1] = number%10;
      number = parseInt(number / 10);
    }
    
	for(var i=0;i<chrCount;i++){
    	result+=numbers[i];
    }
    return result;
  }
  setByFormat(text,chr,chrCount,index){
    var t=[];
	t=text.substring(index,index+chrCount);
    
    var number = Number(t);
    
    switch(chr){
      case 'h':
        this.hour = number;
      break;
      case 'm':
        this.min = number;
      break;
      case 's':
        this.sec = number;
      break;
      case 'd':
        this.day  = number;
      break;
      case 'M':
        this.month = number;
      break;
      case 'y':
        this.year = number;
      break;
    }
  }
  equals(date){
  
	if(this.format.includes('h')&&this.hour!=date.hour)return false;
	if(this.format.includes('m')&&this.min!=date.min)return false;
    if(this.format.includes('s')&&this.sec!=date.sec)return false;
    if(this.format.includes('d')&&this.day!=date.day)return false;
    if(this.format.includes('M')&&this.month!=date.month)return false;
    if(this.format.includes('y')&&this.year!=date.year)return false;
	return true;
  }

	refresh()
	{
//		this.now();
		this.sec+1;
		this.fix();
		if(this.time_counter > this.time_nano){
			self=this;
			ajax("/com?timefmt",null,function(elem,result){
				var kv = to_kv(result,"=");
				if(kv.key=="timefmt"){
					self.timefmt=kv.value;
					ajax("/com?time",null,function(elem,result){

						var kv = to_kv(result,"=");
console.log(kv);
						if(kv.key=="time"){
							
							var d1 = new DateToText();
							d1.format = self.format;
							d1.fromText(kv.value);
//console.log(self.toText());
//console.log(d1.toText());						
							if(!self.equals(d1)){
								self.fromText(kv.value);
//								ajax("/com?time="+self.toText(),null,function(){ });	
							}
						}
					});			
				}
			});
			
			this.time_counter=0;
		}else{
		
			this.time_counter++;
		}
		if(this.time_div){
			this.time_div.innerHTML = this.toText();
		}
	}
};


//"/com"
var stream_int;
var state_div;
function com_stream()
{
	if(last_connected()>2000)
	{
		state_div.style["background"]="red";
	}
	ajax("/com",state_div,function(elem,response)
	{
		var d;
		var n;
		var args = response.split("&");
		for(var i=0;i<args.length;i++)
		{
			kv = to_kv(args[i],"=");
			switch(kv.key)
			{
				case "connection":
					if(elem){
						if(kv.value=="1")
						{
							elem.style["background"]="green";
						}else
						{
							elem.style["background"]="red";
						}
					}
				break;
				case "n":
					n=parseInt(kv.value);
				break;
				case "d":
					d=parseInt(kv.value);
				break;
				case "state":
					table_row();
					table.addRow();
				break;
				
			}
		}
		
	});
}
var client_date;
function init()
{
	client_date = new DateToText();
	client_date.time_div = document.getElementById("time");
	client_date.time_int = setInterval(function(){client_date.refresh()},1000);

	state_div = document.getElementById("connection");
	stream_int = setInterval(com_stream,1000);
}
function table_row(_date,_message,_urgency){
	return {
		date:_date,
		message:_message,
		state:_urgency
	};
}
var table=
{
	elem:document.getElementById("log"),
	addRow:function(tr){
		
	},
	addRowAt:function(tr,pos){
		
	}
}


</script>
	</head>
	<body onload="init()">
		<div id="window_wrap">
			<div id="window">
		
		
				<table cellspacing="0" border="1 solid black" id="log" style="width:100%;">
					<tr>
						<td class="t_time">Время</td>
						<td class="t_events">Событие</td>
						<td class="t_urgency">Важность</td>
					</tr>
				</table>

				<div class="nasos" id="n1" style="width:15%">
					
					<div id="name1">Насос1</div>
					<img src="/images/95112930.jpg" style="width:100%" alt="">
					<div>Состояние:
						<div id="state1">
						</div>
					</div>
				</div>
			</div>
		</div>
		</div>
		</div>
		
		<div id="menu">
			<div style="height:20px;width:100%;background:grey;" id="connection">
			</div>
			<div id="time"></div>
		</div>

		
		<div id="n2"></div>
		<div id="n3"></div>
		<div id="n4"></div>
		<div id="n5"></div>
	</body>
</html>












