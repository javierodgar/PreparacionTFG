<?php
// archivo: register.php

// Configuración de cabeceras para permitir solicitudes CORS (si vienes desde un frontend en otro dominio)
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Recibir los datos JSON enviados desde el cliente
$jsonData = file_get_contents("php://input");
$data = json_decode($jsonData, true); // Decodificar JSON a un array asociativo

// Verificar si se recibieron los datos correctamente
if ($data === null) {
    http_response_code(400); // Bad Request
    echo json_encode(["message" => "Error: No se recibieron datos válidos en formato JSON"]);
    exit;
}

// Extraer los valores del array
$username = $data['username'] ?? null;
$firstName = $data['firstName'] ?? null;
$lastName1 = $data['lastName'] ?? null; // Ajustado a 'lastName' según tu JSON
$lastName2 = $data['lastName2'] ?? null;
$city = $data['city'] ?? null;
$email = $data['email'] ?? null;
$encryptedPassword = $data['encryptedPassword'] ?? null;

// Validar que los campos obligatorios no estén vacíos
if (empty($username) || empty($firstName) || empty($lastName1) || empty($city) || empty($email) || empty($encryptedPassword)) {
    http_response_code(400); // Bad Request
    echo json_encode(["message" => "Error: Todos los campos obligatorios deben estar completos"]);
    exit;
}

// Conexión a la base de datos
$host = "localhost"; // Cambia esto según tu configuración
$dbUsername = "root"; // Cambia esto según tu usuario de BD
$dbPassword = "";    // Cambia esto según tu contraseña de BD
$dbName = "RegistroUsuarios"; // Nombre de la base de datos que creamos

try {
    $conn = new mysqli($host, $dbUsername, $dbPassword, $dbName);

    // Verificar conexión
    if ($conn->connect_error) {
        http_response_code(500); // Internal Server Error
        echo json_encode(["message" => "Error de conexión a la base de datos: " . $conn->connect_error]);
        exit;
    }

    // Preparar la consulta SQL para insertar los datos
    $stmt = $conn->prepare("INSERT INTO Usuarios (usuario, nombre, apellido1, apellido2, correo_electronico, ciudad_residencia, contrasena) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("sssssss", $username, $firstName, $lastName1, $lastName2, $email, $city, $encryptedPassword);

    // Ejecutar la consulta
    if ($stmt->execute()) {
        http_response_code(201); // Created
        echo json_encode(["message" => "Usuario registrado exitosamente"]);
    } else {
        http_response_code(500); // Internal Server Error
        echo json_encode(["message" => "Error al registrar el usuario: " . $stmt->error]);
    }

    // Cerrar la declaración y la conexión
    $stmt->close();
    $conn->close();

} catch (Exception $e) {
    http_response_code(500); // Internal Server Error
    echo json_encode(["message" => "Error en el servidor: " . $e->getMessage()]);
}
?>