<?php
// archivo: get_posts.php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Origin: http://localhost:4200");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200); // OK
    exit;
}

// **Configuración de la base de datos**
require_once 'db_config.php';

try {
    // La conexión PDO ya está disponible a través de $pdo incluido desde db_config.php

    // Consulta para obtener todas las publicaciones con el número de likes y dislikes
    $stmt = $pdo->prepare("
        SELECT
            p.id,
            p.usuario,
            p.imagen,
            p.titulo,
            p.texto,
            (SELECT COUNT(*) FROM LikesDislikes ld WHERE ld.publicacion_id = p.id AND ld.tipo = 'like') AS likes_count,
            (SELECT COUNT(*) FROM LikesDislikes ld WHERE ld.publicacion_id = p.id AND ld.tipo = 'dislike') AS dislikes_count
        FROM Publicaciones p
        ORDER BY p.fecha_creacion DESC
    ");
    $stmt->execute();
    $postsResult = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $posts = [];
    foreach ($postsResult as $row) {
        $post_id = $row["id"];

        // Consulta para obtener los hashtags de la publicación actual usando las tablas Hashtags y PublicacionHashtag
        $hashtags_stmt = $pdo->prepare("
            SELECT
                h.nombre
            FROM Hashtags h
            INNER JOIN PublicacionHashtag ph ON h.id = ph.hashtag_id
            WHERE ph.publicacion_id = :post_id
        ");
        $hashtags_stmt->bindParam(":post_id", $post_id, PDO::PARAM_INT);
        $hashtags_stmt->execute();
        $hashtagsResult = $hashtags_stmt->fetchAll(PDO::FETCH_COLUMN); // Obtener solo la columna 'nombre'

        $posts[] = [
            "id" => $row["id"],
            "usuario" => $row["usuario"],
            "imagen" => $row["imagen"],
            "titulo" => $row["titulo"],
            "texto" => $row["texto"],
            "hashtags" => $hashtagsResult, // Array de nombres de hashtags
            "likes_count" => $row["likes_count"], // Número de likes
            "dislikes_count" => $row["dislikes_count"] // Número de dislikes
        ];
    }

    http_response_code(200);
    echo json_encode(["message" => "Publicaciones obtenidas", "data" => $posts]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error en el servidor: " . $e->getMessage()]);
}
?>