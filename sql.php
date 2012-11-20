<?php

/*
  jSQL - JavaScript/JSON to MySQL Bridge
   Version: 4.5 (MySQLi Version)
   Requres: PHP Version 5 & MYSQLi
   Date: 11/2012   
   Return: a JSON object {data : "", items : "# of affected rows"} or if an error {error : ""}
   
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
    private $host; // where the MySQL server is located
    private $database; // the name of the table / database you want to connect to
    private $mysqli; // the link to the database connection
    public $sql; // query text
    public $fetch; // type of fetch
    public $result; // result object
    public $reply; // reply string
    private $json = array(); // data from the query to be changed to json format
  
  function __construct($config) {
    $this->username = $config['username'];
    $this->password = $config['password'];
    $this->host = $config['host'];
    $this->database = $config['database'];
    $this->conn = $config['table'];
    $this->fetch = $config['fetch']; 
    $this->mysqli = new mysqli($this->host, $this->username, $this->password, $this->database);
    if(mysqli_connect_errno()){
      $this->reply['error'] = "MySQL Connection Error " . mysqli_connect_errno() . " " . mysqli_connect_error();
    }
  }

  public function query($sql) {
    $sql = ltrim($sql, ' '); // trim the leading white space (maybe remove tabs?)
    $this->result = mysqli_query($this->mysqli, $sql);
    if($this->result) { 
      $type = strtoupper(substr($sql,0,6));
      if(strtoupper(substr($sql,0,4)) == "SHOW") { // ["SHOW TABLES FROM", "SHOW DATABASES", "SHOW COLUMNS FROM"]
        while ($row = $this->result->fetch_array(MYSQLI_NUM)) {
          array_push($this->json, $row[0]);
        }
      }
      elseif ($type == "UPDATE" || $type == "INSERT" || $type == "DELETE") {
        $this->reply['data'] = array();
        $this->reply['items'] = mysqli_affected_rows($this->mysqli);
        return json_encode($this->reply);
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
    else { // empty results
      $this->reply['data'] = array();
      $this->reply['items'] = 0;
      if(mysqli_errno($this->mysqli)) {
        $this->reply['error'] = "MySQL Query Error " . mysqli_errno($this->mysqli) . " " . mysqli_error($this->mysqli);
        $this->reply['query'] = $sql;
      }
      return json_encode($this->reply);
    }
    // Everything was succesful now we return the JSON reply packet
    $this->reply['data'] = $this->json;
    $this->reply['items'] = mysqli_affected_rows($this->mysqli);
    mysqli_free_result($this->result); // free the result
    mysqli_close($this->mysqli); // close the connection
    return json_encode($this->reply);
  }
}

?>
