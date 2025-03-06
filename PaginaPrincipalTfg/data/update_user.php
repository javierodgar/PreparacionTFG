<?php
// archivo: update_user.php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["message" => "Método no permitido"]);
    exit;
}

$jsonData = file_get_contents("php://input");
$data = json_decode($jsonData, true);

$username = $data["usuario"] ?? null;
$nombre = $data["nombre"] ?? null;
$apellido1 = $data["apellido1"] ?? null;
$apellido2 = $data["apellido2"] ?? null; // Puede ser vacío o null
$email = $data["correo_electronico"] ?? null;
$ciudad = $data["ciudad_residencia"] ?? null;

// Validar campos obligatorios
if (empty($username) || empty($nombre) || empty($apellido1) || empty($email) || empty($ciudad)) {
    http_response_code(400);
    echo json_encode(["message" => "Faltan datos obligatorios"]);
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

    // Actualizar datos del usuario
    $stmt = $conn->prepare("UPDATE Usuarios SET nombre = ?, apellido1 = ?, apellido2 = ?, correo_electronico = ?, ciudad_residencia = ? WHERE usuario = ?");
    $stmt->bind_param("ssssss", $nombre, $apellido1, $apellido2, $email, $ciudad, $username);

    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            http_response_code(200);
            echo json_encode(["message" => "Datos del usuario actualizados exitosamente"]);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "Usuario no encontrado o sin cambios"]);
        }
    } else {
        http_response_code(500);
        echo json_encode(["message" => "Error al actualizar los datos: " . $stmt->error]);
    }

    $stmt->close();
    $conn->close();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error en el servidor: " . $e->getMessage()]);
}
?>