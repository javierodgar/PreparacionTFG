<?php
// archivo: data/get_all_users.php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");

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

    $stmt = $conn->prepare("SELECT usuario, nombre, apellido1, apellido2, ciudad_residencia FROM Usuarios");
    $stmt->execute();
    $result = $stmt->get_result();
    $users = [];
    while ($row = $result->fetch_assoc()) {
        $users[] = $row;
    }

    http_response_code(200);
    echo json_encode([
        "message" => "Usuarios obtenidos",
        "users" => $users
    ]);

    $stmt->close();
    $conn->close();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error en el servidor: " . $e->getMessage()]);
}
?>