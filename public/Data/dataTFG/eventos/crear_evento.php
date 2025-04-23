<?php
// crear_evento.php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// **Incluir configuración de la base de datos**
require_once '../db_config.php'; // Ajusta la ruta si es necesario

try {
    $titulo = isset($_POST['titulo']) ? $_POST['titulo'] : '';
    $descripcion = isset($_POST['descripcion']) ? $_POST['descripcion'] : null;
    $categoria = isset($_POST['categoria']) ? $_POST['categoria'] : '';
    $direccion = isset($_POST['direccion']) ? $_POST['direccion'] : '';
    $fecha_inicio = isset($_POST['fecha_inicio']) ? $_POST['fecha_inicio'] : '';
    $fecha_fin = isset($_POST['fecha_fin']) ? $_POST['fecha_fin'] : '';
    $latitud = isset($_POST['latitud']) ? $_POST['latitud'] : null;
    $longitud = isset($_POST['longitud']) ? $_POST['longitud'] : null;
    $usuario_creador_id_valor = 1; // **TODO: Obtener el ID del usuario autenticado**

    // **Implementar la lógica para guardar la imagen de portada si se subió un archivo**
    $imagen_portada = null;
    if (isset($_FILES['imagen_portada']) && $_FILES['imagen_portada']['error'] === UPLOAD_ERR_OK) {
        $file_name = basename($_FILES['imagen_portada']['name']);
        $file_tmp = $_FILES['imagen_portada']['tmp_name'];
        $file_ext = strtolower(pathinfo($file_name, PATHINFO_EXTENSION));

        $allowed_ext = array("jpg", "jpeg", "png");

        if (in_array($file_ext, $allowed_ext)) {
            $upload_dir = '../../dataTFG/'; // **TODO: Define la ruta correcta de subida**
            if (!is_dir($upload_dir)) {
                mkdir($upload_dir, 0755, true);
            }
            $new_file_name = uniqid() . "." . $file_ext;
            $file_path = $upload_dir . $new_file_name;

            if (move_uploaded_file($file_tmp, $file_path)) {
                $imagen_portada = $new_file_name; // Guarda solo el nombre del archivo en la base de datos
            } else {
                http_response_code(500);
                echo json_encode(["message" => "Error al subir la imagen de portada."]);
                exit;
            }
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Formato de imagen no válido. Solo se permiten JPG, JPEG y PNG."]);
            exit;
        }
    } elseif (isset($_FILES['imagen_portada']) && $_FILES['imagen_portada']['error'] !== UPLOAD_ERR_NO_FILE) {
        http_response_code(500);
        echo json_encode(["message" => "Error al subir la imagen de portada: " . $_FILES['imagen_portada']['error']]);
        exit;
    }

    // Validaciones básicas
    if (empty($titulo) || empty($categoria) || empty($direccion) || empty($fecha_inicio)) {
        http_response_code(400);
        echo json_encode(["message" => "Por favor, completa todos los campos obligatorios."]);
        exit;
    }

    $query = "INSERT INTO Eventos (titulo, descripcion, categoria, imagen_portada, direccion, fecha_inicio, fecha_fin, usuario_creador_id, coordenadas)
              VALUES (:titulo, :descripcion, :categoria, :imagen_portada, :direccion, :fecha_inicio, :fecha_fin, :usuario_creador_id, ST_GeomFromText(:coordenadas_point))";

    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':titulo', $titulo);
    $stmt->bindParam(':descripcion', $descripcion, PDO::PARAM_STR);
    $stmt->bindParam(':categoria', $categoria);
    $stmt->bindParam(':imagen_portada', $imagen_portada, PDO::PARAM_STR);
    $stmt->bindParam(':direccion', $direccion);
    $stmt->bindParam(':fecha_inicio', $fecha_inicio);
    $stmt->bindParam(':fecha_fin', $fecha_fin);
    $stmt->bindParam(':usuario_creador_id', $usuario_creador_id_valor, PDO::PARAM_INT);

    // Crear el string para la función ST_GeomFromText
    $coordenadas_point_string = null;
    if ($latitud !== null && $longitud !== null) {
        $coordenadas_point_string = "POINT(" . $longitud . " " . $latitud . ")";
    }
    $stmt->bindParam(':coordenadas_point', $coordenadas_point_string, PDO::PARAM_STR);

    if ($stmt->execute()) {
        http_response_code(201);
        echo json_encode(["message" => "Evento creado exitosamente."]);
    } else {
        http_response_code(500);
        echo json_encode(["message" => "Error al crear el evento: " . $stmt->errorInfo()[2]]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error de base de datos: " . $e->getMessage()]);
}
?>