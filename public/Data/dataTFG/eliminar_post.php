<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'db_config.php';

if (isset($_GET['id'])) {
    $publicacion_id = filter_input(INPUT_GET, 'id', FILTER_SANITIZE_NUMBER_INT);

    if ($publicacion_id) {
        try {
            // Iniciar transacción para asegurar la integridad
            $pdo->beginTransaction();

            // 1. Eliminar las relaciones en PublicacionHashtag
            $stmt_delete_hashtag_relations = $pdo->prepare("DELETE FROM PublicacionHashtag WHERE publicacion_id = :publicacion_id");
            $stmt_delete_hashtag_relations->bindParam(':publicacion_id', $publicacion_id, PDO::PARAM_INT);
            $stmt_delete_hashtag_relations->execute();

            // 2. Eliminar los likes y dislikes
            $stmt_delete_likes_dislikes = $pdo->prepare("DELETE FROM LikesDislikes WHERE publicacion_id = :publicacion_id");
            $stmt_delete_likes_dislikes->bindParam(':publicacion_id', $publicacion_id, PDO::PARAM_INT);
            $stmt_delete_likes_dislikes->execute();

            // 3. Eliminar los comentarios
            $stmt_delete_comentarios = $pdo->prepare("DELETE FROM Comentarios WHERE publicacion_id = :publicacion_id");
            $stmt_delete_comentarios->bindParam(':publicacion_id', $publicacion_id, PDO::PARAM_INT);
            $stmt_delete_comentarios->execute();

            // 4. Obtener la ruta de la imagen antes de eliminar la publicación
            $stmt_get_image = $pdo->prepare("SELECT imagen FROM Publicaciones WHERE id = :publicacion_id");
            $stmt_get_image->bindParam(':publicacion_id', $publicacion_id, PDO::PARAM_INT);
            $stmt_get_image->execute();
            $result_image = $stmt_get_image->fetch(PDO::FETCH_ASSOC);
            $ruta_imagen = $result_image ? $result_image['imagen'] : null;

            // 5. Eliminar la publicación
            $stmt_delete_publicacion = $pdo->prepare("DELETE FROM Publicaciones WHERE id = :publicacion_id");
            $stmt_delete_publicacion->bindParam(':publicacion_id', $publicacion_id, PDO::PARAM_INT);
            if ($stmt_delete_publicacion->execute()) {
                // 6. Si la publicación tenía una imagen asociada, intentar eliminar el archivo
                if ($ruta_imagen && file_exists($ruta_imagen) && strpos($ruta_imagen, 'uploads/') !== false) {
                    unlink($ruta_imagen);
                }

                $pdo->commit();
                echo json_encode(['mensaje' => 'Publicación eliminada con éxito.']);
            } else {
                $pdo->rollBack();
                echo json_encode(['error' => 'Error al eliminar la publicación.']);
                http_response_code(500);
            }

        } catch(PDOException $e) {
            $pdo->rollBack();
            echo json_encode(['error' => 'Error al eliminar la publicación y sus relaciones: ' . $e->getMessage()]);
            http_response_code(500);
        }
    } else {
        echo json_encode(['error' => 'ID de publicación no válido.']);
        http_response_code(400);
    }
} else {
    echo json_encode(['error' => 'Se requiere el ID de la publicación.']);
    http_response_code(400);
}
?>