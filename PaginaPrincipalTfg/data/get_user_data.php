<?php
// archivo: get_user_data.php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");

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

    // Obtener publicaciones del usuario
    $stmt = $conn->prepare("SELECT id, imagen, titulo, texto, hashtags FROM Publicaciones WHERE usuario = ?");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $postsResult = $stmt->get_result();

    $posts = [];
    while ($row = $postsResult->fetch_assoc()) {
        $posts[] = $row;
    }

    $response = [
        "message" => "Datos del usuario obtenidos",
        "user" => $userData,
        "posts" => $posts,
        "postCount" => count($posts)
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