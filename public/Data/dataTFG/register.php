<?php
// archivo: register.php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Origin: http://localhost:4200"); // Permite el origen específico de Angular
header("Content-Type: application/json; charset=UTF-8"); // Esto puede ser application/json o dejarlo para que PHP lo determine
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS"); // Permite todos los métodos comunes

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200); // OK
    exit; // Terminar ejecución ya que no se necesita procesar más
}

// **Configuración de la base de datos**
require_once 'db_config.php';

try {
    // La conexión PDO ya está disponible a través de $pdo incluido desde db_config.php

    // Recibir datos del formulario (usando $_POST para los campos de texto)
    $username = $_POST['username'] ?? null;
    $firstName = $_POST['firstName'] ?? null;
    $lastName1 = $_POST['lastName'] ?? null;
    $lastName2 = $_POST['lastName2'] ?? null;
    $city = $_POST['city'] ?? null;
    $email = $_POST['email'] ?? null;
    $encryptedPassword = $_POST['encryptedPassword'] ?? null;

    // Validar campos obligatorios
    if (empty($username) || empty($firstName) || empty($lastName1) || empty($city) || empty($email) || empty($encryptedPassword)) {
        http_response_code(400);
        echo json_encode(["message" => "Error: Todos los campos obligatorios deben estar completos"]);
        exit;
    }

    $profileImageName = null;
    $profileImageUrl = null;
    // Procesar la carga de la imagen de perfil (usando $_FILES para el archivo)
    if (isset($_FILES['profileImage']) && $_FILES['profileImage']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = 'uploads/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        $fileName = basename($_FILES['profileImage']['name']);
        $uniqueFileName = uniqid() . '_' . $fileName;
        $targetFilePath = $uploadDir . $uniqueFileName;

        $imageFileType = strtolower(pathinfo($targetFilePath, PATHINFO_EXTENSION));
        $allowedExtensions = array("jpg", "jpeg", "png", "gif");
        if (in_array($imageFileType, $allowedExtensions)) {
            if (move_uploaded_file($_FILES['profileImage']['tmp_name'], $targetFilePath)) {
                $profileImageName = $uniqueFileName;
                $profileImageUrl = $uploadDir . $profileImageName;
            } else {
                http_response_code(500);
                echo json_encode(["message" => "Error al subir la imagen de perfil."]);
                exit;
            }
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Error: Solo se permiten archivos de imagen (JPG, JPEG, PNG, GIF)."]);
            exit;
        }
    }

    // Preparar la consulta SQL para insertar los datos incluyendo la foto de perfil
    $stmt = $pdo->prepare("INSERT INTO Usuarios (usuario, nombre, apellido1, apellido2, correo_electronico, ciudad_residencia, contrasena, profile_image) VALUES (:username, :firstName, :lastName1, :lastName2, :email, :city, :encryptedPassword, :profileImage)");
    $stmt->bindParam(":username", $username);
    $stmt->bindParam(":firstName", $firstName);
    $stmt->bindParam(":lastName1", $lastName1);
    $stmt->bindParam(":lastName2", $lastName2);
    $stmt->bindParam(":email", $email);
    $stmt->bindParam(":city", $city);
    $stmt->bindParam(":encryptedPassword", $encryptedPassword);
    $stmt->bindParam(":profileImage", $profileImageUrl);

    if ($stmt->execute()) {
        http_response_code(201);
        echo json_encode(["message" => "Usuario registrado exitosamente"]);
    } else {
        http_response_code(500);
        echo json_encode(["message" => "Error al registrar el usuario: " . $stmt->errorInfo()[2]]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error en el servidor: " . $e->getMessage()]);
}
?>