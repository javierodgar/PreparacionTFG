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
 
 require 'db_config.php'; // Asegúrate de que este archivo contiene las credenciales de la base de datos ($pdo)
 
 if (isset($_GET['usuario'])) {
     $usuarioLogueado = $_GET['usuario'];
 
     try {
         $stmt = $pdo->prepare("SELECT p.*, COUNT(ld.tipo) AS num_likes
                                FROM Publicaciones p
                                INNER JOIN LikesDislikes ld ON p.id = ld.publicacion_id AND ld.tipo = 'like'
                                WHERE p.fecha_creacion >= DATE_SUB(CURDATE(), INTERVAL 10 DAY)
                                AND p.usuario != :usuario
                                GROUP BY p.id
                                ORDER BY num_likes DESC
                                LIMIT 10");
         $stmt->bindParam(':usuario', $usuarioLogueado, PDO::PARAM_STR);
         $stmt->execute();
         $publicacionesDestacadas = $stmt->fetchAll(PDO::FETCH_ASSOC);
 
         echo json_encode($publicacionesDestacadas);
 
     } catch (PDOException $e) {
         http_response_code(500);
         echo json_encode(['error' => 'Error al obtener las publicaciones destacadas: ' . $e->getMessage()]);
     }
 } else {
     http_response_code(400);
     echo json_encode(['error' => 'El parámetro usuario es requerido.']);
 }
 ?>