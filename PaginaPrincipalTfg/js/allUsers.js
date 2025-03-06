function getCookie(name) {
    let matches = document.cookie.match(new RegExp(
        "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
    ));
    return matches ? decodeURIComponent(matches[1]) : null;
}

function showAllUsers() {
    const username = getCookie("username");
    if (!username) {
        alert("No hay usuario logeado. Por favor, inicia sesión.");
        return;
    }

    const usersContainer = document.getElementById("usersContainer");

    Promise.all([
        fetch("data/get_all_users.php", { method: "GET" }).then(response => response.json()),
        fetch("data/get_user_data.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: username })
        }).then(response => response.json())
    ])
    .then(([allUsersData, userData]) => {
        if (allUsersData.users && userData.user) {
            const following = userData.following || [];

            allUsersData.users.forEach(user => {
                if (user.usuario !== username) {
                    const userDiv = document.createElement("div");
                    userDiv.className = "user-post";
                    const isFollowing = following.includes(user.usuario);
                    userDiv.innerHTML = `
                        <h4>${user.usuario}</h4>
                        <p><strong>Nombre:</strong> ${user.nombre} ${user.apellido1} ${user.apellido2 || ""}</p>
                        <p><strong>Ciudad:</strong> ${user.ciudad_residencia}</p>
                        <button class="follow-btn" data-username="${user.usuario}">
                            ${isFollowing ? "Dejar de seguir" : "Seguir"}
                        </button>
                    `;
                    usersContainer.appendChild(userDiv);
                }
            });

            document.querySelectorAll(".follow-btn").forEach(btn => {
                btn.addEventListener("click", function() {
                    const targetUsername = this.getAttribute("data-username");
                    let mode = this.textContent.trim();
                    console.log(mode);
                    let action = 'unfollow';
                    if (mode !== 'Dejar de seguir') {
                        action = 'follow';
                    }
                    console.log(`Botón clicado: ${this.textContent}, Acción enviada: ${action}`); // Depurar acción
                    followUser(username, targetUsername, action, this);
                });
            });
        } else {
            usersContainer.innerHTML = "<p>No se encontraron usuarios.</p>";
        }
    })
    .catch(error => {
        console.error("Error al cargar los usuarios:", error);
        usersContainer.innerHTML = "<p>Error al cargar los usuarios.</p>";
    });
}

function followUser(follower, followed, action, button) {
    console.log(`Intentando ${action} a ${followed} desde ${follower}`);
    console.log("Datos enviados:", JSON.stringify({ follower: follower, followed: followed, action: action }));
    fetch("data/follow_user.php", { // Ajusta esta ruta si es necesario
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ follower: follower, followed: followed, action: action })
    })
    .then(response => {
        console.log("Estado de la respuesta:", response.status);
        if (!response.ok) {
            return response.text().then(text => {
                throw new Error(`HTTP error! Status: ${response.status}, Response: ${text}`);
            });
        }
        return response.json();
    })
    .then(data => {
        console.log("Respuesta del servidor:", data);
        alert(data.message);
        if (data.message.includes("sigues") || data.message.includes("dejado")) {
            button.textContent = action === "follow" ? "Dejar de seguir" : "Seguir";
        }
    })
    .catch(error => {
        console.error("Error al realizar la acción de seguimiento:", error);
        alert("Error al procesar la solicitud: " + error.message);
    });
}

showAllUsers();