/*

  jSQL - JavaScript/JSON to MySQL(i) Bridge
   Version 5.0 (API Change from SQL.select(query) to SQL.select(table, query))
   Date: 11/2012
 
  NOTE: Requires SSL/HTTPS/ENCRYPTION (a future version should encrypt the login info)

JSON Example:
  var login = {username : username, password : password, hostname : hostname, fetch : "object"};
  var db = new SQL(login);
  var query = [{FirstName : "Andy", LastName : "Mandin"}, {FirstName : ["Jeffory", "Richord"]}];
  var table = document.getElementById("table").value; // table name
  var result = db.all(table, query, function(reply) {
    document.getElementById("output").innerHTML = (JSON.stringify(reply));
  });

SQL Example:
  var login = {username : username, password : password, hostname : hostname, fetch : "object"};
  var db = new SQL(login);
  var query = "SELECT * FROM iDirectory.Employee WHERE (FirstName = \"Andy\" AND LastName = \"Mandin\") OR (FirstName = \"Jeffory\") OR (FirstName = \"Richord\")";
  var result = db.query(query, function(reply) {
    document.getElementById("output").innerHTML = (JSON.stringify(reply));
  });

JSON:
    A OR B OR C : [{a:"a"},{b:"b"}.{c:"c"}]
    A AND B AND C : [{a:"a", b:"b", c:"c"}]

SQL:
  SELECT * FROM table WHERE (LastName = "Maddorsin" OR LastName = "Shorpe") AND FirstName = "Andy"
    var query = [{LastName : ["Maddorsin", "Shorpe"], FirstName = "Andie"}];
  
  SELECT * FROM table WHERE LastName = "Clovour" AND FirstName = "Richord"
    var query = [{LastName : "Clovour", FirstName = "Richord"}];
  
  SELECT * FROM table WHERE LastName = "Clovour" OR FirstName = "Richard"
    var query = [{LastName : "Clovour"}, {FirstName = "Richord"}];
  
  SELECT * FROM table WHERE LastName = "Goldandstien" AND FirstName = "Shianda"
    var query = [{LastName : "Goldandstien", FirstName : "Shianda"}]; 

*/

/* 
Notes on Global Default Values and Settings:
     Remember your password is visable to EVERYONE!!! it might be better to specify it in the PHP file
     However, if you specify something below it will over-ride php and everything else.
*/

function SQL(login) {
  if(login == null){
    // DEFAULT VALUES
    login = { username : "", // its better to pass this in as a variable
              password : "", // remember the passwords are not encrypted unless your connection is
              hostname : "localhost",
              database : "", // Please keep this as "" unless you really know what you are doing!
              fetch : "object"}; // objects look nice its best to keep this as an object however if you want a speed up specify this as "row"
  }
  this.login = login;
}

SQL.prototype.query = function (query, callback) {
  SQLHttpRequest(query, this.login, callback);
}

// SQLHttpRequest Post Request
// TODO: full binary JSON transfers using the reply packet http.responseJSON or .responseXML
function SQLHttpRequest (query, login, callback) {
  var async;
  if(callback) {
    async = true; // try and use the callback function
  } 
  else {
    async = false; 
  }
  var http;
  var uri = "sql.php";
  if (window.XMLHttpRequest) {// code for IE7+, Firefox, Chrome, Opera, Safari
    http = new XMLHttpRequest();
  }
  else {// code for IE6, IE5
    http = new ActiveXObject("Microsoft.XMLHTTP");
    }
    http.onreadystatechange = function(){ // async reply code
      if (http.readyState==4 && http.status==200 && async) {
          callback(JSON.parse(http.response));
      }
    }
  if(query != null){ 
    http.open("POST", uri, async); 
    var post = ""; // Next we are setting up a POST request with the data being URI encoded
    for (var index in login){ // NOTE: this data should really be encrypted!!!
      post += index + "=" + encodeURIComponent(login[index]) + "&";
    }
    post += "query=" + encodeURIComponent(query);
    http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    http.setRequestHeader("Content-length", post.length);
    http.setRequestHeader("Connection", "close");
    /* NOTE: if you want to customize the POST request packet you will need to update the sql.php file otherwise 
       database should typically be "" unless you really know what you are doing (just specify it in the table name in the query)
          post = database=""&fetch="assoc"&hostname="localhost"&password=""&username=""&query="SELECT * FROM Database.Table"
    */
    http.send(post);
    if(!async) {
      return JSON.parse(http.response);
    }
    else {
      return true;
    }
  }
  return false; // null or bad query or error
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

var SQL_SET_FIELDS = function (obj) {
  var sql_string = "";
  var value = "";
  for(var element in obj) {
    sql_string += element + "=";
    value = typeof obj[element] == "string" ? "\"" + obj[element] + "\" " : obj[element].toString() + " ";
    sql_string += value;
  }
  return sql_string;
}

var SQL_SELECT_FIELDS = function (fields) {
  var sql_string = "";
  var value = "";
  if(typeof fields != "string"){ // is it just one string name?
    if(typeof fields[0] == "string"){ // then its an array 
      for(var field = 0; field < fields.length; field++) {
        sql_string += fields[field] + ", ";
      }
      sql_string = sql_string.slice(0, [sql_string.length-2]); // erase the last ,
    } 
    else {
      for (var field in fields){ // index through the object but dont use the values just the field names
        sql_string += field + ", ";
      }
      sql_string = sql_string.slice(0, [sql_string.length-2]); // erase the last ,
    }
  } else { // only one element
    sql_string = fields;
  }
  return sql_string;
}

// http://dev.mysql.com/doc/refman/5.6/en/select.html
SQL.prototype.all = function(table, query, callback){
  var sql_string = "";
  if(query){
    sql_string = "SELECT * FROM " + table + " WHERE " + SQL_WHERE(query);
  } 
  else {
    sql_string = "SELECT * FROM " + table;
  }
  SQLHttpRequest(sql_string, this.login, callback);
};

// http://dev.mysql.com/doc/refman/5.6/en/select.html
SQL.prototype.select = function(fields, table, query, callback){
  var sql_string = "";
  if(query){
    sql_string = "SELECT " + SQL_SELECT_FIELDS(fields) + " FROM " + table + " WHERE " + SQL_WHERE(query);
  } 
  else {
    sql_string = "SELECT " + SQL_SELECT_FIELDS(fields) + " FROM " + table;
  }
  SQLHttpRequest(sql_string, this.login, callback);
};

SQL.prototype.find = SQL.prototype.select;

// http://dev.mysql.com/doc/refman/5.6/en/update.html
SQL.prototype.update = function(table, fields, where, callback) {
  var sql_string = "";
  sql_string += "UPDATE " + table + " SET " + SQL_SET_FIELDS(fields) + "WHERE " + SQL_WHERE(where);
  SQLHttpRequest(sql_string, this.login, callback);
};

// http://dev.mysql.com/doc/refman/5.6/en/insert.html
SQL.prototype.insert = function(table, fields, callback) {
  var sql_string = "";
  sql_string += "INSERT INTO " + table + " SET " + SQL_SET_FIELDS(fields);
  SQLHttpRequest(sql_string, this.login, callback);
};

// http://dev.mysql.com/doc/refman/5.6/en/delete.html
SQL.prototype.delete = function(table, query, callback) {
  var sql_string = "";
  sql_string += "DELETE FROM " + table + " WHERE " + SQL_WHERE(query);
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

// http://www.php.net/manual/en/function.mysql-list-tables.php
SQL.prototype.status = function(callback) {
  var sql_string = "";
  sql_string += "SHOW DATABASES";// + " WHERE " + SQL_WHERE(query);
  if(callback == null){ // do a syncronous check of the databases tables
    var db = SQLHttpRequest(sql_string, this.login, callback, false);
    if(db.error) {
      return db;
    } 
    else {
      return true;
    }
  }
  return SQLHttpRequest(sql_string, this.login, callback);
};

// http://www.w3schools.com/sql/sql_datatypes.asp
// http://ecma262-5.com/ELS5_HTML.htm#Section_8.5
// https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Operators/typeof
// http://en.wikipedia.org/wiki/Double_precision_floating-point_format
// VERY PRELIMINARY DO NOT USE!
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
// VERY PRELIMINARY DO NOT USE! (only create database is maybe ok)
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
