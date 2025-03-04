<?php
// archivo: save_post.php

// Configuración de cabeceras para permitir solicitudes CORS
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Verificar que sea una solicitud POST
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405); // Method Not Allowed
    echo json_encode(["message" => "Método no permitido"]);
    exit;
}

// Obtener los datos enviados desde el formulario
$username = $_POST["usuario"] ?? null;
$title = $_POST["titulo"] ?? null;
$text = $_POST["texto"] ?? null;
$hashtags = $_POST["hashtags"] ?? null;

// Manejar la imagen (opcional)
$image = null;
if (isset($_FILES["imagen"]) && $_FILES["imagen"]["error"] === UPLOAD_ERR_OK) {
    $uploadDir = "uploads/"; // Carpeta donde se guardarán las imágenes
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0777, true); // Crear la carpeta si no existe
    }
    $imageName = uniqid() . "_" . basename($_FILES["imagen"]["name"]); // Nombre único para evitar conflictos
    $image = $uploadDir . $imageName;
    if (!move_uploaded_file($_FILES["imagen"]["tmp_name"], $image)) {
        http_response_code(500);
        echo json_encode(["message" => "Error al subir la imagen"]);
        exit;
    }
}

// Validar campos obligatorios
if (empty($username) || empty($title) || empty($text)) {
    http_response_code(400); // Bad Request
    echo json_encode(["message" => "Faltan datos obligatorios (usuario, título o texto)"]);
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

    // Preparar la consulta SQL
    $stmt = $conn->prepare("INSERT INTO Publicaciones (usuario, imagen, titulo, texto, hashtags) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param("sssss", $username, $image, $title, $text, $hashtags);

    // Ejecutar la consulta
    if ($stmt->execute()) {
        http_response_code(201); // Created
        echo json_encode(["message" => "Publicación creada exitosamente"]);
    } else {
        http_response_code(500); // Internal Server Error
        echo json_encode(["message" => "Error al crear la publicación: " . $stmt->error]);
    }

    // Cerrar recursos
    $stmt->close();
    $conn->close();

} catch (Exception $e) {
    http_response_code(500); // Internal Server Error
    echo json_encode(["message" => "Error en el servidor: " . $e->getMessage()]);
}
?>