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

// Conexión a la base de datos
$host = "localhost"; // Ajusta según tu configuración
$dbUsername = "root"; // Ajusta según tu usuario de BD
$dbPassword = "root";     // Ajusta según tu contraseña de BD
$dbName = "RegistroUsuarios"; // Nombre de la base de datos

try {
    $conn = new mysqli($host, $dbUsername, $dbPassword, $dbName);

    // Verificar conexión
    if ($conn->connect_error) {
        http_response_code(500); // Internal Server Error
        echo json_encode(["message" => "Error de conexión a la base de datos: " . $conn->connect_error]);
        exit;
    }

    // Iniciar transacción para asegurar la integridad de las operaciones
    $conn->begin_transaction();

    // 1. Insertar la publicación en la tabla Publicaciones
    $stmt_publicacion = $conn->prepare("INSERT INTO Publicaciones (usuario, imagen, titulo, texto) VALUES (?, ?, ?, ?)");
    $stmt_publicacion->bind_param("ssss", $username, $image, $title, $text);

    if ($stmt_publicacion->execute()) {
        $publicacion_id = $conn->insert_id; // Obtener el ID de la publicación recién insertada

        // 2. Procesar los hashtags
        if (!empty($hashtags_string)) {
            $hashtags_array = array_map('trim', explode(',', $hashtags_string));

            foreach ($hashtags_array as $hashtag) {
                if (!empty($hashtag)) {
                    // a. Verificar si el hashtag ya existe en la tabla Hashtags
                    $stmt_check_hashtag = $conn->prepare("SELECT id FROM Hashtags WHERE nombre = ?");
                    $stmt_check_hashtag->bind_param("s", $hashtag);
                    $stmt_check_hashtag->execute();
                    $result_hashtag = $stmt_check_hashtag->get_result();

                    if ($result_hashtag->num_rows > 0) {
                        $row_hashtag = $result_hashtag->fetch_assoc();
                        $hashtag_id = $row_hashtag['id'];
                    } else {
                        // b. Si no existe, insertar el nuevo hashtag
                        $stmt_insert_hashtag = $conn->prepare("INSERT INTO Hashtags (nombre) VALUES (?)");
                        $stmt_insert_hashtag->bind_param("s", $hashtag);
                        if ($stmt_insert_hashtag->execute()) {
                            $hashtag_id = $conn->insert_id;
                        } else {
                            $conn->rollback();
                            http_response_code(500);
                            echo json_encode(["message" => "Error al insertar un nuevo hashtag: " . $stmt_insert_hashtag->error]);
                            $stmt_insert_hashtag->close();
                            $stmt_check_hashtag->close();
                            $stmt_publicacion->close();
                            $conn->close();
                            exit;
                        }
                        $stmt_insert_hashtag->close();
                    }
                    $stmt_check_hashtag->close();

                    // c. Insertar la relación en la tabla PublicacionHashtag
                    $stmt_insert_relation = $conn->prepare("INSERT INTO PublicacionHashtag (publicacion_id, hashtag_id) VALUES (?, ?)");
                    $stmt_insert_relation->bind_param("ii", $publicacion_id, $hashtag_id);
                    if (!$stmt_insert_relation->execute()) {
                        $conn->rollback();
                        http_response_code(500);
                        echo json_encode(["message" => "Error al crear la relación publicación-hashtag: " . $stmt_insert_relation->error]);
                        $stmt_insert_relation->close();
                        $stmt_publicacion->close();
                        $conn->close();
                        exit;
                    }
                    $stmt_insert_relation->close();
                }
            }
        }

        // Si todo salió bien, confirmar la transacción
        $conn->commit();
        http_response_code(201); // Created
        echo json_encode(["message" => "Publicación creada exitosamente"]);

    } else {
        $conn->rollback();
        http_response_code(500); // Internal Server Error
        echo json_encode(["message" => "Error al crear la publicación: " . $stmt_publicacion->error]);
    }

    // Cerrar recursos
    $stmt_publicacion->close();
    $conn->close();

} catch (Exception $e) {
    // Si ocurre alguna excepción, deshacer la transacción
    if (isset($conn)) {
        $conn->rollback();
    }
    http_response_code(500); // Internal Server Error
    echo json_encode(["message" => "Error en el servidor: " . $e->getMessage()]);
}
?>