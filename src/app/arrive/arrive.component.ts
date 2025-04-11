import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ServiciosService } from '../servicios.service';

@Component({
  selector: 'app-arrive',
  imports: [FormsModule],
  templateUrl: './arrive.component.html',
  styleUrl: './arrive.component.css'
})
export class ArriveComponent {
  showLoginModal: boolean = false;
  showRegisterModal: boolean = false;

  constructor (private servicios: ServiciosService, private router: Router) {}

  loginData = {
    username: '',
    password: ''
  };

  registerData = {
    username: '',
    firstName: '',
    lastName1: '',
    lastName2: '',
    email: '',
    city: '',
    password: '',
    confirmPassword: '',
    profileImage: null as File | null
  };

  //funcion para generacion de claves de cifrado
  async  generateKeyFromUsername(username:any) {
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
  
  //funcion para cifrado mediante AES-GCM sobre 256bits de cadena
  async encryptPassword(password:any, secretKey:any) {
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

  
/**
 * Abre el modal de tipo especificado (login o register)
 * @param modalType tipo de modal a abrir, puede ser "login" o "register"
 */
  openModal(modalType: string) {
    if (modalType === 'login') {
      this.showLoginModal = true;
    } else if (modalType === 'register') {
      this.showRegisterModal = true;
    }
  }

/**
 * Closes the specified modal.
 * @param modalType - The type of modal to close, can be "login" or "register".
 */
  closeModal(modalType: string) {
    if (modalType === 'login') {
      this.showLoginModal = false;
    } else if (modalType === 'register') {
      this.showRegisterModal = false;
    }
  }

  
/**
 * Sets a cookie in the browser with a specified name, value, and expiration period.
 * 
 * @param name - The name of the cookie.
 * @param value - The value to be stored in the cookie.
 * @param days - The number of days until the cookie expires.
 */
  private setCookie(name: string, value: string, days: number): void {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = `${name}=${value}; ${expires}; path=/`;
  }

  /**
   * Verifica el login de un usuario.
   * Primero, se extrae la clave secreta del nombre de usuario.
   * Luego, se cifra la contraseña con esta clave secreta.
   * Se compara la contraseña cifrada con la almacenada en la base de datos.
   * Si coincide, se muestra un mensaje de login correcto, se crea una cookie con el nombre de usuario y se navega a la pantalla principal.
   * Finalmente, se cierra el modal de login.
   */
  async onLoginSubmit() {
    // console.log('Login data:', this.loginData);
    let secretKey = await this.generateKeyFromUsername(this.loginData.username);
    let { encryptedData, iv } = await this.encryptPassword(this.loginData.password, secretKey);
    let encryptedPasswordBase64 = btoa(String.fromCharCode(...new Uint8Array(encryptedData)));

    const response = await this.servicios.getUser(this.loginData.username);
    
    if (response.data) {
      // console.log('Usuario:', response.data.username);
      // console.log('Contraseña encriptada:', response.data.encryptedPassword);
      // console.log('contrasela cifrada en tiempo real: ', encryptedPasswordBase64);
      if(response.data.encryptedPassword === encryptedPasswordBase64){
        console.log('Login correcto');
        this.setCookie('username', this.loginData.username, 1);
        this.router.navigate([`/main`])
      }
    } else {
      console.log(response.message);
      if (response.error) {
        console.error('Detalles del error:', response.error);
      }
    }
    this.closeModal('login');
  }

  onFileChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
        this.registerData.profileImage = file;
    }
}

  async onRegisterSubmit() {
        if (this.registerData.password === this.registerData.confirmPassword) {
            console.log('Register data:', this.registerData);
            let secretKey = await this.generateKeyFromUsername(this.registerData.username);
            let { encryptedData, iv } = await this.encryptPassword(this.registerData.password, secretKey);
            let encryptedPasswordBase64 = btoa(String.fromCharCode(...new Uint8Array(encryptedData)));

            const formData = new FormData();
            formData.append('username', this.registerData.username);
            formData.append('firstName', this.registerData.firstName);
            formData.append('lastName', this.registerData.lastName1);
            formData.append('lastName2', this.registerData.lastName2 || '');
            formData.append('city', this.registerData.city);
            formData.append('email', this.registerData.email);
            formData.append('encryptedPassword', encryptedPasswordBase64);

            if (this.registerData.profileImage) {
                formData.append('profileImage', this.registerData.profileImage, this.registerData.profileImage.name);
            }

            try {
                const response = await this.servicios.register(formData).toPromise();
                console.log('Register Respuesta:', response);
                this.closeModal('register');
                this.router.navigate(['/']);
            } catch (error) {
                console.error('Error al registrar:', error);
            }

        } else {
            alert('Las contraseñas no coinciden');
        }
    }
}
