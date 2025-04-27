<?php
header("Access-Control-Allow-Origin: *"); // Cambia "*" por tu dominio si es necesario
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Manejo de solicitudes OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
// **Incluir configuración de la base de datos**
require_once '../db_config.php'; // Ajusta la ruta si es necesario

$data = json_decode(file_get_contents("php://input"));

if (empty($data->evento_id)) {
    http_response_code(400);
    echo json_encode(["message" => "Se requiere el ID del evento."]);
    exit;
}

$evento_id = $data->evento_id;

try {
    // **Desactivar el autocommit para asegurar la integridad transaccional**
    $pdo->beginTransaction();

    // 1. Eliminar inscripciones del evento
    $queryInscripciones = "DELETE FROM InscripcionesEventos WHERE evento_id = :evento_id";
    $stmtInscripciones = $pdo->prepare($queryInscripciones);
    $stmtInscripciones->bindParam(':evento_id', $evento_id, PDO::PARAM_INT);
    $stmtInscripciones->execute();

    // 2. Eliminar likes del evento
    $queryLikes = "DELETE FROM LikesDislikesEventos WHERE evento_id = :evento_id";
    $stmtLikes = $pdo->prepare($queryLikes);
    $stmtLikes->bindParam(':evento_id', $evento_id, PDO::PARAM_INT);
    $stmtLikes->execute();

    // 3. Eliminar comentarios del evento
    $queryComentarios = "DELETE FROM ComentariosEventos WHERE evento_id = :evento_id";
    $stmtComentarios = $pdo->prepare($queryComentarios);
    $stmtComentarios->bindParam(':evento_id', $evento_id, PDO::PARAM_INT);
    $stmtComentarios->execute();

    // 4. Eliminar el propio evento
    $queryEvento = "DELETE FROM Eventos WHERE id = :evento_id";
    $stmtEvento = $pdo->prepare($queryEvento);
    $stmtEvento->bindParam(':evento_id', $evento_id, PDO::PARAM_INT);
    $stmtEvento->execute();

    // **Si todas las operaciones fueron exitosas, confirmar la transacción**
    $pdo->commit();

    http_response_code(200);
    echo json_encode(["message" => "Evento y sus datos asociados eliminados exitosamente."]);

} catch (PDOException $e) {
    // **Si ocurre algún error, deshacer la transacción**
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(["message" => "Error al eliminar el evento y sus datos: " . $e->getMessage()]);
}
?>