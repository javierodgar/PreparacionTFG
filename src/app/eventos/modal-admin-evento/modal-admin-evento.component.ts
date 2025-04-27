import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EditarEventoComponent } from './editar-evento/editar-evento.component';
import { ListadoInscritosComponent } from './listado-inscritos/listado-inscritos.component';
import { ServiciosEventosService } from '../../servicios-eventos.service';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-modal-admin-evento',
  imports: [CommonModule, EditarEventoComponent, ListadoInscritosComponent],
  templateUrl: './modal-admin-evento.component.html',
  styleUrl: './modal-admin-evento.component.css'
})
export class ModalAdminEventoComponent implements OnInit, OnDestroy {
  @Input() isVisible: boolean = false;
  @Output() recargarEvento = new EventEmitter<any>();
  @Output() modalClosed = new EventEmitter<void>();
  @Output() eventoGuardado = new EventEmitter<any>();
  activeTab: 'edicion' | 'suscritos' | 'eliminar' = 'edicion';
  eventoId: number | null = null;
  loggedInUsername = '';
  private readonly destroy$ = new Subject<void>();

  constructor(
    private serviciosEventosService: ServiciosEventosService,
    private route: ActivatedRoute
  ) { }

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

  closeModal(): void {
    this.isVisible = false;
    this.modalClosed.emit();
  }

  ngOnInit(): void {
    this.loggedInUsername = this.getCookie('username') || '';
    if (!this.loggedInUsername) {
      console.error('No se encontró el nombre de usuario en las cookies.');
    }
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        this.eventoId = +idParam;
      } else {
        console.warn('No se encontró el ID del evento en la URL.');
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  guardarCambios(eventoEditado: any): void {
    console.log('Evento editado recibido en el modal:', eventoEditado);
    this.eventoGuardado.emit(eventoEditado);
    this.recargarEvento.emit('recargar');
    this.closeModal();
  }

  cancelarEdicion(): void {
    this.setActiveTab('edicion');
  }

  setActiveTab(tab: 'edicion' | 'suscritos' | 'eliminar'): void {
    this.activeTab = tab;
  }

  eliminarEvento(): void {
    if (this.eventoId) {
      this.serviciosEventosService.eliminarEvento(this.eventoId)
        .pipe(takeUntil(this.destroy$))
        .subscribe(
          (response) => {
            console.log('Evento eliminado:', response);
            this.recargarEvento.emit('recargar');
            this.closeModal();
          },
          (error) => {
            console.error('Error al eliminar el evento:', error);
            // Aquí podrías mostrar un mensaje de error al usuario
          }
        );
    } else {
      console.warn('No se puede eliminar el evento. ID del evento no encontrado en la URL.');
    }
  }
}