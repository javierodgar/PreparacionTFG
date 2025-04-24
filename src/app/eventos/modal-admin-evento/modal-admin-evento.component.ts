import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal-admin-evento',
  imports: [CommonModule ],
  templateUrl: './modal-admin-evento.component.html',
  styleUrl: './modal-admin-evento.component.css'
})
export class ModalAdminEventoComponent {
  @Input() isVisible: boolean = false;
  @Output() modalClosed = new EventEmitter<void>();
  activeTab: 'edicion' | 'suscritos' | 'eliminar' = 'edicion';

  closeModal(): void {
    this.isVisible = false;
    this.modalClosed.emit();
  }

  setActiveTab(tab: 'edicion' | 'suscritos' | 'eliminar'): void {
    this.activeTab = tab;
  }
}
