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
// Incluir el archivo de configuración de la base de datos
require_once '../db_config.php';

// Inicializar la conexión PDO desde el archivo de configuración
$db = $pdo;

if (isset($_GET['id'])) {
    $id = htmlspecialchars(strip_tags($_GET['id']));
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Por favor, proporciona el ID del evento a actualizar."));
    exit;
}

// Obtener los datos del evento actualizado desde el cuerpo de la petición
$data = json_decode(file_get_contents("php://input"));

// Verificar que los datos necesarios estén presentes
if (
    !empty($data->titulo) &&
    !empty($data->categoria) &&
    !empty($data->direccion) &&
    !empty($data->fecha_inicio) &&
    !empty($data->fecha_fin) &&
    isset($data->latitud) &&
    isset($data->longitud)
) {
    $query = "UPDATE Eventos
              SET titulo = :titulo,
                  descripcion = :descripcion,
                  categoria = :categoria,
                  imagen_portada = :imagen_portada,
                  direccion = :direccion,
                  fecha_inicio = :fecha_inicio,
                  fecha_fin = :fecha_fin,
                  coordenadas = POINT(:longitud, :latitud)
              WHERE id = :id";

    $stmt = $db->prepare($query);

    // Limpiar y bindear los datos
    $titulo = htmlspecialchars(strip_tags($data->titulo));
    $descripcion = htmlspecialchars(strip_tags($data->descripcion));
    $categoria = htmlspecialchars(strip_tags($data->categoria));
    $imagen_portada = htmlspecialchars(strip_tags($data->imagen_portada));
    $direccion = htmlspecialchars(strip_tags($data->direccion));
    $fecha_inicio = htmlspecialchars(strip_tags($data->fecha_inicio));
    $fecha_fin = htmlspecialchars(strip_tags($data->fecha_fin));
    $latitud = htmlspecialchars(strip_tags($data->latitud));
    $longitud = htmlspecialchars(strip_tags($data->longitud));

    $stmt->bindParam(':id', $id);
    $stmt->bindParam(':titulo', $titulo);
    $stmt->bindParam(':descripcion', $descripcion);
    $stmt->bindParam(':categoria', $categoria);
    $stmt->bindParam(':imagen_portada', $imagen_portada);
    $stmt->bindParam(':direccion', $direccion);
    $stmt->bindParam(':fecha_inicio', $fecha_inicio);
    $stmt->bindParam(':fecha_fin', $fecha_fin);
    $stmt->bindParam(':latitud', $latitud);
    $stmt->bindParam(':longitud', $longitud);

    if ($stmt->execute()) {
        // Si la actualización fue exitosa
        http_response_code(200);
        echo json_encode(array("message" => "Evento actualizado correctamente."));
    } else {
        // Si hubo un error al actualizar
        http_response_code(503);
        echo json_encode(array("message" => "No se pudo actualizar el evento."));
    }

} else {
    // Si faltan datos necesarios
    http_response_code(400);
    echo json_encode(array("message" => "No se pudieron actualizar los datos del evento. Datos incompletos."));
}


// No necesitamos cerrar la conexión aquí, ya que $pdo se gestiona en db_config.php
?>