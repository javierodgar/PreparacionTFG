import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { ServiciosService } from '../servicios.service';
import { Router, ActivatedRoute } from '@angular/router'; // Importar ActivatedRoute
import { Subscription } from 'rxjs';
import { PostUpdateService } from '../post-update.service';

@Component({
  selector: 'app-user-general',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './user-general.component.html',
  styleUrl: './user-general.component.css'
})
export class UserGeneralComponent {
  // Declaración de variables necesarias para este componente
  dataUrl = 'http://localhost/dataTFG/';
  userData: any = null;
  posts: any[] = [];
  followersCount: number = 0;
  followingCount: number = 0;
  showEditModal: boolean = false;
  username: string | null = null; // Ahora se obtiene de la ruta
  profileImage: string | null = null;

  private postUpdateSubscription: Subscription;

  constructor(
    private servicios: ServiciosService, 
    private router: Router, 
    private route: ActivatedRoute, // Inyectar ActivatedRoute
    private postUpdateService: PostUpdateService
  ) {
    this.postUpdateSubscription = this.postUpdateService.postCreated$.subscribe(() => {
      this.loadPosts();
    });
  }

  /**
   * Se llama cuando se inicia el componente. Se encarga de:
   * 
   * 1. Obtener el nombre de usuario desde la ruta.
   * 2. Mostrar un mensaje de error si no hay usuario en la ruta.
   * 3. Cargar la información del usuario.
   * 4. Cargar la imagen del perfil del usuario.
   */
  ngOnInit() {
    // Obtener el nombre de usuario desde la ruta
    this.route.paramMap.subscribe(params => {
      this.username = params.get('username'); // Obtener el parámetro 'username' de la ruta
      if (!this.username) {
        alert('No se encontró un nombre de usuario en la ruta. Por favor, verifica la URL.');
        this.router.navigate(['/']);
      } else {
        // Cargar los datos del usuario y la imagen de perfil si el nombre de usuario es válido
        this.loadUserData();
        this.loadProfileImage();
      }
    });
  }

  // Métodos existentes (sin cambios)
  getCookie(name: string): string | null {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
  }

  loadPosts() {
    if (this.username) {
      this.servicios.getUserData(this.username).subscribe({
        next: (data) => {
          if (data && data.posts) {
            this.posts = data.posts;
          } else {
            console.log('No se encontraron publicaciones o hubo un error al recargarlas.');
          }
        },
        error: (error) => {
          console.error('Error al recargar las publicaciones:', error);
        }
      });
    } else {
      console.warn('No se puede recargar las publicaciones porque no hay usuario especificado.');
    }
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
  
  goToPost(id: number) {
    this.router.navigate(['main/big_post', id]);
  }
}