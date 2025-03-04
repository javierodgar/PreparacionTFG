-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS RegistroUsuarios;

-- Usar la base de datos recién creada
USE RegistroUsuarios;

-- Crear la tabla Usuarios con los campos solicitados
CREATE TABLE IF NOT EXISTS Usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,          -- ID único autoincremental como clave primaria
    usuario VARCHAR(50) NOT NULL UNIQUE,        -- Nombre de usuario, único y obligatorio
    nombre VARCHAR(50) NOT NULL,                -- Nombre, obligatorio
    apellido1 VARCHAR(50) NOT NULL,             -- Primer apellido, obligatorio
    apellido2 VARCHAR(50),                      -- Segundo apellido, opcional
    correo_electronico VARCHAR(100) NOT NULL UNIQUE, -- Correo electrónico, único y obligatorio
    ciudad_residencia VARCHAR(50) NOT NULL,     -- Ciudad de residencia, obligatorio
    contrasena VARCHAR(255) NOT NULL            -- Contraseña, obligatorio (se usa 255 para permitir hash)
);

CREATE TABLE IF NOT EXISTS Publicaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,              -- ID único, clave primaria
    usuario VARCHAR(50) NOT NULL,                   -- Referencia al usuario que creó la publicación
    imagen VARCHAR(255),                            -- Ruta o nombre de la imagen (opcional)
    titulo VARCHAR(100) NOT NULL,                   -- Título de la publicación
    texto TEXT NOT NULL,                            -- Contenido de la publicación (muy largo)
    hashtags VARCHAR(255),                          -- Hashtags separados por comas
    FOREIGN KEY (usuario) REFERENCES Usuarios(usuario) ON DELETE CASCADE -- Clave foránea
);
