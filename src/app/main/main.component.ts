import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServiciosService } from '../servicios.service';
import { PostUpdateService } from '../post-update.service';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
@Component({
  selector: 'app-main',
  imports: [RouterOutlet, CommonModule, FormsModule,ReactiveFormsModule],
  templateUrl: './main.component.html',
  styleUrl: './main.component.css'
})
export class MainComponent {

  dataUrl = 'dataTFG/';
  posts: any[] = []; // Todas las publicaciones
  filteredPosts: any[] = []; // Publicaciones filtradas
  filterValue: string = ''; // Valor del input de búsqueda
  filterType: string = 'usuario'; // Tipo de filtro por defecto
  showModal: boolean = false; //control para mostrar modal
  username: string | null = null;
  // Formulario para crear publicaciones
  postForm = new FormGroup({
    titulo: new FormControl('', [Validators.required]),
    texto: new FormControl('', [Validators.required]),
    hashtags: new FormControl(''),
    imagen: new FormControl<File |null>(null)
  });


  
  constructor(
    private router: Router, 
    private http: HttpClient, 
    private servicios: ServiciosService,
    private postUpdateService: PostUpdateService 
  ) { // Inyecta el servicio) {
    this.username = this.getCookie('username');
    if(this.username == null){
      this.router.navigate(['/']);
    }
  }
  
  /**
   * Gets the value of a cookie with the given name.
   * Returns null if the cookie does not exist.
   * @param name The name of the cookie.
   */
  private getCookie(name: string): string | null {
    const nameEQ = name + "=";
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.startsWith(nameEQ)) {
        return cookie.substring(nameEQ.length);
      }
    }
    return null;
  }

  openModal() {
    this.showModal = true;
    console.log('abre')
  }


  closeModal(){
    this.showModal = false;
    this.postForm.reset();
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.postForm.patchValue({ imagen: input.files[0] });
    }
  }

  /**
   * Función que se ejecuta al enviar el formulario de creación de publicación.
   * Verifica si el formulario es válido y si el usuario está logeado.
   * Si el formulario es válido, crea un objeto FormData con los datos del formulario
   * y los envía al servidor para guardar la publicación.
   * Si la respuesta del servidor es positiva, cierra el modal.
   * Si hay un error, muestra el error en la consola.
   * Si el formulario no es válido, muestra el error en la consola.
   */
  onSubmit() {
    if(!this.username){
      alert('No hay usuario logeado. Por favor, inicia sesión.');
      this.router.navigate(['']);
    }
    if (this.postForm.valid) {
      const formData = new FormData();
      formData.append('usuario', this.username!);
      formData.append('titulo', this.postForm.get('titulo')!.value!);
      formData.append('texto', this.postForm.get('texto')!.value!);
      formData.append('hashtags', this.postForm.get('hashtags')!.value || '');
      const imageFile = this.postForm.get('imagen')!.value;
      if (imageFile) {
        formData.append('imagen', imageFile);
      }

      this.servicios.savePost(formData).subscribe({
        next: (response) => {
          console.log('Respuesta del servidor:', response);
          if (response.message === "Publicación creada exitosamente") {
            this.closeModal();
            this.postUpdateService.anouncePostCreated();
          }
        },
        error: (error) => {
          console.error('Error al guardar la publicación:', error);
        }
      });
    } else {
      console.log('Formulario no válido:', this.postForm.errors);
    }
  }


  /**
   * Shows the posts page.
   */
  showPosts(){
    this.router.navigate(['main/posts']);
  }

  /**
   * Navigates to the user information page.
   */
  showUser(){
    this.router.navigate(['main/user_info'])
  }
  
}
