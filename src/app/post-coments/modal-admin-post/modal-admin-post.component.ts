import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EditarPostComponent } from './editar-post/editar-post.component';
import { ServiciosService } from '../../servicios.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-modal-admin-post',
  imports: [CommonModule, EditarPostComponent ],
  templateUrl: './modal-admin-post.component.html',
  styleUrl: './modal-admin-post.component.css'
})
export class ModalAdminPostComponent {
  @Input() isVisible: boolean = false;
  @Output() modalClosed = new EventEmitter<void>();
  activeTab: 'apartado1' | 'apartado2' | 'apartado3' = 'apartado1';
  postId: number | null = null; // ID de la publicación a editar o eliminar
  

  constructor(
    private postService: ServiciosService,
    private route: ActivatedRoute,
    private router: Router
    ) { }
  

  ngOnInit(): void {
    // Puedes realizar alguna inicialización aquí si es necesario
    this.route.params.subscribe(params => {
      this.postId = +params['id'];
    });
  }

  

  closeModal(): void {
    this.isVisible = false;
    this.modalClosed.emit();
  }

  setActiveTab(tab: 'apartado1' | 'apartado2' | 'apartado3'): void {
    this.activeTab = tab;
  }

  eliminarPublicacion(): void {
    if (this.postId && confirm('¿Estás seguro de que quieres eliminar esta publicación?')) {
      this.postService.eliminarPost(this.postId).subscribe(
        (response) => {
          console.log('Publicación eliminada:', response);
          // Redirigir al usuario a la lista de publicaciones o a otra página
          this.router.navigate(['main/posts']); // Ajusta la ruta según tu aplicación
        },
        (error) => {
          console.error('Error al eliminar la publicación:', error);
          // Mostrar un mensaje de error al usuario
        }
      );
    }
  }

  // Aquí puedes añadir métodos específicos para la lógica de cada apartado
  // Por ejemplo, si cada apartado tiene un formulario y necesita ser enviado.
}
