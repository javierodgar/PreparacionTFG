<?php
// archivo: save_post.php

// Configuración de cabeceras para permitir solicitudes CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Origin: http://localhost:4200"); // Permite el origen específico de Angular
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS"); // Permite todos los métodos comunes
// Verificar que sea una solicitud POST
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200); // OK
    exit; // Terminar ejecución ya que no se necesita procesar más
}

// **Configuración de la base de datos**
require_once 'db_config.php';

// Obtener los datos enviados desde el formulario
$username = $_POST["usuario"] ?? null;
$title = $_POST["titulo"] ?? null;
$text = $_POST["texto"] ?? null;
$hashtags_string = $_POST["hashtags"] ?? null; // Ahora recibimos los hashtags como una cadena separada por comas

// Manejar la imagen (opcional)
$image = null;
if (isset($_FILES["imagen"]) && $_FILES["imagen"]["error"] === UPLOAD_ERR_OK) {
    $uploadDir = "uploads/"; // Carpeta donde se guardarán las imágenes
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0777, true); // Crear la carpeta si no existe
    }
    $imageName = uniqid() . "_" . basename($_FILES["imagen"]["name"]); // Nombre único para evitar conflictos
    $image = $uploadDir . $imageName;
    if ($_FILES["imagen"]["error"] !== UPLOAD_ERR_OK) {
        http_response_code(500);
        echo json_encode(["message" => "Error al subir la imagen: " . $_FILES["imagen"]["error"]]);
        exit;
    }
}

// Validar campos obligatorios
if (empty($username) || empty($title) || empty($text)) {
    http_response_code(400); // Bad Request
    echo json_encode(["message" => "Faltan datos obligatorios (usuario, título o texto)"]);
    exit;
}

try {
    // La conexión PDO ya está disponible a través de $pdo incluido desde db_config.php

    // Obtener los datos enviados desde el formulario
    $username = $_POST["usuario"] ?? null;
    $title = $_POST["titulo"] ?? null;
    $text = $_POST["texto"] ?? null;
    $hashtags_string = $_POST["hashtags"] ?? null; // Ahora recibimos los hashtags como una cadena separada por comas

    // Manejar la imagen (opcional)
    $image = null;
    if (isset($_FILES["imagen"]) && $_FILES["imagen"]["error"] === UPLOAD_ERR_OK) {
        $uploadDir = "uploads/"; // Carpeta donde se guardarán las imágenes
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true); // Crear la carpeta si no existe
        }
        $imageName = uniqid() . "_" . basename($_FILES["imagen"]["name"]); // Nombre único para evitar conflictos
        $image = $uploadDir . $imageName;
        if (!move_uploaded_file($_FILES["imagen"]["tmp_name"], $image)) {
            http_response_code(500);
            echo json_encode(["message" => "Error al subir la imagen"]);
            exit;
        }
    }

    // Validar campos obligatorios
    if (empty($username) || empty($title) || empty($text)) {
        http_response_code(400); // Bad Request
        echo json_encode(["message" => "Faltan datos obligatorios (usuario, título o texto)"]);
        exit;
    }

    // Iniciar transacción para asegurar la integridad de las operaciones
    $pdo->beginTransaction();

    // 1. Insertar la publicación en la tabla Publicaciones
    $stmt_publicacion = $pdo->prepare("INSERT INTO Publicaciones (usuario, imagen, titulo, texto, fecha_creacion) VALUES (:usuario, :imagen, :titulo, :texto, NOW())");
    $stmt_publicacion->bindParam(":usuario", $username);
    $stmt_publicacion->bindParam(":imagen", $image);
    $stmt_publicacion->bindParam(":titulo", $title);
    $stmt_publicacion->bindParam(":texto", $text);

    if ($stmt_publicacion->execute()) {
        $publicacion_id = $pdo->lastInsertId(); // Obtener el ID de la publicación recién insertada

        // 2. Procesar los hashtags
        if (!empty($hashtags_string)) {
            $hashtags_array = array_map('trim', explode(',', $hashtags_string));

            foreach ($hashtags_array as $hashtag) {
                if (!empty($hashtag)) {
                    // a. Verificar si el hashtag ya existe en la tabla Hashtags
                    $stmt_check_hashtag = $pdo->prepare("SELECT id FROM Hashtags WHERE nombre = :hashtag");
                    $stmt_check_hashtag->bindParam(":hashtag", $hashtag);
                    $stmt_check_hashtag->execute();
                    $result_hashtag = $stmt_check_hashtag->fetch(PDO::FETCH_ASSOC);

                    if ($result_hashtag) {
                        $hashtag_id = $result_hashtag['id'];
                    } else {
                        // b. Si no existe, insertar el nuevo hashtag
                        $stmt_insert_hashtag = $pdo->prepare("INSERT INTO Hashtags (nombre) VALUES (:hashtag)");
                        $stmt_insert_hashtag->bindParam(":hashtag", $hashtag);
                        if ($stmt_insert_hashtag->execute()) {
                            $hashtag_id = $pdo->lastInsertId();
                        } else {
                            $pdo->rollBack();
                            http_response_code(500);
                            echo json_encode(["message" => "Error al insertar un nuevo hashtag: " . $stmt_insert_hashtag->errorInfo()[2]]);
                            exit;
                        }
                    }

                    // c. Insertar la relación en la tabla PublicacionHashtag
                    $stmt_insert_relation = $pdo->prepare("INSERT INTO PublicacionHashtag (publicacion_id, hashtag_id) VALUES (:publicacion_id, :hashtag_id)");
                    $stmt_insert_relation->bindParam(":publicacion_id", $publicacion_id, PDO::PARAM_INT);
                    $stmt_insert_relation->bindParam(":hashtag_id", $hashtag_id, PDO::PARAM_INT);
                    if (!$stmt_insert_relation->execute()) {
                        $pdo->rollBack();
                        http_response_code(500);
                        echo json_encode(["message" => "Error al crear la relación publicación-hashtag: " . $stmt_insert_relation->errorInfo()[2]]);
                        exit;
                    }
                }
            }
        }

        // Si todo salió bien, confirmar la transacción
        $pdo->commit();
        http_response_code(201); // Created
        echo json_encode(["message" => "Publicación creada exitosamente"]);

    } else {
        $pdo->rollBack();
        http_response_code(500); // Internal Server Error
        echo json_encode(["message" => "Error al crear la publicación: " . $stmt_publicacion->errorInfo()[2]]);
    }

} catch (PDOException $e) {
    // Si ocurre alguna excepción, deshacer la transacción
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500); // Internal Server Error
    echo json_encode(["message" => "Error en el servidor: " . $e->getMessage()]);
}
?>