<?php
// obtener_eventos.php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
// **Incluir configuración de la base de datos**
require_once '../db_config.php'; // Ajusta la ruta si es necesario

try {
    $stmt = $pdo->prepare("SELECT id, titulo, descripcion, categoria, imagen_portada, direccion, fecha_creacion, fecha_inicio, fecha_fin, usuario_creador_id FROM Eventos");
    $stmt->execute();
    $eventos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($eventos);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error al obtener los eventos: " . $e->getMessage()]);
}
?>