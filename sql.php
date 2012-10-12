<?php

// Default Values 
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
    public $connection;
    public $database;
    public $result;
    private $json;
  
  function __construct($config) {
    $this->username = $config['username'];
    $this->password = $config['password'];
    $this->database = $config['database'];
    $this->fetch = $config['fetch'];
    $this->host = $config['host'];
    if(!($this->connection = mysql_connect($this->host, $this->username, $this->password))){
      mysql_close($this->connection);
    }
  }
    
  public function query($sql) {
    mysql_select_db($this->database, $this->connection); // maybe should be a good idea to have a check if null
  	if(!($this->result = mysql_query($sql, $this->connection))) {
      $this->json = "\"MySQL Error " . mysql_errno() . " " . preg_replace('/["\']/', '', mysql_error()) . " (" . preg_replace('/["\']/', '', $sql) . ")\"";
    } 
    if($this->result) {
      $this->json = "[";
      $index = 0;
      switch($this->fetch) {
        case "array":
          while ($row = mysql_fetch_array($this->result)) {
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
        default: // "object" [{key : value}, ... ]
          while ($row = mysql_fetch_object($this->result)) {
            $this->json .= json_encode($row) . ",";
            $index++;
          }        
      }
      $this->json[strlen($this->json)-1] = "]";
    }
    mysql_free_result($this->result); // TODO: maybe only one of these is needed
    mysql_close($this->connection);
    return $this->json;
	}
}

?>
