// userProfile.js

function getCookie(name) {
    let matches = document.cookie.match(new RegExp(
        "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
    ));
    return matches ? decodeURIComponent(matches[1]) : null;
}

function showUserProfile() {
    const username = getCookie("username");
    if (!username) {
        alert("No hay usuario logeado. Por favor, inicia sesión.");
        return;
    }

    const mainSection = document.querySelector(".main-section");
    mainSection.innerHTML = ""; // Limpiar publicaciones y filtro

    // Crear contenedor para datos del usuario
    const userDataDiv = document.createElement("div");
    userDataDiv.className = "user-data";
    mainSection.appendChild(userDataDiv);

    // Botón de edición
    const editBtn = document.createElement("button");
    editBtn.id = "editUserBtn";
    editBtn.textContent = "Editar perfil";
    mainSection.appendChild(editBtn);

    // Contenedor para publicaciones del usuario
    const userPostsDiv = document.createElement("div");
    userPostsDiv.className = "user-posts";
    userPostsDiv.innerHTML = "<h3>Tus publicaciones</h3>";
    mainSection.appendChild(userPostsDiv);

    // Obtener datos del usuario
    fetch("data/get_user_data.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username })
    })
    .then(response => response.json())
    .then(data => {
        if (data.user) {
            userDataDiv.innerHTML = `
                <h2>${data.user.usuario} <span class="post-count">${data.postCount}</span></h2>
                <p><strong>Nombre:</strong> ${data.user.nombre}</p>
                <p><strong>Apellido 1:</strong> ${data.user.apellido1}</p>
                <p><strong>Apellido 2:</strong> ${data.user.apellido2 || "No especificado"}</p>
                <p><strong>Email:</strong> ${data.user.correo_electronico}</p>
                <p><strong>Ciudad:</strong> ${data.user.ciudad_residencia}</p>
            `;

            if (data.posts.length > 0) {
                data.posts.forEach(post => {
                    const postDiv = document.createElement("div");
                    postDiv.className = "post";
                    postDiv.innerHTML = `
                        <h3>${post.titulo}</h3>
                        ${post.imagen ? `<img src="${post.imagen}" alt="Imagen de publicación">` : ""}
                        <p>${post.texto}</p>
                        ${post.hashtags ? `<div class="hashtags">${post.hashtags}</div>` : ""}
                    `;
                    userPostsDiv.appendChild(postDiv);
                });
            } else {
                userPostsDiv.innerHTML += "<p>No tienes publicaciones aún.</p>";
            }

            // Evento para el botón de edición
            document.getElementById("editUserBtn").addEventListener("click", function() {
                showEditUserModal(data.user);
            });
        } else {
            userDataDiv.innerHTML = "<p>Usuario no encontrado.</p>";
        }
    })
    .catch(error => {
        console.error("Error al cargar datos del usuario:", error);
        userDataDiv.innerHTML = "<p>Error al cargar los datos.</p>";
    });
}

function showEditUserModal(userData) {
    const editModal = document.createElement("div");
    editModal.className = "modal";
    editModal.innerHTML = `
        <div class="modal-content">
            <span class="close" id="closeEditModal">×</span>
            <h2>Editar Perfil</h2>
            <form id="editUserForm">
                <label for="editNombre">Nombre:</label>
                <input type="text" id="editNombre" value="${userData.nombre}" required>
                <label for="editApellido1">Apellido 1:</label>
                <input type="text" id="editApellido1" value="${userData.apellido1}" required>
                <label for="editApellido2">Apellido 2:</label>
                <input type="text" id="editApellido2" value="${userData.apellido2 || ""}">
                <label for="editEmail">Email:</label>
                <input type="email" id="editEmail" value="${userData.correo_electronico}" required>
                <label for="editCiudad">Ciudad:</label>
                <input type="text" id="editCiudad" value="${userData.ciudad_residencia}" required>
                <button type="submit">Guardar cambios</button>
            </form>
        </div>
    `;
    document.body.appendChild(editModal);
    editModal.style.display = "flex";

    document.getElementById("closeEditModal").addEventListener("click", function() {
        editModal.remove();
    });

    document.getElementById("editUserForm").addEventListener("submit", function(event) {
        event.preventDefault();

        const updatedData = {
            usuario: userData.usuario,
            nombre: document.getElementById("editNombre").value,
            apellido1: document.getElementById("editApellido1").value,
            apellido2: document.getElementById("editApellido2").value || null,
            correo_electronico: document.getElementById("editEmail").value,
            ciudad_residencia: document.getElementById("editCiudad").value
        };

        fetch("data/update_user.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedData)
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            if (data.message === "Datos del usuario actualizados exitosamente") {
                editModal.remove();
                showUserProfile(); // Recargar el perfil con los datos actualizados
            }
        })
        .catch(error => {
            console.error("Error al guardar los datos:", error);
            alert("Error al guardar los cambios");
        });
    });
}

document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("profilePic").addEventListener("click", showUserProfile);
});