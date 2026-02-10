<?php
require "../config/database.php";

$data = json_decode(file_get_contents("php://input"), true);

$username = trim($data['username']);
$password = password_hash($data['password'], PASSWORD_DEFAULT);

$query = "INSERT INTO users (username, password) VALUES (?, ?)";
$stmt = mysqli_prepare($conn, $query);
mysqli_stmt_bind_param($stmt, "ss", $username, $password);

if (mysqli_stmt_execute($stmt)) {
    echo json_encode(["status" => "success"]);
} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Username sudah ada"]);
}
