<?php

/*

jSQL - JavaScript/JSON to PostgreSQL Bridge
Version: 7.0
Requres:
Date: 9/2015
Help: http://php.net/manual/en/book.pgsql.php

RETURN:
[{"data" : [], "items" : 0},{"error" : "message", "query" : "SELECT * FROM DataBase.Table"},{}...]

*/

// If you pass in a value from the POST/GET request they will override these otherwise these are used.
$login['username'] = "earthling";//"username";
$login['password'] = "extraterrestrial";//"password";
$login['hostname'] = "localhost";
$login['port'] = "5432"; // default PostgreSQL port is 5432
$login['database'] = "orion";
$login['status'] = TRUE; // you don't always need the status messages
$login['options'] = "client_encoding=UTF8";
$login['fetch'] = "assoc"; // array || assoc || row ||object (use row if you need speed)

if ($_SERVER['REQUEST_METHOD'] == 'POST') { // POST REQUEST
  if(isset($_POST['username'])){
    $login['username'] = $_POST['username'];
  }
  if(isset($_POST['password'])){
    $login['password'] = $_POST['password'];
  }
  if(isset($_POST['host'])){
    $login['hostname'] = $_POST['hostname'];
  }
  if(isset($_POST['port'])){
    $login['port'] = $_POST['port'];
  }
  if(isset($_POST['database'])){
    $login['database'] = $_POST['database'];
  }
  if(isset($_POST['fetch'])){
    $login['fetch'] = $_POST['fetch'];
  }
  if(isset($_POST['status'])){
    $login['status'] = TRUE;
  }
  if(isset($_POST['options'])){
    $login['options'] = $_POST['options'];
  }
  $query = $_POST['query'];
} elseif ($_SERVER['REQUEST_METHOD'] == 'GET') { // GET REQUEST
  if(isset($_GET['username'])){
    $login['username'] = $_GET['username'];
  }
  if(isset($_GET['password'])){
    $login['password'] = $_GET['password'];
  }
  if(isset($_GET['hostname'])){
    $login['hostname'] = $_GET['hostname'];
  }
  if(isset($_GET['port'])){
    $login['port'] = $_GET['port'];
  }
  if(isset($_GET['database'])){
    $login['database'] = $_GET['database'];
  }
  if(isset($_GET['fetch'])){
    $login['fetch'] = $_GET['fetch'];
  }
  if(isset($_GET['status'])){
    $login['status'] = TRUE;
  }
  if(isset($_GET['options'])){
    $login['options'] = $_GET['options'];
  }
  $query = $_GET['query'];
}

// if you understand these two lines of code you understand everything!
$db = new SQL($login);
echo $db->query($query);

class SQL
{
  private $pgsql; // the link to the database connection
  private $username;
  private $password;
  private $host; // where the SQL server is located
  private $port;
  private $database; // please dont use this unless you have a very specific reason to use it
  public $status; // print SQL the status messages
  private $options;
  public $sql; // query text
  public $fetch; // type of fetch
  public $reply = array(); // encoded into json format

  function __construct($config)
  {
    $this->username = $config['username'];
    $this->password = $config['password'];
    $this->host = $config['hostname'];
    $this->port = $config['port'];
    $this->database = $config['database'];
    $this->fetch = $config['fetch'];
    $this->status = $config['status'];
    $this->options = $config['options'];
    $this->connect();
  }

  private function connect()
  {
    $conn_string = "host=$this->host port=$this->port dbname=$this->database user=$this->username password=$this->password options='--$this->options'";
    $this->pgsql = pg_connect($conn_string) or die("PostgreSQL Connection Failed: host=$this->host port=$this->port dbname=$this->database user=$this->username");
  }

  private function status()
  {
    $this->reply['hostname'] = $this->host;
    $this->reply['port'] = $this->port;
    $this->reply['database'] = $this->database;
    $result = pg_get_result($this->pgsql); // Get error message associated with result
    $this->reply['pg_connection_status'] = pg_connection_status($this->pgsql);
    $this->reply['pg_get_result'] = $result;
    $this->reply['pg_client_encoding'] = pg_client_encoding($this->pgsql);
    $this->reply['pg_result_error'] = pg_result_error($result); // Get error message associated with result
    $this->reply['pg_result_status'] = pg_result_status($result); // Get status message associated with result
    $this->reply['pg_last_error'] = pg_last_error($this->pgsql); // Get the last error message string of a connection
    $this->reply['pg_connection_busy'] = pg_connection_busy($this->pgsql);
  }


  public function query($text)
  {

    $sql_query = ltrim($text, ' '); // trim the leading white space (maybe remove tabs?)
    $result = pg_query($this->pgsql, $sql_query);
    $rows['data'] = array();

    if($result) {
      $type = strtoupper(substr($sql_query,0,6));
      if(substr($type,0,4) == "SHOW") { // ["SHOW TABLES FROM", "SHOW DATABASES", "SHOW COLUMNS FROM"]
        while ($row = pg_fetch_array($result, 0, PGSQL_NUM)) {
          array_push($rows['data'], $row[0]);
          $rows['items'] = pg_affected_rows($result);
        }
      }
      elseif ($type == "UPDATE" || $type == "INSERT" || $type == "DELETE") {
        $rows['items'] = pg_affected_rows($result);
      }
      else { // query was a "SELECT"
        /*
        switch($this->fetch) {
          case "array": // http://php.net/manual/en/function.pg-fetch-array.php
          while ($row = pg_fetch_array($result, 0, PGSQL_NUM)) {
            array_push($rows['data'], $row);
          }
          break;
          case "assoc": // http://php.net/manual/en/function.pg-fetch-assoc.php
          while ($row = pg_fetch_assoc($result)) {
            array_push($rows['data'], $row);
          }
          break;
          case "row": // http://php.net/manual/en/function.pg-fetch-row.php
          while ($row = pg_fetch_row($result)) {
            array_push($rows['data'], $row);
          }
          break;
          case "object": // http://php.net/manual/en/function.pg-fetch-object.php
          while ($row = pg_fetch_object($result) {
            array_push($rows['data'], $row);
          }
          break;
          default: // assoc
          while ($row = pg_fetch_assoc($result)) {
            array_push($rows['data'], $row);
          }
        }
        $rows['items'] = pg_affected_rows($result);
        */
        echo "hi";
      }
    }
    else { // empty results
      $this->status(); // check the status
      $rows['items'] = 0;
      if(mysqli_errno($this->pgsql)) {
        $rows['error'] = "MySQL Query Error " . mysqli_errno($this->pgsql) . " " . mysqli_error($this->pgsql);
        $rows['query'] = $sql_query;
      }
    }

    pg_free_result($result); // maybe not needed
    pg_close($this->pgsql); // look into persistance
    if($this->status) {
      $this->status();
    }
    return json_encode($this->reply);
  }
}
?>
