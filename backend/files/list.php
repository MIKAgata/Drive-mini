<?php
require "../config/database.php";
require "../middleware/auth.php";

$user_id = $_SESSION['user_id'];

$query = "SELECT * FROM files WHERE user_id=?";
$stmt = mysqli_prepare($conn, $query);
mysqli_stmt_bind_param($stmt, "i", $user_id);
mysqli_stmt_execute($stmt);

$result = mysqli_stmt_get_result($stmt);
$data = [];

while ($row = mysqli_fetch_assoc($result)) {
    $data[] = $row;
}

echo json_encode($data);
