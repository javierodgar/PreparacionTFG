<?php
// Archivo: save_comment.php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// **Configuración de la base de datos**
$host = "localhost"; // Reemplaza con tu host
$dbname = "RegistroUsuarios"; // Reemplaza con el nombre de tu base de datos
$user = "root"; // Reemplaza con tu usuario de base de datos
$password = ""; // Reemplaza con tu contraseña de base de datos

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error al conectar a la base de datos: " . $e->getMessage()]);
    exit;
}

try {
    // Obtener los datos enviados por POST
    $data = json_decode(file_get_contents("php://input"));

    // Verificar que se recibieron los datos necesarios
    if (empty($data->publicacion_id) || empty($data->username) || empty($data->texto)) {
        http_response_code(400);
        echo json_encode(["message" => "No se proporcionaron todos los datos necesarios para guardar el comentario."]);
        exit;
    }

    // Asignar los valores a variables
    $publicacionId = intval($data->publicacion_id);
    $username = $data->username;
    $texto = htmlspecialchars(strip_tags($data->texto)); // Sanear el texto para evitar XSS

    // Obtener id del usuario usando PDO
    $queryUsuario = "SELECT id FROM Usuarios WHERE usuario = :username";
    $stmtUsuario = $pdo->prepare($queryUsuario);
    $stmtUsuario->bindParam(":username", $username, PDO::PARAM_STR);
    $stmtUsuario->execute();
    $usuario = $stmtUsuario->fetch(PDO::FETCH_ASSOC);

    if (!$usuario) {
        http_response_code(404);
        echo json_encode(["message" => "No se encontró el usuario con el nombre de usuario proporcionado."]);
        exit;
    }

    $id_usuario = $usuario['id'];

    // Consulta SQL para insertar el comentario
    $queryComentario = "INSERT INTO comentarios (publicacion_id, usuario_id, texto) VALUES (:publicacion_id, :usuario_id, :texto)";

    // Preparar la consulta del comentario
    $stmtComentario = $pdo->prepare($queryComentario);

    // Bind de los parámetros del comentario
    $stmtComentario->bindParam(":publicacion_id", $publicacionId, PDO::PARAM_INT);
    $stmtComentario->bindParam(":usuario_id", $id_usuario, PDO::PARAM_INT);
    $stmtComentario->bindParam(":texto", $texto, PDO::PARAM_STR);

    // Ejecutar la consulta del comentario
    if ($stmtComentario->execute()) {
        http_response_code(201); // Creado
        echo json_encode(["message" => "Comentario guardado exitosamente."]);
    } else {
        http_response_code(500);
        echo json_encode(["message" => "Error al guardar el comentario."]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error de base de datos: " . $e->getMessage()]);
}
?>