<?php
require "../config/database.php";
require "../middleware/auth.php";

$user_id = $_SESSION['user_id'];

$file = $_FILES['file'];
$allowed = ['pdf', 'jpg', 'png', 'docx'];

$ext = pathinfo($file['name'], PATHINFO_EXTENSION);
if (!in_array($ext, $allowed)) {
    http_response_code(400);
    exit("File tidak diizinkan");
}

$filename = uniqid() . "_" . $file['name'];
$path = "../uploads/" . $filename;

move_uploaded_file($file['tmp_name'], $path);

$query = "INSERT INTO files (user_id, filename, filepath) VALUES (?, ?, ?)";
$stmt = mysqli_prepare($conn, $query);
mysqli_stmt_bind_param($stmt, "iss", $user_id, $filename, $path);
mysqli_stmt_execute($stmt);

echo json_encode(["status" => "uploaded"]);
