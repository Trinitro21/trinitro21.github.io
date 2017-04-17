//Useful functions for dealing with SmileBASIC files
//some tailored to the format used for SBtools pages

//given SBtools page, downloads Uint8Array file as a file named n
function downloadfile(file,n){
	var z = new Blob([file], {"type":"octet/stream"});
	document.getElementById("dl").href=URL.createObjectURL(z);
	document.getElementById("dl").download=n;
	if(!!navigator.msSaveBlob){
		navigator.msSaveBlob(z, n);
		return;
	}
	document.getElementById("dl").click();
}
//converts a character from hex to decimal
function hex(st){
	return "0123456789ABCDEF".indexOf(st);
}
//takes a string of bytes in hex and inserts them into the file
//it takes the same format that copying/pasting from HxD gives
function hextoarray(s,pos){
	for(i=0;i<=(s.length-2)/3;i++){
		file[i+pos]=(hex(s.substring(i*3,i*3+1))*16+hex(s.substring(i*3+1,i*3+2)));
	}
}
//gets a binary number with 1s at the specified range
function getAnd(start,end){
	var num=0;
	for(var i=start;i<=end;i++){
		num+=Math.pow(2,i);
	}
	return num;
}
//reads a sint32
function readint(start){
	var number=readnum(start,start+3) & (Math.pow(2,32)-1);
	return number;
}
function insertint(num,start){
	if(num<0){num=Math.pow(2,32)+num;}
	insertnum(num,4,start);
}
//reads a double
function readreal(start){
	var buffer=new ArrayBuffer(8);
	var intvalue=new Uint32Array(buffer);
	var floatvalue=new Float64Array(buffer);
	intvalue[0]=readnum(start,start+3);//set lower bytes
	intvalue[1]=readnum(start+4,start+7);//upper bytes
	return floatvalue[0];
}
function insertreal(num,start){
	var buffer=new ArrayBuffer(8);
	var intvalue=new Int32Array(buffer);
	var floatvalue=new Float64Array(buffer);
	floatvalue[0]=num;
	insertnum(intvalue[0],4,start);
	insertnum(intvalue[1],4,start+4);
}
//reads a number from a file
function readnum(start,end){
	var number=0;
	for(var i=start;i<=end;i++){
		number+=Math.pow(256,(i-start))*file[i];
	}
	return number;
}
//inserts a number into a file, padding with zeroes
function insertnum(num,length,pos){
	for(var i=0;i<length;i++){
		file[i+pos]=(num & 255);
		num=(num-(num & 255))/256;
	}
}
//reads a string from a file
function readstring(start,end){
	var stri="";
	for(var i=start;i<=end;i++){
		if(file[i]!=0){stri=stri+String.fromCharCode(file[i]);}
	}
	return stri;
}
//inserts a string into a file, padding with String.fromCharCode(0)
function inserttext(text,length,pos){
	while(text.length<length){
		text=text+String.fromCharCode(0);
	}
	if(text.length>length){
		text=text.substring(0,length);
	}
	for(var i=0;i<text.length;i++){
		file[i+pos]=text.charCodeAt(i);
	}
}
//gets an item in a DAT file given the type of the file, a 1D array containing its dimensions, and a 1D array containing the indexes
function getdatnum(type,dim,ind){
	var size=(type=="col"?2:(type=="int"?4:(type=="real"?8:"unk")));
	if(size=="unk"){return "Error";}
	
	var index=ind[ind.length-1]*size;
	if(dim.length>1){
		index+=ind[ind.length-2]*size*dim[dim.length-1];
		if(dim.length>2){
			index+=ind[ind.length-3]*size*dim[dim.length-1]*dim[dim.length-2];
			if(dim.length>3){
				index+=ind[ind.length-4]*size*dim[dim.length-1]*dim[dim.length-2]*dim[dim.length-3];
			}
		}
	}
	if(type=="col"){
		var rgb=readnum(108+index,108+index+size-1);
		var out={
			red:((rgb & getAnd(11,15))/Math.pow(2,11))*255/31,
			green:((rgb & getAnd(6,10))/Math.pow(2,6))*255/31,
			blue:((rgb & getAnd(1,5))/Math.pow(2,1))*255/31,
			alpha:(rgb & 1)*255
		};
	}else if(type=="int"){
		var out=readint(108+index);
	}else if(type=="real"){
		var out=readreal(108+index);
	}
	return out;
}
//sets an item in a DAT array
function setdatnum(value,type,dim,ind){
	var size=(type=="col"?2:(type=="int"?4:(type=="real"?8:"unk")));
	if(size=="unk"){return "Error";}
	
	var index=ind[ind.length-1]*size;
	if(dim.length>1){
		index+=ind[ind.length-2]*size*dim[dim.length-1];
		if(dim.length>2){
			index+=ind[ind.length-3]*size*dim[dim.length-1]*dim[dim.length-2];
			if(dim.length>3){
				index+=ind[ind.length-4]*size*dim[dim.length-1]*dim[dim.length-2]*dim[dim.length-3];
			}
		}
	}
	if(type=="col"){
		var out=Math.floor(value.red*31/255)*Math.pow(2,11)+Math.floor(value.green*31/255)*Math.pow(2,6)+Math.floor(value.blue*31/255)*2+Math.floor(value.alpha/255)
		insertnum(out,2,108+index);
	}else if(type=="int"){
		insertint(value,108+index);
	}else if(type=="real"){
		insertreal(value,108+index);
	}
}
