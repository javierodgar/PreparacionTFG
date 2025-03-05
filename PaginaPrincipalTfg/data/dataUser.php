<?php
// archivo: get_user.php

// Configuración de cabeceras para permitir solicitudes CORS
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Recibir los datos JSON enviados desde el cliente
$jsonData = file_get_contents("php://input");
$data = json_decode($jsonData, true); // Decodificar JSON a un array asociativo

// Verificar si se recibieron datos JSON válidos
if ($data === null) {
    http_response_code(400); // Bad Request
    echo json_encode(["message" => "Error: No se recibieron datos válidos en formato JSON"]);
    exit;
}

// Extraer el nombre de usuario
$username = $data['username'] ?? null;

// Validar que se haya proporcionado un nombre de usuario
if (empty($username)) {
    http_response_code(400); // Bad Request
    echo json_encode(["message" => "Error: Debes proporcionar un nombre de usuario"]);
    exit;
}

// Conexión a la base de datos
$host = "localhost"; // Ajusta según tu configuración
$dbUsername = "root"; // Ajusta según tu usuario de BD
$dbPassword = "root";    // Ajusta según tu contraseña de BD
$dbName = "RegistroUsuarios"; // Nombre de la base de datos

try {
    $conn = new mysqli($host, $dbUsername, $dbPassword, $dbName);

    // Verificar conexión
    if ($conn->connect_error) {
        http_response_code(500); // Internal Server Error
        echo json_encode(["message" => "Error de conexión a la base de datos: " . $conn->connect_error]);
        exit;
    }

    // Preparar la consulta SQL para comprobar si el usuario existe
    $stmt = $conn->prepare("SELECT usuario FROM Usuarios WHERE usuario = ?");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();

    // Verificar si se encontró el usuario
    if ($result->num_rows > 0) {
        $userData = $result->fetch_assoc();
        http_response_code(200); // OK
        echo json_encode([
            "message" => "Usuario encontrado",
            "data" => [
                "username" => $userData['usuario']
            ]
        ]);
    } else {
        
        echo json_encode(["message" => "Usuario no encontrado"]);
    }

    // Cerrar la declaración y la conexión
    $stmt->close();
    $conn->close();

} catch (Exception $e) {
    http_response_code(500); // Internal Server Error
    echo json_encode(["message" => "Error en el servidor: " . $e->getMessage()]);
}
?>