import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServiciosService } from '../servicios.service';
import { PostUpdateService } from '../post-update.service';
import { Subscription } from 'rxjs';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';

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

  private postUpdateSubscription: Subscription;


  // Formulario para crear publicaciones
  postForm = new FormGroup({
    titulo: new FormControl('', [Validators.required]),
    texto: new FormControl('', [Validators.required]),
    hashtags: new FormControl(''),
    imagen: new FormControl<File |null>(null)
  });

  constructor(private router: Router, private http: HttpClient, private servicios: ServiciosService, private postUpdateService: PostUpdateService) {
    this.postUpdateSubscription = this.postUpdateService.postCreated$.subscribe(() => { // Suscribirse al servicio de actualización de publicaciones
      this.loadPosts(); // Cargar publicaciones actualizadas
    });
  }

  ngOnInit() {
    this.loadPosts(); // Cargar publicaciones al iniciar el componente
  }

  goToPost(id: number) {
    this.router.navigate(['main/big_post', id]);
  }

  
  loadPosts(filter: { value: string } | null = null) {
    this.servicios.getPosts().subscribe({
      next: (data: any) => {
        if (data.data && data.data.length > 0) {
          this.posts = data.data.map((post: any) => {
            if (post.hashtags) {
              // Divide la cadena por comas y elimina espacios en blanco alrededor
              post.formattedHashtags = post.hashtags.split(',').map((tag: string) => tag.trim());
            } else {
              post.formattedHashtags = [];
            }
            return post;
          });
          this.applyFilter(filter);
        } else {
          this.filteredPosts = [];
        }
      },
      error: (error: any) => {
        console.error("Error al cargar publicaciones:", error);
        this.filteredPosts = [];
      }
    });
  }

  applyFilter(filter: { value: string } | null) {
    if (filter && filter.value) {
      const searchTerm = filter.value.toLowerCase();
      this.filteredPosts = this.posts.filter(post =>
        post.titulo?.toLowerCase().includes(searchTerm) ||
        post.texto?.toLowerCase().includes(searchTerm) ||
        post.formattedHashtags?.some((tag: string) => tag.toLowerCase().includes(searchTerm))
      );
    } else {
      this.filteredPosts = [...this.posts];
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
