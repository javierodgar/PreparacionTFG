import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ServiciosService } from '../servicios.service'; // Asegúrate de tener tu servicio
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common'; // Importa CommonModule

@Component({
  selector: 'app-hashtag-posts',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './hashtag-posts.component.html',
  styleUrl: './hashtag-posts.component.css'
})
export class HashtagPostsComponent implements OnInit, OnDestroy {
  hashtag: string = '';
  posts: any[] = [];
  loading: boolean = false;
  error: string = '';
  dataUrl = 'http://localhost/dataTFG/'; // Añade esta línea
  private routeSub: Subscription | undefined;

  constructor(
    private route: ActivatedRoute,
    private service: ServiciosService // Inyecta el nuevo servicio
  ) { }

  ngOnInit(): void {
    this.loading = true;
    this.routeSub = this.route.params.subscribe(params => {
      this.hashtag = params['hashtag'];
      this.loadPostsByHashtag(this.hashtag);
    });
  }

  ngOnDestroy(): void {
    if (this.routeSub) {
      this.routeSub.unsubscribe();
    }
  }

  loadPostsByHashtag(hashtag: string): void {
    this.loading = true;
    this.error = '';
    this.service.getPostsByHashtag(hashtag).subscribe({
      next: (data: any[]) => {
        this.posts = data.filter(post => post.tipo === 'publicacion'); // Ya no es necesario filtrar por hashtags aquí
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar las publicaciones.';
        console.error(err);
        this.loading = false;
        this.posts = [];
      }
    });
  }

  // Método trackBy para mejorar el rendimiento de *ngFor
  trackById(index: number, post: any): number {
    return post.id; // Asegúrate de que cada post tenga una propiedad 'id'
  }
}