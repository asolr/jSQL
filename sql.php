<?php

/*
  jSQL - JavaScript/JSON to MySQL Bridge
   Version: 3.5 (MySQLi Version)
   Requres: PHP Version 5 & MYSQLi
   Date: 11/2012   
   Return: a JSON object {data : ""} or if an error {error : ""}
   
   Note: The default login values in JavaScript have the override over PHP.
   
   Note: Future version should support persistance with JavaScript
      
*/

// Default MySQL Login Values
$login['username'] = "username";
$login['password'] = "password";
$login['hostname'] = "localhost";
$login['database'] = ""; 
$login['fetch'] = "assoc"; // array || assoc || row ||object

if ($_SERVER['REQUEST_METHOD'] == 'POST') { // POST REQUEST
  if(isset($_POST['username'])){
    $login['username'] = $_POST['username'];
  }
  if(isset($_POST['password'])){
    $login['password'] = $_POST['password'];
  }
  if(isset($_POST['host'])){
    $login['host'] = $_POST['host'];
  } 
  if(isset($_POST['database'])){
    $login['database'] = $_POST['database'];
  }
  if(isset($_POST['fetch'])){
    $login['fetch'] = $_POST['fetch'];
  }
  $query = $_POST['query']; 
} elseif ($_SERVER['REQUEST_METHOD'] == 'GET') { // GET REQUEST
  if(isset($_GET['username'])){
    $login['username'] = $_GET['username'];
  }
  if(isset($_GET['password'])){
    $login['password'] = $_GET['password'];
  }
  if(isset($_GET['host'])){
    $login['host'] = $_GET['host'];
  }
  if(isset($_GET['database'])){
    $login['database'] = $_GET['database'];
  }
  if(isset($_GET['fetch'])){
    $login['fetch'] = $_GET['fetch'];
  }
  $query = $_GET['query']; 
}

$db = new jSQL($login);
echo $db->query($query); 

class jSQL {
  
    private $username;
    private $password;
    private $host;
    private $connection;
    private $database;
    public $sql;
    public $fetch;
    public $result;
    public $reply;
    private $json = array();
  
  function __construct($config) {
    $this->username = $config['username'];
    $this->password = $config['password'];
    $this->host = $config['host'];
    $this->database = $config['database'];
    $this->fetch = $config['fetch']; 
    $this->connection = new mysqli($this->host, $this->username, $this->password, $this->database);
  }
    
  public function query($sql) {
    if($this->result = $this->connection->query($sql)) {
      if(strpos($sql, "SHOW") !== false) { // ["SHOW TABLES FROM", "SHOW DATABASES", "SHOW COLUMNS FROM"]
        array_push($this->json, $this->result->fetch_array(MYSQLI_NUM));
      }
      else {
        switch($this->fetch) {
          case "array":
            while ($row = $this->result->fetch_array(MYSQLI_NUM)) {
              array_push($this->json, $row);
            }
          break;
          case "assoc":
            while ($row = $this->result->fetch_array(MYSQLI_ASSOC)) {
              array_push($this->json, $row);
            }
          break;
          case "row":
            while ($row = $this->result->fetch_row()) {
              array_push($this->json, $row);
            }
          break;
          case "object":
            while ($row = $this->result->fetch_object()) {
              array_push($this->json, $row);
            }
          break;
          default: // assoc
            while ($row = $this->result->fetch_array(MYSQLI_ASSOC)) {
              array_push($this->json, $row);
            }
          }
      }
    }
    else { // Return a MySQL error because the query wasn't successful.
      $this->reply['error'] = "MySQL Error " . mysqli_connect_errno() . " " . mysqli_connect_error();
      $this->reply['query'] = $sql . "";
      return json_encode($this->reply);
    }
    // Everything was succesful now we return the JSON reply packet
    $this->reply['data'] = $this->json;
    $this->result->close(); // free the result
    $this->connection->close(); // close the connection
    return json_encode($this->reply);
  }
}

?>