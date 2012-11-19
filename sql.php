<?php

/*
  jSQL - JavaScript/JSON to MySQL Bridge
   Version: 1.0 (Preliminary)
   Date: 11/2012
   
   NOTE: The default login values in JavaScript have the override.
*/

// Default MySQL Login Values
$login['username'] = "username";
$login['password'] = "password";
$login['hostname'] = "localhost";
$login['database'] = ""; 
$login['fetch'] = "object"; // mysql_fetch_array() | mysql_fetch_row() | mysql_fetch_object() 

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
    public $database;
    public $sql;
    public $fetch;
    public $result;
    private $json;
  
  function __construct($config) {
    $this->username = $config['username'];
    $this->password = $config['password'];
    $this->host = $config['host'];
    $this->database = $config['database'];
    $this->fetch = $config['fetch']; // mysql_fetch_(array|row|assoc|object)
    if(!($this->connection = mysql_connect($this->host, $this->username, $this->password))){
      mysql_close($this->connection);
    }
  }
    
  public function query($sql) {
    mysql_select_db($this->database, $this->connection); // maybe should be a good idea to have a check if null
		if(!($this->result = mysql_query($sql, $this->connection))) {
      $this->json = "[{\"Error\" : \" mysql_errno() " . mysql_errno() . " " . preg_replace('/["\']/', '', mysql_error()) . "\", \"Query\" : \"mysql_query()" . preg_replace('/["\']/', '', $sql) . "\"}]";
    } 
    if($this->result) {
      $this->json = "[";
      $index = 0;
      if(strpos($sql, "SHOW") !== false) { // ["SHOW TABLES FROM", "SHOW DATABASES", "SHOW COLUMNS FROM"]
        while ($row = mysql_fetch_row($this->result)) {
          $this->json .= json_encode($row[0]) . ",";
          $index++;
        }
      }
      else {
        switch($this->fetch) {
          case "array":
            while ($row = mysql_fetch_array($this->result, MYSQL_NUM)) {
              $this->json .= json_encode($row) . ",";
              $index++;
            }
          break;
          case "assoc":
            while ($row = mysql_fetch_array($this->result, MYSQL_ASSOC)) {
              $this->json .= json_encode($row) . ",";
              $index++;
            }
          break;
          case "row":
            while ($row = mysql_fetch_row($this->result)) {
              $this->json .= json_encode($row) . ",";
              $index++;
            }
          break;
          case "object":
            while ($row = mysql_fetch_object($this->result)) {
              $this->json .= json_encode($row) . ",";
              $index++;
            }
          break;
          default: 
            while ($row = mysql_fetch_object($this->result)) {
              $this->json .= json_encode($row) . ",";
              $index++;
            }
        }
      }
      if (strlen($this->json) > 1){
        $this->json[strlen($this->json)-1] = "]"; // be careful about removing space or ,
      }
      else {
        $this->json .= mysql_affected_rows() . "]"; 
      } 
    }
    mysql_free_result($this->result); 
    mysql_close($this->connection);
    return $this->json;
	}
}

?>
