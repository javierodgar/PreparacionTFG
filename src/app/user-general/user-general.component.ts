import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ServiciosService } from '../servicios.service';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { PostUpdateService } from '../post-update.service';
import { UserEventsGeneralComponent } from './user-events-general/user-events-general.component';
import { UserPostsGeneralComponent } from './user-posts-general/user-posts-general.component';

@Component({
  selector: 'app-user-general',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, UserEventsGeneralComponent, UserPostsGeneralComponent],
  templateUrl: './user-general.component.html',
  styleUrl: './user-general.component.css'
})
export class UserGeneralComponent implements OnInit {
  dataUrl = 'http://localhost/dataTFG/';
  userData: any = null;
  posts: any[] = [];
  events: any[] = []; // Para los eventos del usuario
  followersCount: number = 0;
  followingCount: number = 0;
  showEditModal: boolean = false;
  username: string | null = null;
  profileImage: string | null = null;
  valoracionGlobal: number | null = null;
  isFollowing: boolean = false; // Variable para controlar el estado de seguimiento
  showPosts: boolean = true;

  private postUpdateSubscription: Subscription;

  constructor(
    private servicios: ServiciosService,
    private router: Router,
    private route: ActivatedRoute,
    private postUpdateService: PostUpdateService
  ) {
    this.postUpdateSubscription = this.postUpdateService.postCreated$.subscribe(() => {
      this.loadPosts();
    });
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.username = params.get('username');
      if (!this.username) {
        alert('No se encontró un nombre de usuario en la ruta. Por favor, verifica la URL.');
        this.router.navigate(['/']);
      } else {
        this.loadUserData();
        this.loadProfileImage();
        this.loadValoracionGlobal();
        this.checkIfFollowing(); // Verificar si el usuario actual sigue a este perfil
      }
    });
  }

  getCookie(name: string): string | null {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
  }

  marcarUsuario(tipo: 'bueno' | 'malo') {
    if (this.username) {
      this.servicios.marcarUsuario(this.username, tipo).subscribe({
        next: (response) => {
          console.log(`Usuario marcado como ${tipo}:`, response);
          if (tipo === 'bueno') {
            this.marcarBuenUsuario();
          } else if (tipo === 'malo') {
            this.marcarMalUsuario();
          }
          this.loadValoracionGlobal();
        },
        error: (error) => {
          console.error(`Error al marcar como ${tipo}:`, error);
          if (error.status === 409) {
            alert(error.error.message);
          } else {
            alert(`Error al marcar como ${tipo}.`);
          }
        }
      });
    }
  }

  loadPosts() {
    // ... (sin cambios)
  }

  loadUserData() {
    console.log(this.username)
    this.servicios.getUserData(this.username!).subscribe({
      next: (data) => {
        if (data.user) {
          this.userData = data.user;
          this.posts = data.posts;
          this.followersCount = data.followersCount;
          this.followingCount = data.followingCount;
          this.events = data.events || [];
        } else {
          this.userData = null;
          console.log('Usuario no encontrado');
        }
      },
      error: (error) => {
        console.error('Error al cargar datos del usuario:', error);
      }
    });
  }

  loadProfileImage() {
    this.servicios.getProfileImageValoracion(this.username!).subscribe({
      next: (data) => {
        this.profileImage = data.profile_image || null;
      },
      error: (error) => {
        console.error('Error al cargar la imagen de perfil:', error);
        this.profileImage = null;
      }
    });
  }

  loadValoracionGlobal() {
    if (this.username) {
      this.servicios.getValoracionGlobal(this.username).subscribe({
        next: (data) => {
          this.valoracionGlobal = data.valoracion_global;
        },
        error: (error) => {
          console.error('Error al cargar la valoración global:', error);
          this.valoracionGlobal = null;
        }
      });
    }
  }

  // SIMULACIÓN - Reemplazar con la lógica real para obtener el usuario actual
  getCurrentLoggedInUsername(): string | null {
    return this.getCookie('username');
  }


checkIfFollowing() {
    const loggedInUsername = this.getCurrentLoggedInUsername();
    if (loggedInUsername && this.username && loggedInUsername !== this.username) {
      this.servicios.isFollowing(loggedInUsername, this.username).subscribe({
        next: (data) => {
          this.isFollowing = data.is_following;
        },
        error: (error) => {
          console.error('Error al verificar si se está siguiendo:', error);
          this.isFollowing = false; // En caso de error, asumimos que no se está siguiendo
        }
      });
    } else if (loggedInUsername === this.username) {
      this.isFollowing = true; // Un usuario se considera a sí mismo como "siguiendo" (para ocultar el botón)
    }
  }

  toggleFollow() {
    const loggedInUsername = this.getCurrentLoggedInUsername();
    if (loggedInUsername && this.username && loggedInUsername !== this.username) {
      this.servicios.followUnfollow(loggedInUsername, this.username).subscribe({
        next: (response) => {
          this.isFollowing = !this.isFollowing;
          // Opcional: Actualizar el contador de seguidores en tiempo real si es necesario
          this.loadUserData(); // Recargar datos para actualizar los contadores
        },
        error: (error) => {
          console.error('Error al seguir/dejar de seguir:', error);
          // Posiblemente mostrar un mensaje al usuario
        }
      });
    }
  }

  marcarBuenUsuario() {
    if (this.username) {
      this.servicios.marcarBuenUsuario(this.username).subscribe({
        next: (response) => {
          console.log('Buen usuario marcado:', response);
          this.loadValoracionGlobal();
        },
        error: (error) => {
          console.error('Error al marcar como buen usuario:', error);
        }
      });
    }
  }

  marcarMalUsuario() {
    if (this.username) {
      this.servicios.marcarMalUsuario(this.username).subscribe({
        next: (response) => {
          console.log('Mal usuario marcado:', response);
          this.loadValoracionGlobal();
        },
        error: (error) => {
          console.error('Error al marcar como mal usuario:', error);
        }
      });
    }
  }

  goToPost(id: number) {
    this.router.navigate(['main/big_post', id]);
  }

  handleViewPost(postId: number) {
    this.goToPost(postId);
  }

  handleViewEvent(eventId: number) {
    // Aquí podrías navegar a la página de detalles del evento
    console.log('Ver detalles del evento:', eventId);
  }

  toggleView(view: 'posts' | 'events') {
    this.showPosts = view === 'posts';
  }
}