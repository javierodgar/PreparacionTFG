<?php
// Archivo: save_comment.php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Origin: http://localhost:4200"); // Permite el origen específico de Angular
header("Content-Type: application/json; charset=UTF-8");
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
    $queryComentario = "INSERT INTO comentarios (publicacion_id, usuario_id, texto, fecha_creacion) VALUES (:publicacion_id, :usuario_id, :texto, NOW())";

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
        echo json_encode(["message" => "Error al guardar el comentario." . $stmtComentario->errorInfo()[2]]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error de base de datos: " . $e->getMessage()]);
}
?>