<?php
// archivo: data/get_profile_image.php

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
$dbPassword = "";
$dbName = "RegistroUsuarios";

try {
    $conn = new mysqli($host, $dbUsername, $dbPassword, $dbName);
    if ($conn->connect_error) {
        http_response_code(500);
        echo json_encode(["message" => "Error de conexión: " . $conn->connect_error]);
        exit;
    }

    // Obtener la imagen de perfil del usuario
    $stmt = $conn->prepare("SELECT profile_image FROM Usuarios WHERE usuario = ?");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();
    $userData = $result->fetch_assoc();

    if ($userData && $userData['profile_image']) {
        http_response_code(200);
        echo json_encode([
            "message" => "Imagen de perfil obtenida",
            "profile_image" => $userData['profile_image']
        ]);
    } else {
        http_response_code(404);
        echo json_encode(["message" => "Imagen de perfil no encontrada para el usuario"]);
    }

    $stmt->close();
    $conn->close();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error en el servidor: " . $e->getMessage()]);
}
?>