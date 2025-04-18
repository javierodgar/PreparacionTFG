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

$host = "localhost";
$dbUsername = "root";
$dbPassword = "root";
$dbName = "RegistroUsuarios";

try {
    $conn = new mysqli($host, $dbUsername, $dbPassword, $dbName);

    if ($conn->connect_error) {
        http_response_code(500);
        echo json_encode(["message" => "Error de conexión: " . $conn->connect_error]);
        exit;
    }

    // Consulta para obtener todas las publicaciones
    $stmt = $conn->prepare("
        SELECT
            p.id,
            p.usuario,
            p.imagen,
            p.titulo,
            p.texto
        FROM Publicaciones p ORder by p.fecha_creacion DESC
    ");
    $stmt->execute();
    $result = $stmt->get_result();

    $posts = [];
    while ($row = $result->fetch_assoc()) {
        $post_id = $row["id"];

        // Consulta para obtener los hashtags de la publicación actual usando las tablas Hashtags y PublicacionHashtag
        $hashtags_stmt = $conn->prepare("
            SELECT
                h.nombre
            FROM Hashtags h
            INNER JOIN PublicacionHashtag ph ON h.id = ph.hashtag_id
            WHERE ph.publicacion_id = ?
        ");
        $hashtags_stmt->bind_param("i", $post_id);
        $hashtags_stmt->execute();
        $hashtags_result = $hashtags_stmt->get_result();

        $hashtags = [];
        while ($hashtag_row = $hashtags_result->fetch_assoc()) {
            $hashtags[] = $hashtag_row["nombre"];
        }

        $posts[] = [
            "id" => $row["id"],
            "usuario" => $row["usuario"],
            "imagen" => $row["imagen"],
            "titulo" => $row["titulo"],
            "texto" => $row["texto"],
            "hashtags" => $hashtags // Array de nombres de hashtags
        ];

        $hashtags_stmt->close();
    }

    http_response_code(200);
    echo json_encode(["message" => "Publicaciones obtenidas", "data" => $posts]);

    $stmt->close();
    $conn->close();

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error en el servidor: " . $e->getMessage()]);
}
?>