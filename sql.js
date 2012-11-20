/*

  jSQL - JavaScript/JSON to MySQL Bridge
   Version: 3.5 (MySQLi & MySQL)
   Date: 11/2012
 
  NOTE: Requires SSL/HTTPS/ENCRYPTION (a future version should encrypt the login info)
  
 TODO: This version only supports POST request because I was a little worried about server logs having details of each GET request
       This protects customer privacy somewhat... its a work in progress to keep improving privacy/encryption.

 TODO: Testing for JSON / DELETE / INSERT / UPDATE / AND... OR LOGIC

Examples:

    A OR B OR C : [{a:"a"},{b:"b"}.{c:"c"}]
    A AND B AND C : [{a:"a", b:"b", c:"c"}]

SELECT * FROM table WHERE (LastName = "Maddorsin" OR LastName = "Shorpe") AND FirstName = "Andy"
  var query = [{LastName : ["Maddorsin", "Shorpe"], FirstName = "Andie"}];

SELECT * FROM table WHERE LastName = "Clovour" AND FirstName = "Richord"
  var query = [{LastName : "Clovour", FirstName = "Richord"}];

SELECT * FROM table WHERE LastName = "Clovour" OR FirstName = "Richard"
  var query = [{LastName : "Clovour"}, {FirstName = "Richord"}];

SELECT * FROM table WHERE LastName = "Goldandstien" AND FirstName = "Shianda"
  var query = [{LastName : "Goldandstien", FirstName : "Shianda"}]; 

SELECT * FROM table WHERE help = 1 AND days <= 30 AND days != 36
  var query = {help : 1, days : [{"<=" : 30}, {"!=" : 36}]}; // TODO CHECK FOR SYNTAX with two <='s 


JSON Example:
  var db = new SQL({username : username, password : password, hostname : hostname, database : database, fetch : fetch});
  db.table = document.getElementById("table").value; // table name
  var result = db.select(query, function(reply) {
    document.getElementById("output").innerHTML = (JSON.stringify(reply));
  });

SQL Example:
  var db = new SQL(login);
  var query = "SELECT * FROM iDirectory.Employee WHERE (FirstName = \"Andy\" AND LastName = \"Mandin\") OR (FirstName = \"Jeffory\") OR (FirstName = \"Richord\")";
  var result = db.query(query, function(reply) {
    document.getElementById("output").innerHTML = (JSON.stringify(reply));
  });

*/

function SQL(login) {
  if(login == null){
    // default values
    login = { username : "", 
              password : "", 
              hostname : "localhost", 
              database : "", 
              fetch : "object"};
  }
  this.table = null; // the table you want to select
  this.login = login;
}

SQL.prototype.query = function (query, callback) {
  SQLHttpRequest(query, this.login, callback);
}

// SQLHttpRequest Post Request 
function SQLHttpRequest (query, login, callback) {
  var json = false; // TODO?
  var http;
  var uri = "sql.php";
  if (window.XMLHttpRequest) {// code for IE7+, Firefox, Chrome, Opera, Safari
    http = new XMLHttpRequest();
  }
  else {// code for IE6, IE5
    http = new ActiveXObject("Microsoft.XMLHTTP");
    }
    http.onreadystatechange = function(){ // async reply code
      if (http.readyState==4 && http.status==200) {
          callback(JSON.parse(http.response));
      }
    }
  if(query != null){
    http.open("POST", uri, true); // async == true
    if(json) { // TODO - Experimental Future Code (for now urlencoded requests are maybe faster then JSON)
      var post = "{"; // start of json
      for (var index in login){
        post += index + ":\"" + encodeURIComponent(login[index]) + "\",";
      }
      post += "query:\"" + encodeURIComponent(query) + "\"";
      post += "}"; // end of json
    } 
    else { // POST Request to the URI using encodeURIComponent(query/login)
      var post = "";
      for (var index in login){ // TODO - double encrypt the login info
        post += index + "=" + encodeURIComponent(login[index]) + "&";
      }
      post += "query=" + encodeURIComponent(query);
    }
    if(json) { // JSON Encoded
      http.setRequestHeader("Content-type", "application/json"); 
    } else { // URI encoded
      http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    }
    http.setRequestHeader("Content-length", post.length);
    http.setRequestHeader("Connection", "close");
    http.send(post);
  }
}

var SQL_WHERE = function (query) {
  var sql_string = "";
  if(query[0] === undefined) {
    query = [query];
  }
  for (var index = 0; index < query.length; index++) {
    // each element in the array is part of OR logic
    sql_string += "(";
    var obj_size = 0;
    for (var size in query[index]){ // unfortunatly we need to count the objects first
      obj_size++;
    }
    var count = 0;
    for (var field in query[index]) {
    // each element in the object is part of the same AND logic
      var data = query[index][field];
      count++;
      if(typeof data == "string" || typeof data == "number") { // AND LOGIC (single element) / BUG with ["single"] 
        var element = typeof data == "string" ? "\"" + data + "\"" : data.toString();
        if(count == obj_size){
          sql_string += field + "=" + element;
        }
        else {
          sql_string += field + "=" + element + " AND ";
        }
      } 
      else { // OR LOGIC (multiple elements)
        sql_string += "(";
        for(var findex = 0; findex < query[index][field].length; findex++){
          var data = query[index][field][findex];
          var element = typeof data == "string" ? "\"" + data + "\"" : data.toString();
            if(findex+1 == query[index][field].length) {
              sql_string += field + "=" + element; // last element
            } 
            else {
              sql_string += field + "=" + element + " OR ";
            }
        }
        if(count == obj_size) {
          sql_string += ") "; // last object in that OR block
        } 
        else {
          sql_string += ") AND "; // there are still other objects
        }
      }
    }
    if(index+1 == query.length) {
      sql_string += ")"; // last OR element
    } 
    else {
      sql_string += ") OR ";
    }
  }
  return sql_string;
};

var SQL_FIELDS = function (obj) {
  var sql_string = "";
  var value = "";
  for(var element in obj) {
    sql_string += element + "=";
    value = typeof obj[element] == "string" ? "\"" + obj[element] + "\" " : obj[element].toString() + " ";
    sql_string += value;
  }
  return sql_string;
}

// http://dev.mysql.com/doc/refman/5.6/en/select.html
SQL.prototype.select = function(query, callback){
  var sql_string = "";
  if(query){
    sql_string = "SELECT * FROM " + this.table + " WHERE " + SQL_WHERE(query);
  } 
  else {
    sql_string = "SELECT * FROM " + this.table;
  }
  SQLHttpRequest(sql_string, this.login, callback);
};

SQL.prototype.find = SQL.prototype.select;

// http://dev.mysql.com/doc/refman/5.6/en/update.html
SQL.prototype.update = function(fields, where, callback) {
  var sql_string = "";
  sql_string += "UPDATE " + this.table + " SET " + SQL_FIELDS(fields) + "WHERE " + SQL_WHERE(where);
  SQLHttpRequest(sql_string, this.login, callback);
};

// http://dev.mysql.com/doc/refman/5.6/en/insert.html
SQL.prototype.insert = function(fields, callback) {
  var sql_string = "";
  sql_string += "INSERT INTO " + this.table + " SET " + SQL_set(fields);
  SQLHttpRequest(sql_string, this.login, callback);
};

// http://dev.mysql.com/doc/refman/5.6/en/delete.html
SQL.prototype.delete = function(query, callback) {
  var sql_string = "";
  sql_string += "DELETE FROM " + this.table + " WHERE " + SQL_WHERE(query);
  SQLHttpRequest(sql_string, this.login, callback);
};

// http://www.php.net/manual/en/function.mysql-list-fields.php
// Displays each column title in the table 
SQL.prototype.columns = function(table, callback) {
  var sql_string = "";
  sql_string += "SHOW COLUMNS FROM " + table;// + " WHERE " + SQL_WHERE(query);
  SQLHttpRequest(sql_string, this.login, callback);
};

SQL.prototype.fields = SQL.prototype.columns;
SQL.prototype.titles = SQL.prototype.columns;

// http://www.php.net/manual/en/function.mysql-list-tables.php
// Displays the tables in a database
SQL.prototype.tables = function(table, callback) {
  var sql_string = "";
  sql_string += "SHOW TABLES FROM " + table;// + " WHERE " + SQL_WHERE(query);
  SQLHttpRequest(sql_string, this.login, callback);
};

// http://www.php.net/manual/en/function.mysql-list-tables.php
SQL.prototype.dbs = function(callback) {
  var sql_string = "";
  sql_string += "SHOW DATABASES";// + " WHERE " + SQL_WHERE(query);
  SQLHttpRequest(sql_string, this.login, callback);
};

// http://www.w3schools.com/sql/sql_datatypes.asp
// http://ecma262-5.com/ELS5_HTML.htm#Section_8.5
// https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Operators/typeof
// http://en.wikipedia.org/wiki/Double_precision_floating-point_format
var SQL_DATATYPE = function (fields) {
  var sql_datatype_string = "";
	for(var index = 0; index < fields.length; index++) {
		var field = fields[index];
		switch(typeof field) {
		case "number":
			if(isInteger(field)) {
				sql_datatype_string += field + " " + "INT(64), ";
			} 
			else { // floating point (IEEE 754 double-precision binary 64)
				sql_datatype_string += field + " " + "FLOAT(11,52), ";
			}
			break;
		case "boolean":
				sql_datatype_string += field + " " + "BIT, ";
			break;
		case "object":
			/* 
			var json = JSON.encode(field);
			sql_datatype_string += json + " " + "varchar("+ json.length+255 +"), ";
			*/
			break;
		default: // "string";
			if(field.length < 255){
				sql_datatype_string += field + " " + "varchar(255), ";
			} 
			else {
				sql_datatype_string += field + " " + "varchar("+ field.length+255 +"), ";
			}
		}
	}
	sql_datatype_string[sql_datatype_string.length-1] = ")";
	return sql_datatype_string;
}

// http://www.php.net/manual/en/function.mysql-list-tables.php
SQL.prototype.create = {
	database : function(db, callback) {
		var sql_string = "";
		sql_string += "CREATE DATABASE " + db;
		SQLHttpRequest(sql_string, this.login, callback);},
  	table : function(table, fields, callback) {
		var sql_string = "";
		sql_string += "CREATE TABLE " + db + "(" + SQL_DATATYPE(fields) + ")";
		SQLHttpRequest(sql_string, this.login, callback);}
}