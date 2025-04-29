import { Component, ViewChild, ElementRef } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServiciosService } from '../servicios.service';
import { PostUpdateService } from '../post-update.service';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { ServiciosEventosService } from '../servicios-eventos.service';
import { EventosSideComponent } from './eventos-side/eventos-side.component';
@Component({
  selector: 'app-main',
  imports: [RouterOutlet, CommonModule, FormsModule, ReactiveFormsModule, EventosSideComponent],
  templateUrl: './main.component.html',
  styleUrl: './main.component.css'
})
export class MainComponent {

  publicacionesDestacadas: any[] = [];
  loading: boolean = true;
  error: string = '';
  usuarioLogueado = 'asd';
 
  eventosPopulares: any[] = [];
  usuarioCreadorExcluir: string = 'asd';

  activeTab:  'destacadas' | 'events' = 'destacadas';

  dataUrl = 'dataTFG/';
  posts: any[] = []; // Todas las publicaciones
  filteredPosts: any[] = []; // Publicaciones filtradas
  filterValue: string = ''; // Valor del input de búsqueda
  filterType: string = 'usuario'; // Tipo de filtro por defecto
  showModal: boolean = false; //control para mostrar modal
  username: string | null = null;
  profileImageUrl: string | null = null; // Variable para almacenar la URL de la imagen de perfil
  errorMessageProfileImage: string | null = null; // Variable para el mensaje de error de la imagen de perfil
  selectedHashtags: string[] = []; // Array para almacenar los hashtags añadidos

  // Formulario para crear publicaciones
  postForm = new FormGroup({
    titulo: new FormControl('', [Validators.required]),
    texto: new FormControl('', [Validators.required]),
    hashtags: new FormControl<string[]>([]) // Para enviar al backend
    ,
    imagen: new FormControl<File | null>(null)
  });

  @ViewChild('hashtagInput') hashtagInput!: ElementRef; // Referencia al input de hashtags

  eventosInscritos: any[] = []; // Array para almacenar los eventos inscritos

  constructor(
    private router: Router,
    private http: HttpClient,
    private servicios: ServiciosService,
    private postUpdateService: PostUpdateService,
    private eventoService: ServiciosEventosService
  ) { // Inyecta el servicio) {
    this.username = this.getCookie('username');
    if (this.username == null) {
      this.router.navigate(['/']);
    } else {
      this.obtenerImagenPerfil(); // Llama a la función al inicializar si hay un usuario logueado
      this.usuarioLogueado = this.username; // Asigna el username a la variable de usuario logueado
      this.usuarioCreadorExcluir = this.username; // Asigna el username a la variable de eventos populares
    }
  }

  ngOnInit() {
    this.cargarEventosInscritos(this.username); // Cargar eventos inscritos al iniciar el componente
    this.cargarPublicacionesDestacadas();
    this.cargarEventosPopulares();
  }

  setActiveTab(tab: 'destacadas' | 'events'): void {
    this.activeTab = tab; 
  }

  cargarEventosPopulares(): void {
    this.loading = true;
    this.error = '';

    this.servicios.getEventosPopulares(this.usuarioCreadorExcluir)
      .subscribe({
        next: (data) => {
          console.log('Datos recibidos del backend:', data);
          this.eventosPopulares = data;
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Error al cargar los eventos populares.';
          console.error(err);
          this.loading = false;
        }
      });
  }

  showEventoId(eventoId: number): void {
    this.router.navigate(['main/big_event', eventoId]);
  }

  cargarPublicacionesDestacadas(): void {
    this.loading = true;
    this.servicios.getPublicacionesDestacadas(this.usuarioLogueado).subscribe({
      next: (data) => {
        this.publicacionesDestacadas = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar las publicaciones destacadas.';
        console.error(err);
        this.loading = false;
      }
    });
  }


  showPostId(postId: number): void {
    this.router.navigate(['main/big_post', postId]); 
  }

  private setCookie(name: string, value: string, days: number): void {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = `${name}=${value}; ${expires}; path=/`;
  }


  cargarEventosInscritos(username:any): void {
    console.log('Cargando eventos inscritos para el usuario:', username);
    this.eventoService.obtenerEventosInscritos(username).subscribe(
      (eventos) => {
        this.eventosInscritos = eventos; // Guardamos el array de eventos en la variable
        console.log('Eventos inscritos:', this.eventosInscritos);
        // Aquí puedes hacer cualquier otra cosa que necesites con los datos
      },
      (error) => {
        console.error('Error al cargar eventos inscritos:', error);
        // Aquí puedes manejar el error, mostrar un mensaje al usuario, etc.
      }
    );
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
    console.log('abre');
  }

  closeModal() {
    this.showModal = false;
    this.postForm.reset();
    this.selectedHashtags = []; // Limpiar la lista de hashtags al cerrar el modal
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.postForm.patchValue({ imagen: input.files[0] });
    }
  }

  addHashtagFromInput() {
    const inputValue = this.hashtagInput.nativeElement.value;
    const trimmedTag = inputValue.trim();
    if (trimmedTag && !this.selectedHashtags.includes(trimmedTag)) {
      const formattedTag = trimmedTag.startsWith('#') ? trimmedTag : `#${trimmedTag}`;
      this.selectedHashtags.push(formattedTag);
    }
    this.hashtagInput.nativeElement.value = ''; // Limpiar el input después de añadir
  }

  removeSelectedHashtag(hashtagToRemove: string) {
    this.selectedHashtags = this.selectedHashtags.filter(hashtag => hashtag !== hashtagToRemove);
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
    if (!this.username) {
      alert('No hay usuario logeado. Por favor, inicia sesión.');
      this.router.navigate(['']);
    }
    if (this.postForm.valid) {
      const formData = new FormData();
      formData.append('usuario', this.username!);
      formData.append('titulo', this.postForm.get('titulo')!.value!);
      formData.append('texto', this.postForm.get('texto')!.value!);
      formData.append('hashtags', this.selectedHashtags.join(',')); // Usamos el array de hashtags
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
  showPosts() {
    this.router.navigate(['main/posts']);
  }

  /**
   * Navigates to the user information page.
   */
  showUser() {
    this.router.navigate(['main/user_info']);
  }

  showSearch() {
    this.router.navigate(['main/search']);
  }

  showEvents(){
    this.router.navigate(['main/events']);
  }

  obtenerImagenPerfil(): void {
    if (this.username) {
      this.servicios.obtenerImagenPerfil(this.username).subscribe({
        next: (data) => {
          if (data && data.profile_image) {
            this.profileImageUrl = 'http://localhost/dataTFG/' + data.profile_image;
            this.errorMessageProfileImage = null;
            console.log('URL de la imagen de perfil:', this.profileImageUrl);
            this.setCookie('valoracionUsuario', data.valoracion_global, 1);
          } else {
            this.profileImageUrl = null;
            this.errorMessageProfileImage = data?.message || 'No se encontró la imagen de perfil.';
            console.log(this.errorMessageProfileImage);
          }
        },
        error: (error) => {
          console.error('Error al obtener la imagen de perfil:', error);
          this.profileImageUrl = null;
          this.errorMessageProfileImage = 'Error al conectar con el servidor.';
        }
      });
    } else {
      console.log('No hay username disponible para obtener la imagen de perfil.');
    }
  }
}