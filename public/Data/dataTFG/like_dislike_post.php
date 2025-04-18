<?php
// Archivo: like_dislike_post.php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Origin: http://localhost:4200"); // Permite el origen específico de Angular
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
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
    // Obtener datos del cuerpo de la petición
    $data = json_decode(file_get_contents("php://input"));

    // Verificar que se recibieron los datos necesarios
    if (empty($data->publicacion_id) || empty($data->username) || empty($data->tipo) || !in_array($data->tipo, ['like', 'dislike'])) {
        http_response_code(400);
        echo json_encode(["message" => "Datos incompletos o tipo de acción inválido."]);
        exit;
    }

    $publicacionId = intval($data->publicacion_id);
    $username = $data->username;
    $tipo = $data->tipo;

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

    $usuarioId = $usuario['id'];

    // Verificar si ya existe una interacción del usuario con esta publicación
    $checkQuery = "SELECT id, tipo FROM LikesDislikes WHERE publicacion_id = :publicacion_id AND usuario_id = :usuario_id";
    $checkStmt = $pdo->prepare($checkQuery);
    $checkStmt->bindParam(":publicacion_id", $publicacionId, PDO::PARAM_INT);
    $checkStmt->bindParam(":usuario_id", $usuarioId, PDO::PARAM_INT);
    $checkStmt->execute();
    $existingInteraction = $checkStmt->fetch(PDO::FETCH_ASSOC);

    if ($existingInteraction) {
        // Si ya existe una interacción, y es del mismo tipo, la eliminamos (deshacer like/dislike)
        if ($existingInteraction['tipo'] === $tipo) {
            $deleteQuery = "DELETE FROM LikesDislikes WHERE id = :id";
            $deleteStmt = $pdo->prepare($deleteQuery);
            $deleteStmt->bindParam(":id", $existingInteraction['id'], PDO::PARAM_INT);
            if ($deleteStmt->execute()) {
                http_response_code(200);
                echo json_encode(["message" => "Acción de " . $tipo . " eliminada."]);
                exit;
            } else {
                http_response_code(500);
                echo json_encode(["message" => "Error al eliminar la acción de " . $tipo . "."]);
                exit;
            }
        } else {
            // Si ya existe una interacción pero es de tipo diferente, la actualizamos
            $updateQuery = "UPDATE LikesDislikes SET tipo = :tipo, fecha_accion = CURRENT_TIMESTAMP WHERE id = :id";
            $updateStmt = $pdo->prepare($updateQuery);
            $updateStmt->bindParam(":tipo", $tipo, PDO::PARAM_STR);
            $updateStmt->bindParam(":id", $existingInteraction['id'], PDO::PARAM_INT);
            if ($updateStmt->execute()) {
                http_response_code(200);
                echo json_encode(["message" => "Acción actualizada a " . $tipo . "."]);
                exit;
            } else {
                http_response_code(500);
                echo json_encode(["message" => "Error al actualizar la acción."]);
                exit;
            }
        }
    } else {
        // Si no existe interacción, insertamos la nueva
        $insertQuery = "INSERT INTO LikesDislikes (publicacion_id, usuario_id, tipo) VALUES (:publicacion_id, :usuario_id, :tipo)";
        $insertStmt = $pdo->prepare($insertQuery);
        $insertStmt->bindParam(":publicacion_id", $publicacionId, PDO::PARAM_INT);
        $insertStmt->bindParam(":usuario_id", $usuarioId, PDO::PARAM_INT);
        $insertStmt->bindParam(":tipo", $tipo, PDO::PARAM_STR);

        if ($insertStmt->execute()) {
            http_response_code(201);
            echo json_encode(["message" => "Acción de " . $tipo . " registrada."]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Error al registrar la acción."]);
        }
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error de base de datos: " . $e->getMessage()]);
}
?>