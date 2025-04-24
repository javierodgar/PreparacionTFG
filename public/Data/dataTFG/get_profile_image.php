<?php
// archivo: data/get_profile_image.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Origin: http://localhost:4200"); // Permite el origen específico de Angular
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS"); // Permite todos los métodos comunes
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With"); // Cabeceras específicas permitidas

$jsonData = file_get_contents("php://input");
$data = json_decode($jsonData, true);
$username = $data['username'] ?? null;

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200); // OK
    exit; // Terminar ejecución ya que no se necesita procesar más
}
if (empty($username)) {
    http_response_code(400);
    echo json_encode(["message" => "Debes proporcionar un nombre de usuario"]);
    exit;
}

require_once 'db_config.php';

try {
    $stmt = $pdo->prepare("SELECT profile_image FROM Usuarios WHERE usuario = :username");
    $stmt->bindParam(":username", $username);
    $stmt->execute();
    $userData = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($userData && $userData['profile_image']) {
        http_response_code(200);
        echo json_encode([
            "message" => "Imagen de perfil obtenida",
            "profile_image" => $userData['profile_image']
        ]);
    } else {
        http_response_code(404);
        echo json_encode(["message" => "Imagen de perfil no encontrada para el usuario"]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error en el servidor: " . $e->getMessage()]);
}
?>