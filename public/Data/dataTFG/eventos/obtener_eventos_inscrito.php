<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS'); // Usaremos POST para enviar el nombre de usuario
header('Access-Control-Allow-Headers: Content-Type');
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");


if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    // Si es una petición OPTIONS, simplemente devolvemos un 200 OK
    http_response_code(200);
    exit;
}

require_once '../db_config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $nombre_usuario = isset($data['usuario']) ? filter_var($data['usuario'], FILTER_SANITIZE_FULL_SPECIAL_CHARS) : null;

    if ($nombre_usuario) {
        try {
            // 1. Obtener el ID del usuario a partir del nombre de usuario
            $stmt_usuario = $pdo->prepare("SELECT id FROM Usuarios WHERE usuario = :usuario");
            $stmt_usuario->bindParam(':usuario', $nombre_usuario, PDO::PARAM_STR);
            $stmt_usuario->execute();
            $usuario = $stmt_usuario->fetch(PDO::FETCH_ASSOC);

            if ($usuario) {
                $usuario_id = $usuario['id'];

                // 2. Comprobar si el usuario está inscrito en eventos cuya fecha de finalización no ha pasado
                $stmt_eventos = $pdo->prepare("SELECT e.id, e.titulo, e.descripcion, e.categoria, e.imagen_portada, e.direccion, e.fecha_inicio, e.fecha_fin
                                              FROM InscripcionesEventos ie
                                              INNER JOIN Eventos e ON ie.evento_id = e.id
                                              WHERE ie.usuario_id = :usuario_id AND e.fecha_fin >= CURDATE()");
                $stmt_eventos->bindParam(':usuario_id', $usuario_id, PDO::PARAM_INT);
                $stmt_eventos->execute();
                $eventos_inscrito = $stmt_eventos->fetchAll(PDO::FETCH_ASSOC);

                echo json_encode($eventos_inscrito);

            } else {
                echo json_encode(['mensaje' => 'No se encontró el usuario.']);
                http_response_code(404);
            }

        } catch (PDOException $e) {
            echo json_encode(['error' => 'Error al consultar la base de datos: ' . $e->getMessage()]);
            http_response_code(500);
        }

    } else {
        echo json_encode(['error' => 'Se requiere el nombre de usuario.']);
        http_response_code(400);
    }

} else {
    echo json_encode(['error' => 'Método no permitido. Se espera POST.']);
    http_response_code(405);
}
?>