<?php
// archivo: data/get_user_data.php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Origin: http://localhost:4200");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$jsonData = file_get_contents("php://input");
$data = json_decode($jsonData, true);
$username = $data['username'] ?? null;

if (empty($username)) {
    http_response_code(400);
    echo json_encode(["message" => "Debes proporcionar un nombre de usuario"]);
    exit;
}

$host = "localhost";
$dbUsername = "root";
$dbPassword = "root";
$dbName = "RegistroUsuarios";

try {
    $conn = new mysqli($host, $dbUsername, $dbPassword, $dbName);
    if ($conn->connect_error) {
        http_response_code(500);
        echo json_encode(["message" => "Error de conexión: " . $conn->connect_error]);
        exit;
    }

    // Obtener datos del usuario
    $stmt = $conn->prepare("SELECT usuario, nombre, apellido1, apellido2, correo_electronico, ciudad_residencia FROM Usuarios WHERE usuario = ?");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $userResult = $stmt->get_result();
    $userData = $userResult->fetch_assoc();

    if (!$userData) {
        http_response_code(404);
        echo json_encode(["message" => "Usuario no encontrado"]);
        exit;
    }

    // Obtener publicaciones del usuario y sus hashtags
    $stmt = $conn->prepare("SELECT id, imagen, titulo, texto FROM Publicaciones WHERE usuario = ?");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $postsResult = $stmt->get_result();
    $posts = [];
    while ($postRow = $postsResult->fetch_assoc()) {
        $postId = $postRow['id'];

        $hashtagsStmt = $conn->prepare("
            SELECT h.nombre
            FROM Hashtags h
            INNER JOIN PublicacionHashtag ph ON h.id = ph.hashtag_id
            WHERE ph.publicacion_id = ?
        ");
        $hashtagsStmt->bind_param("i", $postId);
        $hashtagsStmt->execute();
        $hashtagsResult = $hashtagsStmt->get_result();
        $hashtags = [];
        while ($hashtagRow = $hashtagsResult->fetch_assoc()) {
            $hashtags[] = $hashtagRow['nombre'];
        }
        $hashtagsStmt->close();

        $posts[] = array_merge($postRow, ['hashtags' => $hashtags]);
    }

    // Obtener usuarios a los que sigue (seguidos)
    $stmt = $conn->prepare("SELECT seguido FROM Seguidores WHERE seguidor = ?");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $followingResult = $stmt->get_result();
    $following = [];
    while ($row = $followingResult->fetch_assoc()) {
        $following[] = $row['seguido'];
    }

    // Obtener usuarios que lo siguen (seguidores)
    $stmt = $conn->prepare("SELECT seguidor FROM Seguidores WHERE seguido = ?");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $followersResult = $stmt->get_result();
    $followers = [];
    while ($row = $followersResult->fetch_assoc()) {
        $followers[] = $row['seguidor'];
    }

    $response = [
        "message" => "Datos del usuario obtenidos",
        "user" => $userData,
        "posts" => $posts,
        "postCount" => count($posts),
        "following" => $following,
        "followers" => $followers,
        "followingCount" => count($following),
        "followersCount" => count($followers)
    ];

    http_response_code(200);
    echo json_encode($response);

    $stmt->close();
    $conn->close();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error en el servidor: " . $e->getMessage()]);
}
?>