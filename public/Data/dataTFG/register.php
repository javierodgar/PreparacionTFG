<?php
// archivo: register.php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8"); // Esto puede ser application/json o dejarlo para que PHP lo determine
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Conexión a la base de datos (mantener tu configuración)
$host = "localhost";
$dbUsername = "root";
$dbPassword = "";
$dbName = "RegistroUsuarios";

try {
    $conn = new mysqli($host, $dbUsername, $dbPassword, $dbName);
    if ($conn->connect_error) {
        http_response_code(500);
        echo json_encode(["message" => "Error de conexión a la base de datos: " . $conn->connect_error]);
        exit;
    }

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
    // Procesar la carga de la imagen de perfil (usando $_FILES para el archivo)
    if (isset($_FILES['profileImage']) && $_FILES['profileImage']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = 'uploads/';
        $fileName = basename($_FILES['profileImage']['name']);
        $uniqueFileName = uniqid() . '_' . $fileName;
        $targetFilePath = $uploadDir . $uniqueFileName;

        $imageFileType = strtolower(pathinfo($targetFilePath, PATHINFO_EXTENSION));
        $allowedExtensions = array("jpg", "jpeg", "png", "gif");
        if (in_array($imageFileType, $allowedExtensions)) {
            if (move_uploaded_file($_FILES['profileImage']['tmp_name'], $targetFilePath)) {
                $profileImageName = $uniqueFileName;
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

    if($profileImageName){
        $profileImageUrl = "uploads/" . $profileImageName; 
    }

    // Preparar la consulta SQL para insertar los datos incluyendo la foto de perfil
    $stmt = $conn->prepare("INSERT INTO Usuarios (usuario, nombre, apellido1, apellido2, correo_electronico, ciudad_residencia, contrasena, profile_image) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("ssssssss", $username, $firstName, $lastName1, $lastName2, $email, $city, $encryptedPassword, $profileImageUrl);

    if ($stmt->execute()) {
        http_response_code(201);
        echo json_encode(["message" => "Usuario registrado exitosamente"]);
    } else {
        http_response_code(500);
        echo json_encode(["message" => "Error al registrar el usuario: " . $stmt->error]);
    }

    $stmt->close();
    $conn->close();

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error en el servidor: " . $e->getMessage()]);
}
?>