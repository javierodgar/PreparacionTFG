<?php
// archivo: get_hashtags.php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Conexión a la base de datos
$host = "localhost";
$dbUsername = "root";
$dbPassword = "root";
$dbName = "RegistroUsuarios";

try {
    $conn = new mysqli($host, $dbUsername, $dbPassword, $dbName);

    if ($conn->connect_error) {
        http_response_code(500);
        echo json_encode(["error" => "Error de conexión a la base de datos: " . $conn->connect_error]);
        exit;
    }

    // Obtener el término de búsqueda
    $query = isset($_GET['query']) ? $_GET['query'] : '';

    $hashtags = [];
    if (!empty($query)) {
        $stmt = $conn->prepare("SELECT nombre FROM Hashtags WHERE nombre LIKE ? LIMIT 10"); // Limitar los resultados
        $searchTerm = '%' . $query . '%';
        $stmt->bind_param("s", $searchTerm);
        $stmt->execute();
        $result = $stmt->get_result();

        while ($row = $result->fetch_assoc()) {
            $hashtags[] = ['name' => $row['nombre']];
        }

        $stmt->close();
    } else {
        // Si no hay consulta, podrías devolver los hashtags más comunes o un array vacío
        // Por ahora, devolvemos un array vacío
    }

    $conn->close();

    echo json_encode($hashtags);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => "Error en el servidor: " . $e->getMessage()]);
}
?>