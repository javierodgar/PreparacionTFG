import { Component, Output, EventEmitter, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ServiciosEventosService } from '../../servicios-eventos.service';
@Component({
  selector: 'app-crear-eventos',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './crear-eventos.component.html',
  styleUrls: ['./crear-eventos.component.css']
})
export class CrearEventosComponent {
  @Input() isVisible: boolean = false;
  @Output() modalCerrado = new EventEmitter<void>();
  @Output() eventoCreadoExitoso = new EventEmitter<void>(); // Nuevo output para notificar al padre

  constructor(private serviciosService: ServiciosEventosService) { }

  cerrar() {
    this.isVisible = false;
    this.modalCerrado.emit();
  }

  submitForm(event: any) {
    event.preventDefault();
    this.guardarNuevoEvento(event.target);
  }

  guardarNuevoEvento(form: any) {
    const nuevoEvento = {
      titulo: form.titulo.value,
      descripcion: form.descripcion.value,
      categoria: form.categoria.value,
      imagen_portada: form.imagen_portada.files[0],
      direccion: form.direccion.value,
      fecha_inicio: form.fecha_inicio.value,
      fecha_fin: form.fecha_fin.value
    };

    this.serviciosService.crearEvento(this.formData(nuevoEvento)).subscribe(
      (response) => {
        console.log('Evento creado:', response);
        this.eventoCreadoExitoso.emit(); // Notificar al padre que el evento se creó
        this.cerrar();
        form.reset();
      },
      (error) => {
        console.error('Error al crear evento:', error);
      }
    );
  }

  formData(evento: any): FormData {
    const formData = new FormData();
    formData.append('titulo', evento.titulo);
    formData.append('descripcion', evento.descripcion);
    formData.append('categoria', evento.categoria);
    if (evento.imagen_portada) {
      formData.append('imagen_portada', evento.imagen_portada, evento.imagen_portada.name);
    }
    formData.append('direccion', evento.direccion);
    formData.append('fecha_inicio', evento.fecha_inicio);
    formData.append('fecha_fin', evento.fecha_fin || '');
    return formData;
  }
}