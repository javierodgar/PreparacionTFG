//funcion encargada de recoger una coockie (la pasamos el nombre de la coocke por valor)
function getCookie(name) {
    let matches = document.cookie.match(new RegExp(
        "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
    ));
    return matches ? decodeURIComponent(matches[1]) : null;
}

//inicializamos una variables en el que se almacenaran las publicaciones de nuestra base de datos
let allPosts = []; // Variable global para almacenar publicaciones

function loadPosts(filter = null) {
    // Recogemos el contenedor principal
    const container = document.getElementById("container");
    container.innerHTML = ""; // Limpiar contenido previo

    // Crear dinámicamente el filter-container
    const filterContainer = document.createElement("div");
    filterContainer.className = "filter-container";

    const filterInput = document.createElement("input");
    filterInput.type = "text";
    filterInput.id = "filterInput";
    filterInput.placeholder = "Buscar...";
    filterContainer.appendChild(filterInput);

    const autorLabel = document.createElement("label");
    const autorRadio = document.createElement("input");
    autorRadio.type = "radio";
    autorRadio.name = "filterType";
    autorRadio.value = "usuario";
    autorRadio.checked = true; // Seleccionado por defecto
    autorLabel.appendChild(autorRadio);
    autorLabel.appendChild(document.createTextNode(" Autor"));
    filterContainer.appendChild(autorLabel);

    const tituloLabel = document.createElement("label");
    const tituloRadio = document.createElement("input");
    tituloRadio.type = "radio";
    tituloRadio.name = "filterType";
    tituloRadio.value = "titulo";
    tituloLabel.appendChild(tituloRadio);
    tituloLabel.appendChild(document.createTextNode(" Título"));
    filterContainer.appendChild(tituloLabel);

    const hashtagsLabel = document.createElement("label");
    const hashtagsRadio = document.createElement("input");
    hashtagsRadio.type = "radio";
    hashtagsRadio.name = "filterType";
    hashtagsRadio.value = "hashtags";
    hashtagsLabel.appendChild(hashtagsRadio);
    hashtagsLabel.appendChild(document.createTextNode(" Hashtags"));
    filterContainer.appendChild(hashtagsLabel);

    // Crear dinámicamente el postsContainer
    const postsContainer = document.createElement("div");
    postsContainer.id = "postsContainer";

    // Añadir ambos al container
    container.appendChild(filterContainer);
    container.appendChild(postsContainer);

    // Cargar publicaciones
    fetch("data/get_posts.php", {
        method: "GET"
    })
    .then(response => response.json())
    .then(data => {
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
                postsContainer.innerHTML = "<p>No se encontraron publicaciones.</p>";
            }
        } else {
            postsContainer.innerHTML = "<p>No hay publicaciones disponibles.</p>";
        }

        // Añadir evento al input después de crearlo
        filterInput.addEventListener("keydown", function(event) {
            if (event.key === "Enter") {
                event.preventDefault();
                loadPosts({ value: filterInput.value });
            }
        });

        // Añadir eventos a los radios
        document.querySelectorAll('input[name="filterType"]').forEach(radio => {
            radio.addEventListener("change", function() {
                loadPosts({ value: filterInput.value });
            });
        });
    })
    .catch(error => {
        console.error("Error al cargar publicaciones:", error);
        postsContainer.innerHTML = "<p>Error al cargar las publicaciones.</p>";
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

    //evento para llamar al fetch para mostrar los datos de usuario
    document.getElementById("profilePic").addEventListener("click", function() {
        fetch("userInfo.html")
        .then(response => {
            if (!response.ok) {
                throw new Error("Error al cargar userProfileLoader.html");
            }
            return response.text();
        })
        .then(html => {
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = html;

            const htmlContent = Array.from(tempDiv.childNodes)
                .filter(node => node.nodeName !== "SCRIPT")
                .map(node => node.outerHTML || node.textContent)
                .join("");

            const scriptSrc = tempDiv.querySelector("script")?.getAttribute("src") || "";

            const mainSection = document.querySelector(".main-section");
            mainSection.innerHTML = htmlContent;

            // Cargar el script externo dinámicamente
            if (scriptSrc) {
                const script = document.createElement("script");
                script.src = scriptSrc;
                script.onload = function() {
                    console.log("Script cargado:", scriptSrc);
                };
                document.body.appendChild(script);
            }
        })
        .catch(error => {
            console.error("Error al cargar el perfil:", error);
            document.querySelector(".main-section").innerHTML = "<p>Error al cargar el perfil</p>";
        });
    });

    document.getElementById("allUsers").addEventListener("click", function() {
        fetch("allUsers.html")
        .then(response => {
            if (!response.ok) {
                throw new Error("Error al cargar allUsersLoader.html");
            }
            return response.text();
        })
        .then(html => {
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = html;

            const htmlContent = Array.from(tempDiv.childNodes)
                .filter(node => node.nodeName !== "SCRIPT")
                .map(node => node.outerHTML || node.textContent)
                .join("");

            const scriptSrc = tempDiv.querySelector("script")?.getAttribute("src") || "";

            const mainSection = document.querySelector(".main-section");
            mainSection.innerHTML = htmlContent;

            if (scriptSrc) {
                const script = document.createElement("script");
                script.src = scriptSrc;
                script.onload = function() {
                    console.log("Script cargado:", scriptSrc);
                };
                document.body.appendChild(script);
            }
        })
        .catch(error => {
            console.error("Error al cargar los usuarios:", error);
            document.querySelector(".main-section").innerHTML = "<p>Error al cargar los usuarios</p>";
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

    fetch("data/save_post.php", {
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

//funcion para recargar publicaciones al hacer clic en el quesito correcto
document.getElementById('showPosts').addEventListener('click', function() {
    loadPosts();
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