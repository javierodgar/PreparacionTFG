<?php
// archivo: get_posts.php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    http_response_code(405);
    echo json_encode(["message" => "Método no permitido"]);
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
    $stmt = $conn->prepare("SELECT id, usuario, imagen, titulo, texto, hashtags FROM Publicaciones");
    $stmt->execute();
    $result = $stmt->get_result();

    $posts = [];
    while ($row = $result->fetch_assoc()) {
        $posts[] = [
            "id" => $row["id"],
            "usuario" => $row["usuario"],
            "imagen" => $row["imagen"], // Será null si no hay imagen
            "titulo" => $row["titulo"],
            "texto" => $row["texto"],
            "hashtags" => $row["hashtags"]
        ];
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