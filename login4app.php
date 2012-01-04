<?php
/***************************************
$Revision:: 175                        $: Revision of last commit
$LastChangedBy::                       $: Author of last commit
$LastChangedDate:: 2012-01-03 14:44:48#$: Date of last commit
***************************************/
//$errorMessage = 'false';
$accountId = 0;
$userName = 'unknown';
$firstName = 'firstName';
$lastName = 'lastName';

require_once( "../plateslate/config.php" );
require_once( "../plateslate/Member.class.php" );
require_once( "../plateslate/LogEntry.class.php" );

session_start();

  $member = new Member( array( 
    //"username" => isset( $_POST["name"] ) ? preg_replace( "/[^ \-\_a-zA-Z0-9]/", "", $_POST["name"] ) : "",
    //"password" => isset( $_POST["pword"] ) ? preg_replace( "/[^ \-\_a-zA-Z0-9]/", "", $_POST["pword"] ) : "",
    "username" => isset( $_GET["name"] ) ? preg_replace( "/[^ \-\_a-zA-Z0-9]/", "", $_GET["name"] ) : "",
    "password" => isset( $_GET["pword"] ) ? preg_replace( "/[^ \-\_a-zA-Z0-9]/", "", $_GET["pword"] ) : "",
  ) );

  if ( $loggedInMember = $member->authenticate() ) {
    $_SESSION["member"] = $loggedInMember;
	$accountId = $loggedInMember->getValue( "id" );
	$userName = $loggedInMember->getValueEncoded( "username" );
	$firstName = $loggedInMember->getValueEncoded( "firstName" );
	$lastName = $loggedInMember->getValueEncoded( "lastName" );
  }
  $loginInfo = '["loginInfo", {"id":"'.$accountId.'","userName":"'.$userName.'","firstName":"'.$firstName.'","lastName":"'.$lastName.'"}]';
  echo $loginInfo;
?>
