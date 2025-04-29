<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Origin: http://localhost:4200");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'db_config.php';

$jsonData = file_get_contents("php://input");
$data = json_decode($jsonData, true);

$usernameValorador = $data['username_valorador'] ?? null;
$usernameValorado = $data['username_valorado'] ?? null;
$tipoValoracion = $data['tipo_valoracion'] ?? null;

if (empty($usernameValorador) || empty($usernameValorado) || empty($tipoValoracion) || !in_array($tipoValoracion, ['bueno', 'malo'])) {
    http_response_code(400);
    echo json_encode(["message" => "Datos de valoración incompletos o incorrectos."]);
    exit;
}

try {
    // Obtener IDs de los usuarios
    // Obtener IDs de los usuarios
    $stmtGetIds = $pdo->prepare("SELECT usuario, id FROM Usuarios WHERE usuario IN (:username_valorador, :username_valorado)");
    $stmtGetIds->bindParam(":username_valorador", $usernameValorador);
    $stmtGetIds->bindParam(":username_valorado", $usernameValorado);
    $stmtGetIds->execute();
    $users = $stmtGetIds->fetchAll(PDO::FETCH_KEY_PAIR);

    if (!isset($users[$usernameValorador]) || !isset($users[$usernameValorado])) {
        http_response_code(404);
        echo json_encode(["message" => "Uno o ambos usuarios no fueron encontrados."]);
        exit;
    }

    $idValorador = $users[$usernameValorador];
    $idValorado = $users[$usernameValorado];
    $fechaHoy = date('Y-m-d');

    // Comprobar si el usuario valorador ya ha valorado al usuario valorado hoy
    $stmtCheckValoracion = $pdo->prepare("SELECT COUNT(*) FROM ValoracionesLog WHERE usuario_valorador_id = :id_valorador AND fecha_valoracion = :fecha_hoy");
    $stmtCheckValoracion->bindParam(":id_valorador", $idValorador, PDO::PARAM_INT);
    $stmtCheckValoracion->bindParam(":id_valorado", $idValorado, PDO::PARAM_INT);
    $stmtCheckValoracion->bindParam(":fecha_hoy", $fechaHoy);
    $stmtCheckValoracion->execute();
    $valoracionExistente = $stmtCheckValoracion->fetchColumn();

    if ($valoracionExistente > 0) {
        http_response_code(409); // Código de conflicto
        echo json_encode(["message" => "Ya has valorado a alguien hoy."]);
        exit;
    }

    // Insertar la valoración en la tabla
    $stmtInsertValoracion = $pdo->prepare("INSERT INTO ValoracionesLog (usuario_valorador_id, usuario_valorado_id, tipo_valoracion, fecha_valoracion) VALUES (:id_valorador, :id_valorado, :tipo_valoracion, :fecha_hoy)");
    $stmtInsertValoracion->bindParam(":id_valorador", $idValorador, PDO::PARAM_INT);
    $stmtInsertValoracion->bindParam(":id_valorado", $idValorado, PDO::PARAM_INT);
    $stmtInsertValoracion->bindParam(":tipo_valoracion", $tipoValoracion);
    $stmtInsertValoracion->bindParam(":fecha_hoy", $fechaHoy);

    if ($stmtInsertValoracion->execute()) {
        http_response_code(200);
        echo json_encode(["message" => "Valoración registrada correctamente."]);
    } else {
        http_response_code(500);
        echo json_encode(["message" => "Error al registrar la valoración."]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error en el servidor: " . $e->getMessage()]);
}
?>