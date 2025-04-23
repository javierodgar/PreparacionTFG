import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { ServiciosService } from '../servicios.service'; // Importar el nuevo servicio de valoración
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { PostUpdateService } from '../post-update.service';

@Component({
  selector: 'app-user-general',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './user-general.component.html',
  styleUrl: './user-general.component.css'
})
export class UserGeneralComponent implements OnInit {
  dataUrl = 'http://localhost/dataTFG/';
  userData: any = null;
  posts: any[] = [];
  followersCount: number = 0;
  followingCount: number = 0;
  showEditModal: boolean = false;
  username: string | null = null;
  profileImage: string | null = null;
  valoracionGlobal: number | null = null; // Para mostrar la valoración

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
        this.loadValoracionGlobal(); // Cargar la valoración al inicializar
      }
    });
  }

  getCookie(name: string): string | null {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
  }

  loadPosts() {
    // ... (sin cambios)
  }

  loadUserData() {
    this.servicios.getUserData(this.username!).subscribe({
      next: (data) => {
        if (data.user) {
          this.userData = data.user;
          this.posts = data.posts;
          this.followersCount = data.followersCount;
          this.followingCount = data.followingCount;
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
    this.servicios.getProfileImage(this.username!).subscribe({
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
      this.servicios.getValoracionGlobal(this.username).subscribe({ // Asumo que tienes este método en ServiciosService para obtener la valoración inicial
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

  marcarBuenUsuario() {
    if (this.username) {
      this.servicios.marcarBuenUsuario(this.username).subscribe({
        next: (response) => {
          console.log('Buen usuario marcado:', response);
          this.loadValoracionGlobal(); // Recargar la valoración tras la acción
        },
        error: (error) => {
          console.error('Error al marcar como buen usuario:', error);
          // Posiblemente mostrar un mensaje al usuario
        }
      });
    }
  }

  marcarMalUsuario() {
    if (this.username) {
      this.servicios.marcarMalUsuario(this.username).subscribe({
        next: (response) => {
          console.log('Mal usuario marcado:', response);
          this.loadValoracionGlobal(); // Recargar la valoración tras la acción
        },
        error: (error) => {
          console.error('Error al marcar como mal usuario:', error);
          // Posiblemente mostrar un mensaje al usuario
        }
      });
    }
  }

  goToPost(id: number) {
    this.router.navigate(['main/big_post', id]);
  }
}