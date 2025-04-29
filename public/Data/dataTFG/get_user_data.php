<?php
// archivo: data/get_user_data.php

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

$jsonData = file_get_contents("php://input");
$data = json_decode($jsonData, true);
$username = $data['username'] ?? null;

if (empty($username)) {
    http_response_code(400);
    echo json_encode(["message" => "Debes proporcionar un nombre de usuario"]);
    exit;
}

// **Configuración de la base de datos**
require_once 'db_config.php';

try {

    // Obtener ID del usuario por su nombre de usuario
    $stmtUserId = $pdo->prepare("SELECT id FROM Usuarios WHERE usuario = :username");
    $stmtUserId->bindParam(":username", $username);
    $stmtUserId->execute();
    $userResult = $stmtUserId->fetch(PDO::FETCH_ASSOC);

    if (!$userResult || !isset($userResult['id'])) {
        http_response_code(404);
        echo json_encode(["message" => "Usuario no encontrado"]);
        exit;
    }

    // Obtener datos del usuario
    $stmtUser = $pdo->prepare("SELECT usuario, nombre, apellido1, apellido2, correo_electronico, ciudad_residencia FROM Usuarios WHERE usuario = :username");
    $stmtUser->bindParam(":username", $username);
    $stmtUser->execute();
    $userData = $stmtUser->fetch(PDO::FETCH_ASSOC);

    if (!$userData) {
        http_response_code(404);
        echo json_encode(["message" => "Usuario no encontrado"]);
        exit;
    }

   
    // Obtener publicaciones del usuario y sus hashtags
    $stmtPosts = $pdo->prepare("SELECT id, imagen, titulo, texto FROM Publicaciones WHERE usuario = :username");
    $stmtPosts->bindParam(":username", $username);
    $stmtPosts->execute();
    $postsResult = $stmtPosts->fetchAll(PDO::FETCH_ASSOC);
    $posts = [];
    foreach ($postsResult as $postRow) {
        $postId = $postRow['id'];

        $hashtagsStmt = $pdo->prepare("
            SELECT h.nombre
            FROM Hashtags h
            INNER JOIN PublicacionHashtag ph ON h.id = ph.hashtag_id
            WHERE ph.publicacion_id = :postId
        ");
        $hashtagsStmt->bindParam(":postId", $postId, PDO::PARAM_INT);
        $hashtagsStmt->execute();
        $hashtagsResult = $hashtagsStmt->fetchAll(PDO::FETCH_COLUMN);
        $postRow['hashtags'] = $hashtagsResult;
        $posts[] = $postRow;
    }


     // Obtener eventos creados por el usuario
     $stmtEvents = $pdo->prepare("SELECT evt.id, evt.titulo, evt.descripcion, evt.categoria, evt.imagen_portada, evt.direccion, evt.fecha_inicio, evt.fecha_fin, evt.estado_id, e.nombre FROM Eventos evt 
	    inner join estadosevento e on e.id = evt.estado_id WHERE usuario_creador_id = :userId
     ");
     $stmtEvents->bindParam(":userId", $userResult['id'], PDO::PARAM_INT);
     $stmtEvents->execute();
     $eventsResult = $stmtEvents->fetchAll(PDO::FETCH_ASSOC);

    // Obtener usuarios a los que sigue (seguidos)
    $stmtFollowing = $pdo->prepare("SELECT seguido FROM Seguidores WHERE seguidor = :username");
    $stmtFollowing->bindParam(":username", $username);
    $stmtFollowing->execute();
    $followingResult = $stmtFollowing->fetchAll(PDO::FETCH_COLUMN);

    // Obtener usuarios que lo siguen (seguidores)
    $stmtFollowers = $pdo->prepare("SELECT seguidor FROM Seguidores WHERE seguido = :username");
    $stmtFollowers->bindParam(":username", $username);
    $stmtFollowers->execute();
    $followersResult = $stmtFollowers->fetchAll(PDO::FETCH_COLUMN);

    $response = [
        "message" => "Datos del usuario obtenidos",
        "user" => $userData,
        "posts" => $posts,
        "postCount" => count($posts),
        "following" => $followingResult,
        "followers" => $followersResult,
        "followingCount" => count($followingResult),
        "followersCount" => count($followersResult),
        "events" => $eventsResult,
        "eventCount" => count($eventsResult)
    ];

    http_response_code(200);
    echo json_encode($response);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error en el servidor: " . $e->getMessage()]);
}
?>