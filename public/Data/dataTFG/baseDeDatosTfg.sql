CREATE DATABASE IF NOT EXISTS RegistroUsuarios;

-- Usar la base de datos recién creada
USE RegistroUsuarios;

SELECT c.id AS comentario_id, c.texto AS comentario_texto, c.fecha_creacion AS comentario_fecha_creacion,
                                     u_com.usuario AS nombre_usuario_comentario
                         FROM Comentarios c
                         INNER JOIN Usuarios u_com ON c.usuario_id = u_com.id
                         WHERE c.publicacion_id = :publicacion_id
                         ORDER BY c.fecha_creacion ASC;

-- Crear la tabla Usuarios con los campos solicitados
CREATE TABLE IF NOT EXISTS Usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,          -- ID único autoincremental como clave primaria
    usuario VARCHAR(50) NOT NULL UNIQUE,        -- Nombre de usuario, único y obligatorio
    nombre VARCHAR(50) NOT NULL,                -- Nombre, obligatorio
    apellido1 VARCHAR(50) NOT NULL,             -- Primer apellido, obligatorio
    apellido2 VARCHAR(50),                      -- Segundo apellido, opcional
    correo_electronico VARCHAR(100) NOT NULL UNIQUE, -- Correo electrónico, único y obligatorio
    ciudad_residencia VARCHAR(50) NOT NULL,     -- Ciudad de residencia, obligatorio
    contrasena VARCHAR(255) NOT NULL,            -- Contraseña, obligatorio (se usa 255 para permitir hash)
	profile_image VARCHAR(255) DEFAULT NULL, -- Nuevo campo para la foto de perfil
    valoracion_global DECIMAL(4, 3) DEFAULT 3.000 -- campo para la valoracion global de un usuario
);


CREATE TABLE IF NOT EXISTS Publicaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,              -- ID único, clave primaria
    usuario VARCHAR(50) NOT NULL,                   -- Referencia al usuario que creó la publicación
    imagen VARCHAR(255),                            -- Ruta o nombre de la imagen (opcional)
    titulo VARCHAR(100) NOT NULL,                   -- Título de la publicación
    texto TEXT NOT NULL,                            -- Contenido de la publicación (muy largo)
    hashtags VARCHAR(255),                          -- Hashtags separados por comas
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP, -- Fecha y hora de creación (automática)
    FOREIGN KEY (usuario) REFERENCES Usuarios(usuario) ON DELETE CASCADE -- Clave foránea
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

CREATE TABLE IF NOT EXISTS seguidores (
  `seguidor` varchar(50) NOT NULL,
  `seguido` varchar(50) NOT NULL,
  PRIMARY KEY (`seguidor`,`seguido`),
  KEY `seguido` (`seguido`)
);



CREATE TABLE  IF NOT EXISTS Comentarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    publicacion_id INT NOT NULL,
    usuario_id VARCHAR(50) NOT NULL,
    texto TEXT NOT NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (publicacion_id) REFERENCES Publicaciones(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES Usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Hashtags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE
);

-- Crear la tabla de relación PublicacionHashtag
CREATE TABLE IF NOT EXISTS PublicacionHashtag (
    publicacion_id INT NOT NULL,
    hashtag_id INT NOT NULL,
    PRIMARY KEY (publicacion_id, hashtag_id),
    FOREIGN KEY (publicacion_id) REFERENCES Publicaciones(id) ON DELETE CASCADE,
    FOREIGN KEY (hashtag_id) REFERENCES Hashtags(id) ON DELETE CASCADE
);

-- #############################################################################
-- ###################### TABLAS PARA LA GESTIÓN DE EVENTOS ######################
-- #############################################################################

-- Tabla de Eventos (MODIFICADA)
CREATE TABLE IF NOT EXISTS Eventos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    categoria VARCHAR(50) NOT NULL,
    imagen_portada VARCHAR(255),
    direccion VARCHAR(255) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_inicio DATETIME NOT NULL,
    fecha_fin VARCHAR(255) NOT NULL, -- Almacenado como STRING para la API de mapas
    usuario_creador_id INT NOT NULL,
    coordenadas POINT,
    FOREIGN KEY (usuario_creador_id) REFERENCES Usuarios(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla de Inscripciones a Eventos (sin cambios)
CREATE TABLE IF NOT EXISTS InscripcionesEventos (
    evento_id INT NOT NULL,
    usuario_id INT NOT NULL,
    fecha_inscripcion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (evento_id, usuario_id), -- Un usuario solo puede inscribirse una vez al mismo evento
    FOREIGN KEY (evento_id) REFERENCES Eventos(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES Usuarios(id) ON DELETE CASCADE
);

-- Tabla de Comentarios de Eventos (sin cambios)
CREATE TABLE IF NOT EXISTS ComentariosEventos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    evento_id INT NOT NULL,
    usuario_id INT NOT NULL,
    texto TEXT NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (evento_id) REFERENCES Eventos(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES Usuarios(id) ON DELETE CASCADE
);

-- Tabla de Likes y Dislikes de Eventos (sin cambios)
CREATE TABLE IF NOT EXISTS LikesDislikesEventos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    evento_id INT NOT NULL,
    usuario_id INT NOT NULL,
    tipo ENUM('like', 'dislike') NOT NULL,
    fecha_accion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (evento_id) REFERENCES Eventos(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES Usuarios(id) ON DELETE CASCADE,
    UNIQUE KEY unique_like_dislike_evento (evento_id, usuario_id) -- Un usuario solo puede dar un like/dislike por evento
);


-- ALTER TABLE Usuarios
-- ADD COLUMN valoracion_global DECIMAL(4, 3) DEFAULT 3.000;

-- ALTER TABLE Eventos
-- ADD COLUMN coordenadas POINT;
INSERT INTO Eventos (
    titulo,
    descripcion,
    categoria,
    imagen_portada,
    direccion,
    fecha_inicio,
    fecha_fin,
    usuario_creador_id,
    coordenadas
) VALUES (
    'Título del Evento',
    'Descripción detallada del evento.',
    'Concierto',
    'ruta/a/la/imagen.jpg',
    'Calle Júpiter 16, Valladolid, España',
    '2025-05-15 21:00:00',
    '2025-05-15 23:00',
    1,
    ST_GeomFromText('POINT(-4.735829289411837 41.663367567795426)')
);

INSERT INTO Hashtags (nombre) VALUES
('#coches');

INSERT INTO Hashtags (nombre) VALUES
('#automoviles');

INSERT INTO Hashtags (nombre) VALUES
('#motor');

INSERT INTO Hashtags (nombre) VALUES
('#velocidad');

INSERT INTO Hashtags (nombre) VALUES
('#conduccion');

select * from Hashtags;

select * from PublicacionHashtag;

select  * from publicaciones;



select * from usuarios;

select * from eventos;

SELECT id, ST_X(coordenadas) AS latitud, ST_Y(coordenadas) AS longitud
FROM Eventos
ORDER BY id DESC
LIMIT 1;