import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrearEventosComponent } from './crear-eventos/crear-eventos.component'; // Ajusta la ruta correcta
import { ServiciosEventosService } from '../servicios-eventos.service';
import { Router } from '@angular/router';
@Component({
  selector: 'app-eventos',
  standalone: true,
  imports: [CommonModule, FormsModule, CrearEventosComponent],
  templateUrl: './eventos.component.html',
  styleUrls: ['./eventos.component.css']
})
export class EventosComponent implements OnInit {
  eventos: any[] = [];
  filtroBusqueda: string = '';
  mostrarModalCrearEvento: boolean = false;
  valoracionUsuario: number = 0;

  constructor(private serviciosService: ServiciosEventosService, private router: Router) { }

  ngOnInit(): void {
    this.cargarEventos();
    this.valoracionUsuario = parseInt(this.getCookie('valoracionUsuario') || '0');
  }

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


  cargarEventos() {
    this.serviciosService.obtenerEventos().subscribe(
      (data) => {
        this.eventos = data;
      },
      (error) => {
        console.error('Error al cargar eventos:', error);
      }
    );
  }

  abrirModalCrearEvento() {
    if(this.valoracionUsuario >= 2.000){
      this.mostrarModalCrearEvento = true;
    } else {
      console.warn('No puedes crear un evento si no tienes una valoración de 2 o superior.');
    }
  }

  cerrarModalCrearEvento() {
    this.mostrarModalCrearEvento = false;
  }

  onEventoCreadoExitoso() {
    this.cargarEventos(); // Recargar la lista de eventos cuando se crea uno nuevo
    this.cerrarModalCrearEvento(); // Cerrar el modal
  }

  filtrarEventos(): any[] {
    if (!this.filtroBusqueda) {
      return this.eventos;
    }
    const filtro = this.filtroBusqueda.toLowerCase();
    return this.eventos.filter(evento =>
      evento.titulo.toLowerCase().includes(filtro) ||
      evento.descripcion.toLowerCase().includes(filtro) ||
      evento.categoria.toLowerCase().includes(filtro) ||
      (evento.direccion && evento.direccion.toLowerCase().includes(filtro)) ||
      (evento.fecha_inicio && new Date(evento.fecha_inicio).toLocaleDateString().includes(filtro))
    );
  }

  chunkArray(array: any[], size: number): any[][] {
    const chunkedArr: any[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunkedArr.push(array.slice(i, i + size));
    }
    return chunkedArr;
  }

  mostrarIdEvento(evento: any) {
    console.log('ID del evento clickeado:', evento.id);
    this.router.navigate(['main/big_event', evento.id]);
  }
}