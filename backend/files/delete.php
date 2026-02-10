<?php
require "../config/database.php";
require "../middleware/auth.php";

$id = $_GET['id'];
$user_id = $_SESSION['user_id'];

$q = "SELECT * FROM files WHERE id=? AND user_id=?";
$stmt = mysqli_prepare($conn, $q);
mysqli_stmt_bind_param($stmt, "ii", $id, $user_id);
mysqli_stmt_execute($stmt);

$file = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt));

if ($file) {
    unlink($file['filepath']);
    mysqli_query($conn, "DELETE FROM files WHERE id=$id");
    echo json_encode(["status" => "deleted"]);
} else {
    http_response_code(403);
}
