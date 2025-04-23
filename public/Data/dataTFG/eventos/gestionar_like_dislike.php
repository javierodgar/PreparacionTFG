<?php
// gestionar_like_dislike.php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Manejar solicitudes preflight (OPTIONS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200); // OK
    exit;
}

require_once '../db_config.php'; // Ajusta la ruta si es necesario

try {
    $data = json_decode(file_get_contents("php://input"));

    $evento_id = isset($data->evento_id) ? filter_var($data->evento_id, FILTER_SANITIZE_NUMBER_INT) : null;
    $username = isset($data->username) ? filter_var($data->username, FILTER_SANITIZE_STRING) : null;
    $tipo = isset($data->tipo) ? filter_var($data->tipo, FILTER_SANITIZE_STRING) : null; // 'like' o 'dislike'

    if (empty($evento_id) || $evento_id <= 0 || empty($tipo) || !in_array($tipo, ['like', 'dislike']) || empty($username)) {
        http_response_code(400);
        echo json_encode(["message" => "Datos de like/dislike no válidos."]);
        exit;
    }

    // Obtener el ID del usuario basado en el username
    $user_id_query = "SELECT id FROM Usuarios WHERE usuario = :username";
    $user_id_stmt = $pdo->prepare($user_id_query);
    $user_id_stmt->bindParam(':username', $username);
    $user_id_stmt->execute();
    $user = $user_id_stmt->fetch(PDO::FETCH_ASSOC);
    $usuario_id = $user ? $user['id'] : null;

    if (!$usuario_id) {
        http_response_code(404);
        echo json_encode(["message" => "Usuario no encontrado."]);
        exit;
    }

    // Verificar si ya existe un like/dislike del usuario para este evento
    $check_query = "SELECT id, tipo FROM LikesDislikesEventos WHERE evento_id = :evento_id AND usuario_id = :usuario_id";
    $check_stmt = $pdo->prepare($check_query);
    $check_stmt->bindParam(':evento_id', $evento_id, PDO::PARAM_INT);
    $check_stmt->bindParam(':usuario_id', $usuario_id, PDO::PARAM_INT);
    $check_stmt->execute();
    $existing_like = $check_stmt->fetch(PDO::FETCH_ASSOC);

    if ($existing_like) {
        // Si ya existe, actualizar el tipo o eliminar si es el mismo
        if ($existing_like['tipo'] === $tipo) {
            $delete_query = "DELETE FROM LikesDislikesEventos WHERE id = :like_id";
            $delete_stmt = $pdo->prepare($delete_query);
            $delete_stmt->bindParam(':like_id', $existing_like['id'], PDO::PARAM_INT);
            if ($delete_stmt->execute()) {
                http_response_code(200);
                echo json_encode(["message" => "Like/dislike eliminado."]);
            } else {
                http_response_code(500);
                echo json_encode(["message" => "Error al eliminar like/dislike."]);
            }
        } else {
            $update_query = "UPDATE LikesDislikesEventos SET tipo = :tipo WHERE id = :like_id";
            $update_stmt = $pdo->prepare($update_query);
            $update_stmt->bindParam(':tipo', $tipo);
            $update_stmt->bindParam(':like_id', $existing_like['id'], PDO::PARAM_INT);
            if ($update_stmt->execute()) {
                http_response_code(200);
                echo json_encode(["message" => "Like/dislike actualizado a " . $tipo . "."]);
            } else {
                http_response_code(500);
                echo json_encode(["message" => "Error al actualizar like/dislike."]);
            }
        }
    } else {
        // Si no existe, insertar el nuevo like/dislike
        $insert_query = "INSERT INTO LikesDislikesEventos (evento_id, usuario_id, tipo) VALUES (:evento_id, :usuario_id, :tipo)";
        $insert_stmt = $pdo->prepare($insert_query);
        $insert_stmt->bindParam(':evento_id', $evento_id, PDO::PARAM_INT);
        $insert_stmt->bindParam(':usuario_id', $usuario_id, PDO::PARAM_INT);
        $insert_stmt->bindParam(':tipo', $tipo);
        if ($insert_stmt->execute()) {
            http_response_code(201);
            echo json_encode(["message" => "Evento " . $tipo . "d."]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Error al dar " . $tipo . " al evento."]);
        }
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error de base de datos: " . $e->getMessage()]);
}
?>