import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EditarEventoComponent } from './editar-evento/editar-evento.component';
import { ServiciosEventosService } from '../../servicios-eventos.service';
@Component({
  selector: 'app-modal-admin-evento',
  imports: [CommonModule, EditarEventoComponent ],
  templateUrl: './modal-admin-evento.component.html',
  styleUrl: './modal-admin-evento.component.css'
})
export class ModalAdminEventoComponent {
  @Input() isVisible: boolean = false;
  @Output() recargarEvento = new EventEmitter<any>();
  @Output() modalClosed = new EventEmitter<void>();
  @Output() eventoGuardado = new EventEmitter<any>();
  activeTab: 'edicion' | 'suscritos' | 'eliminar' = 'edicion';
  eventoParaEditar: any = null;
  loggedInUsername = 'asd'
  constructor(
    private serviciosEventosService: ServiciosEventosService
  ) { }

  closeModal(): void {
    this.isVisible = false;
    this.modalClosed.emit();
  }
  ngOnInit(): void {
    
  }
  guardarCambios(eventoEditado: any): void {
    // Aquí recibirás los datos del evento editado desde EventoEditComponent
    console.log('Evento editado recibido en el modal:', eventoEditado);
    this.eventoGuardado.emit(eventoEditado);
    this.recargarEvento.emit('recargar');
    this.closeModal(); // O realiza cualquier otra acción necesaria
  }

  cancelarEdicion(): void {
    this.setActiveTab('edicion'); // Vuelve a la lista o a la vista anterior
  }


  setActiveTab(tab: 'edicion' | 'suscritos' | 'eliminar'): void {
    this.activeTab = tab;
  }
}
