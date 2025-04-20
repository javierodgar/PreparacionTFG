import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { ServiciosService } from '../servicios.service';
import { PostUpdateService } from '../post-update.service';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-posts',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgSelectModule],
  templateUrl: './posts.component.html',
  styleUrl: './posts.component.css'
})
export class PostsComponent implements OnInit, OnDestroy {
  dataUrl = 'http://localhost/dataTFG/';
  posts: any[] = [];
  filteredPosts: any[] = [];
  filterValue: string = '';
  filterType: string = 'usuario';
  showModal: boolean = false;

  private postUpdateSubscription: Subscription;

  postForm = new FormGroup({
    usuario: new FormControl(''),
    titulo: new FormControl('', [Validators.required]),
    texto: new FormControl('', [Validators.required]),
    hashtags: new FormControl([]),
    imagen: new FormControl<File | null>(null)
  });

  constructor(private router: Router, private http: HttpClient, private servicios: ServiciosService, private postUpdateService: PostUpdateService) {
    this.postUpdateSubscription = this.postUpdateService.postCreated$.subscribe(() => {
      this.loadPosts();
    });
  }

  ngOnInit() {
    this.postForm.patchValue({ usuario: 'nombreDeUsuario' });
    this.loadPosts();
  }

  goToPost(id: number) {
    this.router.navigate(['main/big_post', id]);
  }

  loadPosts(filter: { value: string } | null = null) {
    this.servicios.getPosts().subscribe({
      next: (data: any) => {
        if (data.data && data.data.length > 0) {
          this.posts = data.data.map((post: any) => {
            // Los hashtags ahora son un array directamente
            post.formattedHashtags = post.hashtags || [];
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
    this.loadPosts({ value: this.filterValue });
  }

  openModal() {
    this.showModal = true;
    console.log('abre');
  }

  closeModal() {
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

      const hashtagsControl = this.postForm.get('hashtags');
      if (hashtagsControl && hashtagsControl.value && Array.isArray(hashtagsControl.value)) {
        const formattedHashtags = hashtagsControl.value.map((hashtag: string) => {
          return hashtag.startsWith('#') ? hashtag : `#${hashtag}`;
        });
        formData.append('hashtags', formattedHashtags.join(','));
      } else {
        formData.append('hashtags', '');
      }

      const imageFile = this.postForm.get('imagen')!.value;
      if (imageFile) {
        formData.append('imagen', imageFile);
      }

      this.servicios.savePost(formData).subscribe({
        next: (response) => {
          console.log('Respuesta del servidor:', response);
          if (response.message === "Publicación creada exitosamente") {
            this.closeModal();
            this.loadPosts();
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

  ngOnDestroy(): void {
    if (this.postUpdateSubscription) {
      this.postUpdateSubscription.unsubscribe();
    }
  }
}