-- Crear la base de datos (si no existe)
CREATE DATABASE IF NOT EXISTS RegistroUsuarios;

-- Usar la base de datos
USE RegistroUsuarios;
DROP SCHEMA `registrousuarios`;
-- Crear la tabla Usuarios
CREATE TABLE IF NOT EXISTS Usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(50) NOT NULL,
    apellido1 VARCHAR(50) NOT NULL,
    apellido2 VARCHAR(50),
    correo_electronico VARCHAR(100) NOT NULL UNIQUE,
    ciudad_residencia VARCHAR(50) NOT NULL,
    profile_image VARCHAR(255),
    contrasena VARCHAR(255) NOT NULL
);

-- Crear la tabla Publicaciones con ON UPDATE CASCADE en la clave foránea
CREATE TABLE IF NOT EXISTS Publicaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario VARCHAR(50) NOT NULL,
    imagen VARCHAR(255),
    titulo VARCHAR(100) NOT NULL,
    texto TEXT NOT NULL,
    hashtags VARCHAR(255),
    FOREIGN KEY (usuario) REFERENCES Usuarios(usuario) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Crear la tabla Seguidores con ON UPDATE CASCADE en las claves foráneas
CREATE TABLE IF NOT EXISTS Seguidores (
    seguidor VARCHAR(50) NOT NULL,
    seguido VARCHAR(50) NOT NULL,
    PRIMARY KEY (seguidor, seguido),
    FOREIGN KEY (seguidor) REFERENCES Usuarios(usuario) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (seguido) REFERENCES Usuarios(usuario) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Crear la tabla Comentarios
CREATE TABLE IF NOT EXISTS Comentarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    publicacion_id INT NOT NULL,
    usuario_id INT NOT NULL,
    texto TEXT NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Claves foráneas para asegurar la integridad referencial
    FOREIGN KEY (publicacion_id) REFERENCES Publicaciones(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES Usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS LikesDislikes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    publicacion_id INT NOT NULL,
    usuario_id INT NOT NULL,
    tipo ENUM('like', 'dislike') NOT NULL,
    fecha_accion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Claves foráneas
    FOREIGN KEY (publicacion_id) REFERENCES Publicaciones(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES Usuarios(id) ON DELETE CASCADE,
    -- Restricción para asegurar que un usuario solo pueda tener un like o dislike por publicación
    UNIQUE KEY unique_like_dislike (publicacion_id, usuario_id)
);

-- ALTER TABLE publicaciones
-- ADD CONSTRAINT fk_usuario_publicaciones
-- FOREIGN KEY (usuario) REFERENCES Usuarios(usuario)
-- ON DELETE CASCADE
-- ON UPDATE CASCADE;

-- SHOW CREATE TABLE Publicaciones;

genial, ahora que esto ya funciona toca trabajar en la logica de los likes y dislikes, ya he creado los campos correspondientes en la base de datos, te voy a pasar el sql de la tabla,
necesito que me hagas un php que permita agregar un like o un dislike, 