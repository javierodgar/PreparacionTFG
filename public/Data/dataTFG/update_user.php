<?php
// archivo: data/update_user.php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Origin: http://localhost:4200"); // Permite el origen específico de Angular
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS"); // Permite todos los métodos comunes
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200); // OK
    exit; // Terminar ejecución ya que no se necesita procesar más
}
// Obtener datos del formulario (esperamos multipart/form-data)
$username = $_POST["usuario"] ?? null;
$newUsername = $_POST["usuarioNuevo"] ?? null;
$nombre = $_POST["nombre"] ?? null;
$apellido1 = $_POST["apellido1"] ?? null;
$apellido2 = $_POST["apellido2"] ?? null; // Puede ser vacío o null
$email = $_POST["correo_electronico"] ?? null;
$ciudad = $_POST["ciudad_residencia"] ?? null;

// Validar campos obligatorios
if (empty($username) || empty($nombre) || empty($apellido1) || empty($email) || empty($ciudad)) {
    http_response_code(400);
    echo json_encode(["message" => "Faltan datos obligatorios"]);
    exit;
}

// Manejar la imagen de perfil (opcional)
$profileImage = null;
if (isset($_FILES["profile_image"]) && $_FILES["profile_image"]["error"] === UPLOAD_ERR_OK) {
    $uploadDir = "uploads/"; // Carpeta donde se guardarán las imágenes
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0777, true); // Crear la carpeta si no existe
    }
    $imageName = uniqid() . "_" . basename($_FILES["profile_image"]["name"]); // Nombre único para evitar conflictos
    $profileImage = $uploadDir . $imageName;
    if (!move_uploaded_file($_FILES["profile_image"]["tmp_name"], $profileImage)) {
        http_response_code(500);
        echo json_encode(["message" => "Error al subir la imagen de perfil"]);
        exit;
    }
}

$host = "localhost";
$dbUsername = "root";
$dbPassword = "root";
$dbName = "RegistroUsuarios";



try {
    $conn = new mysqli($host, $dbUsername, $dbPassword, $dbName);

    $quert = $conn->prepare("SELECT id FROM Usuarios WHERE usuario = ?");
    $quert->bind_param("s", $username);
    $quert->execute();
    $quert->store_result();

    $id_usuario = null; // Inicializa la variable donde guardarás el ID

    $quert->bind_result($id_usuario); // Vincula la columna 'id' a la variable $id_usuario
    $quert->fetch(); //obtiene el primre resutlado (el unico que se espera recibir)

    if ($conn->connect_error) {
        http_response_code(500);
        echo json_encode(["message" => "Error de conexión: " . $conn->connect_error]);
        exit;
    }

    // Preparar la consulta dependiendo de si hay imagen o no
    if ($profileImage) {
        $stmt = $conn->prepare("UPDATE Usuarios SET usuario = ?, nombre = ?, apellido1 = ?, apellido2 = ?, correo_electronico = ?, ciudad_residencia = ?, profile_image = ? WHERE id = ?");
        $stmt->bind_param("ssssssss", $newUsername, $nombre, $apellido1, $apellido2, $email, $ciudad, $profileImage, $id_usuario);
    } else {
        $stmt = $conn->prepare("UPDATE Usuarios SET usuario = ?,nombre = ?, apellido1 = ?, apellido2 = ?, correo_electronico = ?, ciudad_residencia = ? WHERE id = ?");
        $stmt->bind_param("sssssss", $newUsername, $nombre, $apellido1, $apellido2, $email, $ciudad, $id_usuario);
    }

    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            http_response_code(200);
            echo json_encode(["message" => "Datos del usuario actualizados exitosamente"]);

            // Preparar la consulta SQL
            $sql = "UPDATE Publicaciones
                SET usuario = ?
                WHERE usuario = ?
                ";

            // Preparar la sentencia
            $stmt = $conn->prepare($sql);

            $stmt->bind_param("ss", $newUsername, $username);

            $stmt->execute();


        } elseif ($profileImage) {
            http_response_code(200);
            echo json_encode(["message" => "Imagen de perfil actualizada exitosamente"]);
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