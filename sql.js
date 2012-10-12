// jSQL - JavaScript / MySQL Connection
// JavaScript 1.7 - ECMAScript 5th Edition (needs JSON.parse / JSON.stringify)
// NOTE: A future implementation should requre SSL/https for passwords
// TODO: This version only supports POST request because I was a little worried about server logs having details of each GET request
//       This protects customer privacy somewhat... its a work in progress to keep improving privacy/encryption.

/*
// Example:
  var connection = {username : "username", password : "password", hostname : "hostname", database : "database", fetch : "object"};
  var query = document.getElementById("query").value; // "SELECT FirstName FROM DataBase WHERE FirstName=MyName";
  var db = new jSQL(connection);
  var result = db.query(query, function(reply) {
    document.getElementById("output").innerHTML = (JSON.stringify(reply));
  });
*/

function Submit() {
  var username = document.getElementById("username").value;
  var password = document.getElementById("password").value; 
  var hostname = document.getElementById("hostname").value;
  var database = document.getElementById("database").value;
  var fetch = document.getElementById("fetch").value;
  var connection = {username : username, password : password, hostname : hostname, database : database, fetch : fetch};
  var query = document.getElementById("query").value;
  var db = new jSQL(connection);
  var result = db.query(query, function(reply) {
    document.getElementById("output").innerHTML = (JSON.stringify(reply));
  });
}

function jSQL(login) {
    this.login = login;
}

jSQL.prototype.query = function (query, callback) {
  Request(query, this.login, callback);
}

// POST REQUEST ONLY / GET REQUEST?
function Request (query, login, callback) {
  var json = false; // TODO
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
      if(json) {
        var post = "{"; // start of json
        for (index in login){
          post += index + ":\"" + encodeURIComponent(login[index]) + "\","; //encodeURIComponent(login[index]);
        }
        post += "query:\"" + encodeURIComponent(query) + "\"";
        post += "}"; // end of json
      } else {
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
    else {
      return false;
    }
}
