function getCookie(name) {
    let matches = document.cookie.match(new RegExp(
        "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
    ));
    return matches ? decodeURIComponent(matches[1]) : null;
}

let allPosts = []; // Almacenar todas las publicaciones cargadas

function loadPosts(filter = null) {
    fetch("get_posts.php", {
        method: "GET"
    })
    .then(response => response.json())
    .then(data => {
        const postsContainer = document.getElementById("postsContainer");
        const filterContainer = document.querySelector(".filter-container");
        postsContainer.innerHTML = ""; // Limpiar contenido
        postsContainer.appendChild(filterContainer); // Mantener el filtro arriba

        if (data.data && data.data.length > 0) {
            allPosts = data.data; // Guardar todas las publicaciones

            // Aplicar filtro si existe
            let filteredPosts = allPosts;
            if (filter && filter.value) {
                const filterType = document.querySelector('input[name="filterType"]:checked').value;
                filteredPosts = allPosts.filter(post => {
                    const field = post[filterType] ? post[filterType].toLowerCase() : "";
                    return field.includes(filter.value.toLowerCase());
                });
            }

            // Mostrar publicaciones filtradas
            filteredPosts.forEach(post => {
                const postDiv = document.createElement("div");
                postDiv.className = "post";

                const title = document.createElement("h3");
                title.textContent = post.titulo;
                postDiv.appendChild(title);

                if (post.imagen) {
                    const img = document.createElement("img");
                    img.src = post.imagen;
                    postDiv.appendChild(img);
                }

                const text = document.createElement("p");
                text.textContent = post.texto;
                postDiv.appendChild(text);

                if (post.hashtags) {
                    const hashtags = document.createElement("div");
                    hashtags.className = "hashtags";
                    hashtags.textContent = post.hashtags;
                    postDiv.appendChild(hashtags);
                }

                postsContainer.appendChild(postDiv);
            });

            if (filteredPosts.length === 0) {
                postsContainer.innerHTML += "<p>No se encontraron publicaciones.</p>";
            }
        } else {
            postsContainer.innerHTML += "<p>No hay publicaciones disponibles.</p>";
        }
    })
    .catch(error => {
        console.error("Error al cargar publicaciones:", error);
        document.getElementById("postsContainer").innerHTML = "<p>Error al cargar las publicaciones.</p>";
    });
}

// Cargar publicaciones al iniciar
window.onload = function() {
    loadPosts();

    // Evento para filtrar publicaciones
    const filterInput = document.getElementById("filterInput");
    filterInput.addEventListener("keydown", function(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            loadPosts({ value: filterInput.value });
        }
    });

    // Evento para cambiar el tipo de filtro
    document.querySelectorAll('input[name="filterType"]').forEach(radio => {
        radio.addEventListener("change", function() {
            loadPosts({ value: filterInput.value });
        });
    });
};

const createPostBtn = document.getElementById("createPostBtn");
const postModal = document.getElementById("postModal");
const closeModal = document.getElementById("closeModal");

createPostBtn.addEventListener("click", function() {
    postModal.style.display = "flex";
});

closeModal.addEventListener("click", function() {
    postModal.style.display = "none";
});

window.addEventListener("click", function(event) {
    if (event.target === postModal) {
        postModal.style.display = "none";
    }
});

document.getElementById("postForm").addEventListener("submit", function(event) {
    event.preventDefault();
    const username = getCookie("username");
    if (!username) {
        alert("No hay usuario logeado. Por favor, inicia sesión.");
        return;
    }
    const imageInput = document.getElementById("postImage").files[0];
    const title = document.getElementById("postTitle").value;
    const text = document.getElementById("postText").value;
    const hashtags = document.getElementById("postHashtags").value;

    const formData = new FormData();
    formData.append("usuario", username);
    if (imageInput) formData.append("imagen", imageInput);
    formData.append("titulo", title);
    formData.append("texto", text);
    formData.append("hashtags", hashtags);

    fetch("save_post.php", {
        method: "POST",
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        if (data.message === "Publicación creada exitosamente") {
            postModal.style.display = "none";
            document.getElementById("postForm").reset();
            loadPosts(); // Recargar publicaciones tras crear una nueva
        }
    })
    .catch(error => {
        console.error("Error:", error);
        alert("Error al crear la publicación");
    });
});

function updateClock() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    document.getElementById("clock").textContent = `${hours}:${minutes}:${seconds}`;
}
setInterval(updateClock, 1000);
updateClock();