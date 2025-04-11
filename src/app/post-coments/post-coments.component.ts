import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ServiciosService } from '../servicios.service';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-post-coments',
  imports: [CommonModule, FormsModule],
  templateUrl: './post-coments.component.html',
  styleUrl: './post-coments.component.css'
})
export class PostComentsComponent implements OnInit, OnDestroy {
  title='';
  img='';
  text='';
  hastagh='';
  coments = '';
  likes=0;
  dislikes=0;
  publicacionConComentarios: any;
  publicacionId: number | null = null;
  dataUrl = '/dataTFG/';
  errorLoading: boolean = false;
  newCommentText: string = ''; // Variable para el texto del nuevo comentario
  username: any; // Valor de prueba, ¡REEMPLAZAR!
  private routeSubscription: Subscription | undefined;

  constructor(private route: ActivatedRoute, private serviciosService: ServiciosService) {}

  ngOnInit(): void {
    this.username = this.getCookie('username');
    this.routeSubscription = this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        this.publicacionId = +idParam; // Convertir el parámetro de string a número
        this.loadPublicationDetails();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }

  loadPublicationDetails(): void {
    if (this.publicacionId !== null) {
      this.serviciosService.getPublicationWithComments(this.publicacionId).subscribe(
        (data) => {
          this.publicacionConComentarios = data;
          this.title = this.publicacionConComentarios.titulo;
          this.img = this.publicacionConComentarios.imagen;
          this.text = this.publicacionConComentarios.texto;
          this.hastagh = this.publicacionConComentarios.hashtags;
          this.coments = this.publicacionConComentarios.comentarios;
          this.likes = this.publicacionConComentarios.total_likes;
          this.dislikes = this.publicacionConComentarios.total_dislikes;
          this.errorLoading = false;
        },
        (error) => {
          console.error('Error al cargar la publicación con comentarios:', error);
          this.errorLoading = true;
          this.publicacionConComentarios = null;
        }
      );
    }
  }

  postComment(): void {
    if (this.publicacionId && this.username && this.newCommentText.trim() !== '') {
      this.serviciosService.saveComment(this.publicacionId, this.username, this.newCommentText)
        .subscribe({
          next: (response) => {
            console.log('Comentario enviado:', response);
            this.newCommentText = ''; // Limpiar el input después del éxito
            this.loadPublicationDetails(); // Recargar los comentarios para mostrar el nuevo
            // TODO: Opcionalmente, podrías actualizar la lista de comentarios sin recargar todo
          },
          error: (error) => {
            console.error('Error al enviar el comentario:', error);
            alert('Error al enviar el comentario.');
          }
        });
    } else {
      alert('Por favor, escribe un comentario.');
    }
  }

  onLikeButtonClick(): void {
    if (this.publicacionId) {
      this.serviciosService.likeDislikePost(this.publicacionId, 'asd', 'like')
        .subscribe({
          next: (response) => {
            console.log('Like:', response);
            this.loadLikesDislikesCount();
            // Opcionalmente, podrías recargar los detalles de la publicación.
          },
          error: (error) => {
            console.error('Error al dar like:', error);
            alert('Error al dar like.');
          }
        });
        
    } else {
      alert('ID de publicación no encontrado.');
    }
  }

  onDislikeButtonClick(): void {
    if (this.publicacionId) {
      this.serviciosService.likeDislikePost(this.publicacionId, 'asd', 'dislike')
        .subscribe({
          next: (response) => {
            console.log('Dislike:', response);
            this.loadLikesDislikesCount();
            // Opcionalmente, podrías recargar los detalles de la publicación.
          },
          error: (error) => {
            console.error('Error al dar dislike:', error);
            alert('Error al dar dislike.');
          }
        });
        
    } else {
      alert('ID de publicación no encontrado.');
    }
  }

  loadLikesDislikesCount(): void {
    if (this.publicacionId) {
      this.serviciosService.getLikesDislikes(this.publicacionId)
        .subscribe({
          next: (data) => {
            this.likes = data.total_likes || 0;
            this.dislikes = data.total_dislikes || 0;
            console.log('Likes:', this.likes, 'Dislikes:', this.dislikes);
          },
          error: (error) => {
            console.error('Error al cargar los likes/dislikes:', error);
            // Puedes manejar el error como desees, por ejemplo, mostrar un mensaje al usuario.
          }
        });
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
  
}
