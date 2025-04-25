<?php
header("Access-Control-Allow-Origin: http://localhost:4200"); // Permitir solo localhost:4200
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Manejar solicitudes preflight (OPTIONS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200); // Respuesta OK
    exit;
}

include_once '../db_config.php'; // Asegúrate de que la ruta sea correcta

// Inicializar la conexión PDO desde el archivo de configuración
$db = $pdo;

// Verificar si se proporcionó un ID
if (isset($_GET['id'])) {
    $id = htmlspecialchars(strip_tags($_GET['id']));

    $query = "SELECT
                id,
                titulo,
                descripcion,
                categoria,
                imagen_portada,
                direccion,
                fecha_inicio,
                fecha_fin,
                ST_X(coordenadas) AS longitud,
                ST_Y(coordenadas) AS latitud
            FROM
                Eventos
            WHERE
                id = :id";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $id);

    if ($stmt->execute()) {
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($row) {
            // Establecer código de respuesta 200 OK
            http_response_code(200);

            // Devolver los datos del evento en formato JSON
            echo json_encode($row);
        } else {
            // Si no se encuentra el evento con el ID proporcionado
            http_response_code(404);
            echo json_encode(array("message" => "No se encontró ningún evento con el ID proporcionado."));
        }
    } else {
        // Si hay un error en la consulta
        http_response_code(500);
        echo json_encode(array("message" => "Error al ejecutar la consulta."));
    }
} else {
    // Si no se proporciona el parámetro 'id'
    http_response_code(400);
    echo json_encode(array("message" => "Por favor, proporciona un ID de evento."));
}
?>