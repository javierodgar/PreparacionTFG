<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Origin: http://localhost:4200");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
// Incluir el archivo de configuración de la base de datos
require_once 'db_config.php';
if (isset($_GET['id'])) {
    $publicacionId = filter_input(INPUT_GET, 'id', FILTER_SANITIZE_NUMBER_INT);
    if ($publicacionId) {
        try {
            // Obtener la información básica de la publicación
            $stmt_post = $pdo->prepare("SELECT id, usuario, imagen, titulo, texto, fecha_creacion FROM Publicaciones WHERE id = :id");
            $stmt_post->bindParam(':id', $publicacionId, PDO::PARAM_INT);
            $stmt_post->execute();
            $publicacion = $stmt_post->fetch(PDO::FETCH_ASSOC);

            if ($publicacion) {
                // Obtener los hashtags relacionados con la publicación
                $queryHashtags = "SELECT h.nombre
                                    FROM Hashtags h
                                    INNER JOIN PublicacionHashtag ph ON h.id = ph.hashtag_id
                                    WHERE ph.publicacion_id = :publicacion_id";
                $stmtHashtags = $pdo->prepare($queryHashtags);
                $stmtHashtags->bindParam(':publicacion_id', $publicacionId, PDO::PARAM_INT);
                $stmtHashtags->execute();
                $hashtagsResult = $stmtHashtags->fetchAll(PDO::FETCH_COLUMN); // Obtener solo la columna 'nombre'
                $publicacion['hashtags'] = $hashtagsResult;

                echo json_encode($publicacion);
            } else {
                echo json_encode(['mensaje' => 'No se encontró la publicación con el ID proporcionado.']);
                http_response_code(404);
            }
        } catch(PDOException $e) {
            echo json_encode(['error' => 'Error al consultar la base de datos: ' . $e->getMessage()]);
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

// No es necesario cerrar la conexión aquí, se cerrará automáticamente al finalizar el script
?>