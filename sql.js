/*

  jSQL - JavaScript/JSON to MySQL Bridge
   Version: 0.2 (Preliminary)
   Date: 11/2012

 WARNING - USE AT YOUR OWN RISK
 
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
  db.table(document.getElementById("table").value); // table name
  var result = db.select(query, function(reply) {
    document.getElementById("output").innerHTML = (JSON.stringify(reply));
  });

SQL Example:
  var db = new SQL(connection);
  var query = "SELECT * FROM iDirectory.Employee WHERE (FirstName = \"Andy\" AND LastName = \"Mandin\") OR (FirstName = \"Jeffory\") OR (FirstName = \"Richord\")";
  var result = db.query(query, function(reply) {
    document.getElementById("output").innerHTML = (JSON.stringify(reply));
  });

*/

function SQL(login) {
  this.login = login;
}

SQL.prototype.query = function (query, callback) {
  SQLrequest(query, this.login, callback);
}

// POST REQUEST ONLY / GET REQUEST in the FUTURE
function SQLrequest (query, login, callback) {
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
    if(json) { // TODO
      var post = "{"; // start of json
      for (index in login){
        post += index + ":\"" + encodeURIComponent(login[index]) + "\","; //encodeURIComponent(login[index]);
      }
      post += "query:\"" + encodeURIComponent(query) + "\"";
      post += "}"; // end of json
    } 
    else {
      var post = "";
      for (index in login){
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

/*
http://dev.mysql.com/doc/refman/5.6/en/select.html
*/

SQL.prototype.table = function(table) {
  this.table = table;
}

/*
  This function is used to create the WHERE clause for the SQL query
  BUG: [{"FirstName" : ["a", "b", "c", "d"], "LastName" : "f"}]
*/

var JSON2SQL = function (query) {
  var sql_string = "";
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
          sql_string += field + " = " + element;
        }
        else {
          sql_string += field + " = " + element + " AND ";
        }
      } 
      else { // OR LOGIC (multiple elements)
        sql_string += "(";
        for(var findex = 0; findex < query[index][field].length; findex++){
          var data = query[index][field][findex];
          var element = typeof data == "string" ? "\"" + data + "\"" : data.toString();
            if(findex+1 == query[index][field].length) {
              sql_string += field + " = " + element; // last element
            } 
            else {
              sql_string += field + " = " + element + " OR ";
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

/*
  takes in an object and creates a string to be parsed by SQL
*/

var SQL_set = function (obj) {
  var sql = "";
  var value = "";
  for(var element in obj) {
    sql += "\"" + element + "\"=";
    value = typeof obj[element] == "string" ? "\"" + obj[element] + "\" " : obj[element].toString() + " ";
    sql += value;
  }
}

// http://dev.mysql.com/doc/refman/5.6/en/select.html
// NOTE: SQL.select = SQL.find
SQL.prototype.find = function(query, callback){
  var sql_string = "";
  var fields = null;
  if(fields == null) { // select all by default
    sql_string = "SELECT * FROM " + this.table + " WHERE " + JSON2SQL(query);
  }
  else {
    var selectors = "SELECT ";
    for(var index = 0; index < fields.length; index++){
      selectors += "\"" + fields[index] + "\" ";
    }
    sql_string = selectors + "FROM " + this.table + " WHERE " + JSON2SQL(query);
  }
  SQLrequest(sql_string, this.login, callback);
};

SQL.prototype.select = SQL.prototype.find;

// http://dev.mysql.com/doc/refman/5.6/en/update.html
SQL.prototype.update = function(fields, where, callback) {
  var sql_string = "";
  sql_string += "UPDATE " + this.table + " SET " + SQL_set(fields) + "WHERE " + JSON2SQL(where);
  SQLrequest(sql_string, this.login, callback);
};

// http://dev.mysql.com/doc/refman/5.6/en/insert.html
SQL.prototype.insert = function(fields, callback) {
  var sql_string = "";
  sql_string += "INSERT INTO " + this.table + " SET " + SQL_set(fields);
  SQLrequest(sql_string, this.login, callback);
};

// http://dev.mysql.com/doc/refman/5.6/en/delete.html
// WARNING
SQL.prototype.delete = function(query, callback) {
  var sql_string = "";
  sql_string += "DELETE FROM " + this.table + " WHERE " + JSON2SQL(query);
  SQLrequest(sql_string, this.login, callback);
};