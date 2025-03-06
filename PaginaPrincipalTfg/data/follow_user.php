<?php
// archivo: data/follow_user.php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");

// Depuración: registrar la entrada
file_put_contents("debug.log", "Petición recibida: " . file_get_contents("php://input") . "\n", FILE_APPEND);

$jsonData = file_get_contents("php://input");
$data = json_decode($jsonData, true);
$follower = $data['follower'] ?? null;
$followed = $data['followed'] ?? null;
$action = $data['action'] ?? null;

file_put_contents("debug.log", "Datos decodificados: " . print_r($data, true) . "\n", FILE_APPEND);

if (empty($follower) || empty($followed) || empty($action) || !in_array($action, ['follow', 'unfollow'])) {
    http_response_code(400);
    echo json_encode(["message" => "Faltan datos o acción inválida"]);
    exit;
}

if ($follower === $followed) {
    http_response_code(400);
    echo json_encode(["message" => "No puedes seguirte a ti mismo"]);
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

    if ($action === "follow") {
        $stmt = $conn->prepare("INSERT IGNORE INTO Seguidores (seguidor, seguido) VALUES (?, ?)");
        $stmt->bind_param("ss", $follower, $followed);
        $stmt->execute();
        file_put_contents("debug.log", "Follow - Filas afectadas: " . $stmt->affected_rows . "\n", FILE_APPEND);
        if ($stmt->affected_rows > 0) {
            http_response_code(200);
            echo json_encode(["message" => "Ahora sigues a $followed"]);
        } else {
            http_response_code(409);
            echo json_encode(["message" => "Ya sigues a este usuario"]);
        }
    } else { // unfollow
        $stmt = $conn->prepare("DELETE FROM Seguidores WHERE seguidor = ? AND seguido = ?");
        $stmt->bind_param("ss", $follower, $followed);
        $stmt->execute();
        file_put_contents("debug.log", "Unfollow - Filas afectadas: " . $stmt->affected_rows . "\n", FILE_APPEND);
        if ($stmt->affected_rows > 0) {
            http_response_code(200);
            echo json_encode(["message" => "Has dejado de seguir a $followed"]);
        } else {
            http_response_code(200); // Cambiar a 200 para evitar 404 confuso
            echo json_encode(["message" => "No estabas siguiendo a este usuario"]);
        }
    }

    $stmt->close();
    $conn->close();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error en el servidor: " . $e->getMessage()]);
}
?>