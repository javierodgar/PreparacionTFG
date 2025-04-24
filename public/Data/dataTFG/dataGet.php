<?php
// archivo: get_user.php

// Configuración de cabeceras para permitir solicitudes CORS
// Cabeceras CORS lo más permisivas posible
header("Access-Control-Allow-Origin: *"); // Permite cualquier origen
header("Access-Control-Allow-Origin: http://localhost:4200"); // Permite el origen específico de Angular

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS"); // Permite todos los métodos comunes
header("Access-Control-Max-Age: 86400"); // Tiempo de caché extendido (24 horas)
header("Access-Control-Allow-Headers: *"); // Permite cualquier cabecera
header("Access-Control-Expose-Headers: *"); // Expone todas las cabeceras en la respuesta

// Recibir los datos JSON enviados desde el cliente
$jsonData = file_get_contents("php://input");
$data = json_decode($jsonData, true); // Decodificar JSON a un array asociativo

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200); // OK
    exit; // Terminar ejecución ya que no se necesita procesar más
}

require_once 'db_config.php';

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

try {
    // La conexión PDO ya está disponible a través de $pdo incluido desde db_config.php

    // Preparar la consulta SQL para obtener el usuario y la contraseña
    $stmt = $pdo->prepare("SELECT usuario, contrasena FROM Usuarios WHERE usuario = :username");
    $stmt->bindParam(':username', $username);
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);

    // Verificar si se encontró el usuario
    if ($result) {
        http_response_code(200); // OK
        echo json_encode([
            "message" => "Usuario encontrado",
            "data" => [
                "username" => $result['usuario'],
                "encryptedPassword" => $result['contrasena']
            ]
        ]);
    } else {
        http_response_code(404); // Not Found
        echo json_encode(["message" => "Error: No se encontró un usuario con ese nombre"]);
    }

} catch (PDOException $e) {
    http_response_code(500); // Internal Server Error
    echo json_encode(["message" => "Error en el servidor: " . $e->getMessage()]);
}
?>