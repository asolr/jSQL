<?php

/*
  jSQL - JavaScript/JSON to MySQL Bridge
   Version: 5.0 (MySQLi multi_query() Evaluation Version)
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
    private $database; // please dont use this unless you have a very specific reason to use it
    private $mysqli; // the link to the database connection
    public $sql; // query text
    public $fetch; // type of fetch
    public $reply = array(); // encoded into json format
  
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
    mysqli_multi_query($this->mysqli, $sql);
    do{
      $rows['data'] = array();
      $result = mysqli_store_result($this->mysqli);
      if($result) {
        $type = strtoupper(substr($sql,0,6));
        if(strtoupper(substr($sql,0,4)) == "SHOW") { // ["SHOW TABLES FROM", "SHOW DATABASES", "SHOW COLUMNS FROM"]
          while ($row = $result->fetch_array(MYSQLI_NUM)) {
            array_push($rows['data'], $row[0]);
          }
        }
        elseif ($type == "UPDATE" || $type == "INSERT" || $type == "DELETE") {
          $rows['data'] = array(); 
        }
        else {
          switch($this->fetch) {
            case "array":
              while ($row = $result->fetch_array(MYSQLI_NUM)) {
                array_push($rows['data'], $row);
              }
            break;
            case "assoc":
              while ($row = $result->fetch_array(MYSQLI_ASSOC)) {
                array_push($rows['data'], $row);
              }
            break;
            case "row": // this will not have any column names just the values
              while ($row = $result->fetch_row()) {
                array_push($rows['data'], $row);
              }
            break;
            case "object":
              while ($row = $result->fetch_object()) {
                array_push($rows['data'], $row);
              }                    
            break;
            default: // assoc
              while ($row = $result->fetch_array(MYSQLI_ASSOC)) {
                array_push($rows['data'], $row);
              }
          }
        }
        $rows['items'] = mysqli_affected_rows($this->mysqli);        
      }
      else { // empty results
        $rows['items'] = 0;
        array_push($rows['data'], array());
        if(mysqli_errno($this->mysqli)) {
          $rows['error'] = "MySQL Query Error " . mysqli_errno($this->mysqli) . " " . mysqli_error($this->mysqli);
          $rows['query'] = $sql;
        }
      }
      mysqli_free_result($result); // free the result
      array_push($this->reply, $rows);
    } while(mysqli_next_result($this->mysqli));
    mysqli_close($this->mysqli); // close the connection
    return json_encode($this->reply);
  }
}

?>