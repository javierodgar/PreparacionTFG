<?php
// Archivo: get_post_coments.php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Origin: http://localhost:4200");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// **Configuración de la base de datos**
require_once 'db_config.php';


try {
    $publicacionId = $_GET['publicacion_id'] ?? null;

    if ($publicacionId === null || !is_numeric($publicacionId)) {
        http_response_code(400);
        echo json_encode(["message" => "Se requiere un ID de publicación válido."]);
        exit;
    }

    // Obtener los datos de la publicación
    $queryPublicacion = "SELECT p.id, p.usuario AS usuario_id_publicacion, u_pub.usuario AS nombre_usuario_publicacion, p.imagen, p.titulo, p.texto, COUNT(CASE WHEN lik.tipo = 'like' THEN 1 END) AS total_likes, COUNT(CASE WHEN lik.tipo = 'dislike' THEN 1 END) AS total_dislikes
                         FROM Publicaciones p
                         INNER JOIN Usuarios u_pub ON p.usuario = u_pub.usuario
                         LEFT JOIN LikesDislikes lik ON lik.publicacion_id = p.id
                         WHERE p.id = :publicacion_id";
    $stmtPublicacion = $pdo->prepare($queryPublicacion);
    $stmtPublicacion->bindParam(':publicacion_id', $publicacionId, PDO::PARAM_INT);
    $stmtPublicacion->execute();
    $publicacion = $stmtPublicacion->fetch(PDO::FETCH_ASSOC);

    if (!$publicacion) {
        http_response_code(404);
        echo json_encode(["message" => "No se encontró la publicación con el ID proporcionado."]);
        exit;
    }

    // Obtener los hashtags asociados a la publicación
    $queryHashtags = "SELECT h.nombre
                      FROM Hashtags h
                      INNER JOIN PublicacionHashtag ph ON h.id = ph.hashtag_id
                      WHERE ph.publicacion_id = :publicacion_id";
    $stmtHashtags = $pdo->prepare($queryHashtags);
    $stmtHashtags->bindParam(':publicacion_id', $publicacionId, PDO::PARAM_INT);
    $stmtHashtags->execute();
    $hashtagsResult = $stmtHashtags->fetchAll(PDO::FETCH_COLUMN); // Obtener solo la columna 'nombre'
    $publicacion['hashtags'] = $hashtagsResult;

    // Obtener los comentarios asociados a la publicación junto con el nombre de usuario del autor
    $queryComentarios = "SELECT c.id AS comentario_id, c.texto AS comentario_texto, c.fecha_creacion AS comentario_fecha_creacion,
                                     u_com.usuario AS nombre_usuario_comentario
                         FROM Comentarios c
                         INNER JOIN Usuarios u_com ON c.usuario_id = u_com.id
                         WHERE c.publicacion_id = :publicacion_id
                         ORDER BY c.fecha_creacion ASC";
    $stmtComentarios = $pdo->prepare($queryComentarios);
    $stmtComentarios->bindParam(':publicacion_id', $publicacionId, PDO::PARAM_INT);
    $stmtComentarios->execute();
    $comentarios = $stmtComentarios->fetchAll(PDO::FETCH_ASSOC);

    // Agregar los comentarios a la información de la publicación
    $publicacion['comentarios'] = $comentarios;

    http_response_code(200);
    echo json_encode($publicacion);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error al obtener la publicación y sus comentarios: " . $e->getMessage()]);
}
?>