<?php
// Archivo: get_likes_dislikes.php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Origin: http://localhost:4200"); // Permite el origen específico de Angular
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS"); // Permite todos los métodos comunes

// **Configuración de la base de datos**
$host = "localhost"; // Reemplaza con tu host
$dbname = "RegistroUsuarios"; // Reemplaza con el nombre de tu base de datos
$user = "root"; // Reemplaza con tu usuario de base de datos
$password = "root"; // Reemplaza con tu contraseña de base de datos
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200); // OK
    exit; // Terminar ejecución ya que no se necesita procesar más
}
try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error al conectar a la base de datos: " . $e->getMessage()]);
    exit;
}

try {
    // Verificar si se proporcionó el ID de la publicación
    $publicacionId = isset($_GET['publicacion_id']) ? intval($_GET['publicacion_id']) : null;

    if ($publicacionId === null || $publicacionId <= 0) {
        http_response_code(400);
        echo json_encode(["message" => "Se requiere un ID de publicación válido."]);
        exit;
    }

    // Consulta SQL para obtener el total de likes y dislikes
    $query = "SELECT
                COUNT(CASE WHEN tipo = 'like' THEN 1 END) AS total_likes,
                COUNT(CASE WHEN tipo = 'dislike' THEN 1 END) AS total_dislikes
              FROM
                likesdislikes
              WHERE
                publicacion_id = :publicacion_id";

    $stmt = $pdo->prepare($query);
    $stmt->bindParam(":publicacion_id", $publicacionId, PDO::PARAM_INT);
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($result) {
        http_response_code(200);
        echo json_encode($result);
    } else {
        http_response_code(200);
        echo json_encode(["total_likes" => 0, "total_dislikes" => 0]); // Si no hay likes/dislikes
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error de base de datos: " . $e->getMessage()]);
}
?>