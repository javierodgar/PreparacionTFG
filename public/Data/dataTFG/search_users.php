<?php
// Archivo: search_users.php
// ... (cabeceras y conexión a la base de datos como en tu search.php)

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Origin: http://localhost:4200");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS"); // Permite todos los métodos comunes
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With"); // Cabeceras específicas permitidas


if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200); // OK
    exit; // Terminar ejecución ya que no se necesita procesar más
}

// Incluir archivo de conexión a la base de datos
require_once 'db_config.php';

try {
    $term = isset($_GET['term']) ? trim($_GET['term']) : '';
    $results = [];

    $stmt_user = $pdo->prepare("SELECT id, usuario FROM Usuarios WHERE usuario LIKE :term");
    $stmt_user->bindValue(':term', '%' . $term . '%', PDO::PARAM_STR);
    $stmt_user->execute();
    while ($row = $stmt_user->fetch(PDO::FETCH_ASSOC)) {
        $results[] = ['tipo' => 'usuario', 'id' => $row['id'], 'nombre_usuario' => $row['usuario']];
    }

    echo json_encode($results);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error de base de datos: " . $e->getMessage()]);
}
?>