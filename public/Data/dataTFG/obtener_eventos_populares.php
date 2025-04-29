<?php
 header("Access-Control-Allow-Origin: *");
 header("Access-Control-Allow-Origin: http://localhost:4200");
 header("Content-Type: application/json; charset=UTF-8");
 header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
 header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
 
 if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
     http_response_code(200);
     exit;
 }
 
 // Incluir el archivo de configuración de la base de datos
 require_once 'db_config.php';
 
 // Recibir el nombre de usuario a excluir como parámetro (por ejemplo, por GET)
 $nombreUsuarioExcluir = isset($_GET['excluir_usuario']) ? $_GET['excluir_usuario'] : null;
 
 if ($nombreUsuarioExcluir === null) {
     echo json_encode(["error" => "El parámetro 'excluir_usuario' es obligatorio."]);
     exit();
 }
 
 try {
     // La conexión PDO ($conn) ya está establecida en db_config.php
 
     // Obtener el ID del usuario a excluir basado en su nombre de usuario
     $stmtUsuario = $pdo->prepare("
         SELECT id
         FROM Usuarios
         WHERE usuario = :nombre_usuario_excluir
     ");
     $stmtUsuario->bindParam(':nombre_usuario_excluir', $nombreUsuarioExcluir, PDO::PARAM_STR);
     $stmtUsuario->execute();
     $usuarioExcluir = $stmtUsuario->fetch(PDO::FETCH_ASSOC);
 
     if (!$usuarioExcluir) {
         echo json_encode([]); // Si el usuario a excluir no existe, devolvemos un array vacío
         exit();
     }
 
     $usuarioIdExcluir = $usuarioExcluir['id'];
 
     // Consulta SQL para obtener los 10 eventos con más inscripciones, excluyendo los del usuario creador
     $stmtEventos = $pdo->prepare("
         SELECT
             e.id AS evento_id,
             e.titulo,
             e.fecha_creacion,
             COUNT(ie.usuario_id) AS cantidad_inscripciones
         FROM Eventos e
         LEFT JOIN InscripcionesEventos ie ON e.id = ie.evento_id
         WHERE e.usuario_creador_id <> :usuario_id_excluir
         GROUP BY e.id
         ORDER BY cantidad_inscripciones DESC
         LIMIT 10;
     ");
 
     $stmtEventos->bindParam(':usuario_id_excluir', $usuarioIdExcluir, PDO::PARAM_INT);
     $stmtEventos->execute();
     $eventosPopulares = $stmtEventos->fetchAll(PDO::FETCH_ASSOC);
 
     echo json_encode($eventosPopulares);
 
 } catch (PDOException $e) {
     // Este bloque catch ahora manejará errores de la consulta
     echo json_encode(["error" => "Error al ejecutar la consulta: " . $e->getMessage()]);
 } finally {
     // La conexión se cierra automáticamente cuando la variable $conn sale del scope
 }
 ?>