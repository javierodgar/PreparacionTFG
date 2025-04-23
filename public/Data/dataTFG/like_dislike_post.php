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
$password = "root"; // Reemplaza con tu contraseña de tu base de datos
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

    // Obtener el ID del usuario que dio el like/dislike
    $queryUsuarioLiker = "SELECT id FROM Usuarios WHERE usuario = :username";
    $stmtUsuarioLiker = $pdo->prepare($queryUsuarioLiker);
    $stmtUsuarioLiker->bindParam(":username", $username, PDO::PARAM_STR);
    $stmtUsuarioLiker->execute();
    $usuarioLiker = $stmtUsuarioLiker->fetch(PDO::FETCH_ASSOC);

    if (!$usuarioLiker) {
        http_response_code(404);
        echo json_encode(["message" => "No se encontró el usuario que realizó la acción."]);
        exit;
    }

    $usuarioLikerId = $usuarioLiker['id'];

    // Obtener el ID del autor de la publicación
    $queryAutorPublicacion = "SELECT usuario FROM Publicaciones WHERE id = :publicacion_id";
    $stmtAutorPublicacion = $pdo->prepare($queryAutorPublicacion);
    $stmtAutorPublicacion->bindParam(":publicacion_id", $publicacionId, PDO::PARAM_INT);
    $stmtAutorPublicacion->execute();
    $autorPublicacion = $stmtAutorPublicacion->fetch(PDO::FETCH_ASSOC);

    if (!$autorPublicacion) {
        http_response_code(404);
        echo json_encode(["message" => "No se encontró la publicación."]);
        exit;
    }

    $autorUsername = $autorPublicacion['usuario'];

    // Verificar si ya existe una interacción del usuario con esta publicación
    $checkQuery = "SELECT id, tipo FROM LikesDislikes WHERE publicacion_id = :publicacion_id AND usuario_id = :usuario_id";
    $checkStmt = $pdo->prepare($checkQuery);
    $checkStmt->bindParam(":publicacion_id", $publicacionId, PDO::PARAM_INT);
    $checkStmt->bindParam(":usuario_id", $usuarioLikerId, PDO::PARAM_INT);
    $checkStmt->execute();
    $existingInteraction = $checkStmt->fetch(PDO::FETCH_ASSOC);

    $accionRegistrada = false; // Bandera para indicar si se insertó o actualizó la interacción

    if ($existingInteraction) {
        // Si ya existe una interacción, y es del mismo tipo, la eliminamos (deshacer like/dislike)
        if ($existingInteraction['tipo'] === $tipo) {
            $deleteQuery = "DELETE FROM LikesDislikes WHERE id = :id";
            $deleteStmt = $pdo->prepare($deleteQuery);
            $deleteStmt->bindParam(":id", $existingInteraction['id'], PDO::PARAM_INT);
            if ($deleteStmt->execute()) {
                http_response_code(200);
                echo json_encode(["message" => "Acción de " . $tipo . " eliminada."]);
                $accionRegistrada = true; // Aunque se eliminó, consideramos la acción registrada para la valoración
                $factorValoracion = ($tipo === 'like') ? -0.01 : 0.01; // Revertir el cambio
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
                $accionRegistrada = true;
                $factorValoracion = ($tipo === 'like') ? 0.02 : -0.02; // Cambio de dislike a like (+0.01 - (-0.01)) o viceversa
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
        $insertStmt->bindParam(":usuario_id", $usuarioLikerId, PDO::PARAM_INT);
        $insertStmt->bindParam(":tipo", $tipo, PDO::PARAM_STR);

        if ($insertStmt->execute()) {
            http_response_code(201);
            echo json_encode(["message" => "Acción de " . $tipo . " registrada."]);
            $accionRegistrada = true;
            $factorValoracion = ($tipo === 'like') ? 0.01 : -0.01;
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Error al registrar la acción."]);
            exit;
        }
    }

    // Actualizar la valoración global del autor de la publicación SI la acción se registró
    if ($accionRegistrada && isset($factorValoracion)) {
        $updateValoracionQuery = "UPDATE Usuarios SET valoracion_global = valoracion_global + :factor WHERE usuario = :autor_username";
        $updateValoracionStmt = $pdo->prepare($updateValoracionQuery);
        $updateValoracionStmt->bindParam(":factor", $factorValoracion, PDO::PARAM_STR);
        $updateValoracionStmt->bindParam(":autor_username", $autorUsername, PDO::PARAM_STR);

        if (!$updateValoracionStmt->execute()) {
            // Log del error de actualización de valoración (no crítico para la acción de like/dislike)
            error_log("Error al actualizar la valoración del usuario " . $autorUsername . ": " . print_r($updateValoracionStmt->errorInfo(), true));
        }
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error de base de datos: " . $e->getMessage()]);
}
?>