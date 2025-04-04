import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServiciosService } from '../servicios.service';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-posts',
  imports: [CommonModule, FormsModule,ReactiveFormsModule],
  templateUrl: './posts.component.html',
  styleUrl: './posts.component.css'
})

export class PostsComponent {
  dataUrl = 'dataTFG/';
  posts: any[] = []; // Todas las publicaciones
  filteredPosts: any[] = []; // Publicaciones filtradas
  filterValue: string = ''; // Valor del input de búsqueda
  filterType: string = 'usuario'; // Tipo de filtro por defecto
  showModal: boolean = false; //control para mostrar modal

  // Formulario para crear publicaciones
  postForm = new FormGroup({
    usuario: new FormControl('', [Validators.required]),
    titulo: new FormControl('', [Validators.required]),
    texto: new FormControl('', [Validators.required]),
    hashtags: new FormControl(''),
    imagen: new FormControl<File |null>(null)
  });

  constructor(private http: HttpClient, private servicios: ServiciosService) {}

  ngOnInit() {
    this.loadPosts(); // Cargar publicaciones al iniciar el componente
  }

  
  loadPosts(filter: { value: string } | null = null) {
    this.servicios.getPosts().subscribe({
      next: (data:any) => {
        if (data.data && data.data.length > 0) {
          this.posts = data.data;
          this.applyFilter(filter);
        } else {
          this.filteredPosts = [];
        }
      },
      error: (error:any) => {
        console.error("Error al cargar publicaciones:", error);
        this.filteredPosts = [];
      }
    });
  }

  /**
   * Aplica el filtro a las publicaciones y muestra las publicaciones
   * que coinciden con el valor del filtro.
   * Si no hay filtro, muestra todas las publicaciones.
   * @param filter { value: string } | null Valor del filtro, o null si no hay
   *        filtro.
   */
  applyFilter(filter: { value: string } | null) {
    if (filter && filter.value) {
      this.filterValue = filter.value;
      this.filteredPosts = this.posts.filter(post => {
        const field = post[this.filterType] ? post[this.filterType].toLowerCase() : "";
        return field.includes(this.filterValue.toLowerCase());
      });
    } else {
      this.filteredPosts = [...this.posts]; // Mostrar todas si no hay filtro
    }

    if (this.filteredPosts.length === 0) {
      console.log("No se encontraron publicaciones con el filtro:", this.filterValue);
    }
  }

  onFilterKeydown(event: KeyboardEvent) {
    if (event.key === "Enter") {
      event.preventDefault();
      this.loadPosts({ value: this.filterValue });
    }
  }

  onFilterTypeChange() {
    this.loadPosts({ value: this.filterValue }); // Recargar con el nuevo tipo de filtro
  }


  /**
   * Abre el modal de creacion de publicaciones
   */
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

  onSubmit() {
    if (this.postForm.valid) {
      const formData = new FormData();
      formData.append('usuario', this.postForm.get('usuario')!.value!);
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
            this.loadPosts(); // Recargar publicaciones tras guardar
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
}
