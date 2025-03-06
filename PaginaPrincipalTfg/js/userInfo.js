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

    const userDataDiv = document.querySelector(".user-data");
    const userPostsDiv = document.querySelector(".user-posts");
    const followersCountSpan = document.getElementById("followersCount");
    const followingCountSpan = document.getElementById("followingCount");

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

            // Solo cargar publicaciones si no están ya cargadas
            if (userPostsDiv.children.length <= 1) { // Solo el <h3> inicial
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
            }

            // Actualizar contadores
            updateFollowInfo(data.followersCount, data.followingCount);

            document.getElementById("editUserBtn").addEventListener("click", function() {
                showEditUserModal(data.user);
            });

            document.getElementById("followForm").addEventListener("submit", function(event) {
                event.preventDefault();
                const followUsername = document.getElementById("followUsername").value;
                followUser(username, followUsername, "follow");
            });

            document.getElementById("unfollowBtn").addEventListener("click", function() {
                const followUsername = document.getElementById("followUsername").value;
                followUser(username, followUsername, "unfollow");
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

function updateFollowInfo(followersCount, followingCount) {
    const followersCountSpan = document.getElementById("followersCount");
    const followingCountSpan = document.getElementById("followingCount");
    followersCountSpan.textContent = followersCount;
    followingCountSpan.textContent = followingCount;
}

function followUser(follower, followed, action) {
    fetch("data/follow_user.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ follower: follower, followed: followed, action: action })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        if (data.message.includes("sigues") || data.message.includes("dejado")) {
            // Solo actualizar contadores, no recargar todo
            fetch("data/get_user_data.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: follower })
            })
            .then(response => response.json())
            .then(data => {
                updateFollowInfo(data.followersCount, data.followingCount);
            })
            .catch(error => console.error("Error al actualizar contadores:", error));
        }
    })
    .catch(error => {
        console.error("Error al realizar la acción de seguimiento:", error);
        alert("Error al procesar la solicitud");
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
                showUserProfile();
            }
        })
        .catch(error => {
            console.error("Error al guardar los datos:", error);
            alert("Error al guardar los cambios");
        });
    });
}

showUserProfile();