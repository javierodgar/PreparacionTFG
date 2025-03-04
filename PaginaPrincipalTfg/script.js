var modalLog = document.getElementById("myModal");
    var btn = document.querySelector(".btnLogin");
    var spanLog = document.querySelector(".close");

    btn.onclick = function() {
        modalLog.style.display = "block";
    }

    spanLog.onclick = function() {
        modalLog.style.display = "none";
    }

    window.onclick = function(event) {
        if (event.target == modalLog) {
            modalLog.style.display = "none";
        }
    }

    // Función para generar la clave secreta desde el hash MD5 (no recomendado para producción)
    async function generateKeyFromUsername(username) {
    // Preparamos el nombre de usuario para hashear
    let encoder = new TextEncoder();
    let usernameBytes = encoder.encode(username);

    //Generamos hash SHA-256
    let hashBuffer = await window.crypto.subtle.digest("SHA-256", usernameBytes);

    //para poder verlo en consola
    let hashArray = Array.from(new Uint8Array(hashBuffer));
    let hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
    console.log("Hash SHA-256 del nombre de usuario:", hashHex);

    // Crear una clave AES a partir del hash del nombre de usuario
    return window.crypto.subtle.importKey(
        "raw", //Tipo de clave
        hashBuffer, //Datos de la clave (nombre de usuario convertido a bytes)
        { name: "AES-GCM" }, //Algoritmo
        false, //No puede exportarse
        ["encrypt", "decrypt"] //Usos permitidos
    );
    }


    //Función cifrado AES-GCM
    async function encryptPassword(password, secretKey) {
        let encoder = new TextEncoder();
        let passwordBytes = encoder.encode(password);

        //Generar un valor aleatorio para el nonce (vector de inicialización)
        //let iv = window.crypto.getRandomValues(new Uint8Array(12));  // AES-GCM usa un IV de 12 bytes

        //Definir un IV letante (valor de inicialización fijo)
        let iv = new Uint8Array(12);
        iv.fill(0); 

        //Cifrar la contraseña
        let encryptedData = await window.crypto.subtle.encrypt(
            { name: "AES-GCM", iv: iv },
            secretKey,
            passwordBytes
        );

        return { encryptedData, iv };
    }

    //formulario de login
    document.getElementById("loginForm").onsubmit = async function(event) {
        event.preventDefault();  // Prevenir el comportamiento por defecto (recargar la página)

        let usernameLog = document.getElementById('usernameLog').value;
        //Generamos nuestra clave
        let secretKey = await generateKeyFromUsername(usernameLog);

        //Ciframos la contraseña con AES-GCM y la clave que hemos generado
        let { encryptedData, iv } = await encryptPassword(password.value, secretKey);

        //Convertir el resultado cifrado a un formato que se pueda mostrar o almacenar
        let encryptedPasswordBase64 = btoa(String.fromCharCode(...new Uint8Array(encryptedData)));
        let ivBase64 = btoa(String.fromCharCode(...iv));

        let loginData = {
            username: usernameLog,
            encryptedPassword: encryptedPasswordBase64,  
            iv: ivBase64 
        };

        //Mostramos los datos cifrados y listos para enviar a la base de datos
        console.log("Datos de Login:", JSON.stringify(loginData));

        fetch("dataGet.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username: usernameLog })
        })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            //realizamos las comprobaciones sobre los datos que se han recibido para aregurarnos de que el usuario existe y la contraseña es correcta
            //en princpio la comprobacion de si el usuarios existe es redundante ya que rescatamos los datos apartir del nombre del usuario, pero
            //se realiza para asegurar el correcto funcionamiento de la base de datos
            if (data.data) {
                console.log("Usuario:", data.data.username);
                console.log("Contraseña cifrada:", data.data.encryptedPassword);
                if (data.data.username){
                    console.log("Usuario correcto");
                    if (data.data.encryptedPassword === encryptedPasswordBase64) {
                        console.log("Contraseña correcta");
                        alert("Login correcto");
                        document.cookie = `username=${encodeURIComponent(usernameLog)}; path=/`;
                        window.location.href = "paginaPrincipal.html";
                    } else {
                        console.log("Contraseña incorrecta");
                        alert("Login incorrecto");
                    }
                }
            } else {
                console.log(data.message);
            }
        })
        .catch(error => console.error("Error:", error));

    };

    let modalReg = document.getElementById("registerModal");
    let btnRegister = document.querySelector(".btnRegister");
    let spanClose = document.querySelector(".closeReg");

    btnRegister.onclick = function () {
        modalReg.style.display = "block";
    };

    spanClose.onclick = function () {
        modalReg.style.display = "none";
    };

    window.onclick = function (event) {
        if (event.target === modalReg) {
            modalReg.style.display = "none";
        }
    };

    // Función para manejar el registro
    document.getElementById("registerForm").onsubmit = async function (event) {
        event.preventDefault();

        // Obtener los valores del formulario
        let usernameReg = document.getElementById("usernameReg").value;
        let firstName = document.getElementById("firstName").value;
        let lastName1 = document.getElementById("lastName1").value;
        let lastName2 = document.getElementById("lastName2").value;
        let city = document.getElementById("city").value;
        let email = document.getElementById("email").value;
        
        let password = document.getElementById("passwordreg").value;
        let confirmPassword = document.getElementById("confirmPassword").value;

        // Comprobar que las contraseñas coinciden
        if (password !== confirmPassword) {
            alert("Las contraseñas no coinciden.");
            return;
        }

        //Generamos clave privada
        let secretKey = await generateKeyFromUsername(usernameReg);

        //Ciframos
        let { encryptedData, iv } = await encryptPassword(password, secretKey);

        //Preparamos datos para almacenaje
        let encryptedPasswordBase64 = btoa(String.fromCharCode(...new Uint8Array(encryptedData)));
        let ivBase64 = btoa(String.fromCharCode(...iv));

        //creamos objeto JSON
        let registrationData = {
            username: usernameReg,
            firstName: firstName,
            lastName: lastName1,
            lastName2: lastName2,
            city: city,
            email: email,
            encryptedPassword: encryptedPasswordBase64
        };

        // Mostramos los datos por consola ya preparados para enviar al servidor
        console.log("Datos de Registro:", JSON.stringify(registrationData));

        fetch("dataUser.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username: usernameReg })
        })
        .then(response => response.json())
        .then(checkData => {
            if (checkData.data) {
                // Si el usuario existe, mostrar alerta y vaciar solo el campo usernameReg
                alert("El nombre de usuario ya está en uso. Por favor, elige otro.");
                document.getElementById("usernameReg").value = ""; // Vaciar solo el campo de usuario
            } else {
                // Si el usuario no existe, proceder con el envío al servidor
                fetch("dataSave.php", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(registrationData)
                })
                .then(response => response.json())
                .then(data => {
                    alert(data.message);
                    if (data.message === "Usuario registrado exitosamente") {
                        window.location.href = "paginaPrincipal.html";
                    }
                })
                .catch(error => {
                    console.error("Error al guardar los datos:", error);
                });
            }
        })
        .catch(error => {
            console.error("Error al verificar el nombre de usuario:", error);
            alert("Hubo un problema al verificar el nombre de usuario. Intenta de nuevo.");
        });
    };