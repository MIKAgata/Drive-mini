<?php
require "../config/database.php";
require "../middleware/auth.php";

if ($_SESSION['role'] !== 'admin') {
    http_response_code(403);
    exit("Forbidden");
}

$query = "
SELECT files.id, users.username, files.filename, files.uploaded_at
FROM files
JOIN users ON files.user_id = users.id
";

$result = mysqli_query($conn, $query);
$data = [];

while ($row = mysqli_fetch_assoc($result)) {
    $data[] = $row;
}

echo json_encode($data);
