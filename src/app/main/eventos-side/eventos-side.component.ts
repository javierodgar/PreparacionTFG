import { Component, Input, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
@Component({
  selector: 'app-eventos-side',
  imports: [CommonModule, DatePipe],
  templateUrl: './eventos-side.component.html',
  styleUrl: './eventos-side.component.css'
})
export class EventosSideComponent {
  @Input() eventosInscritos: any[] = [];
  eventosPendientes: any[] = [];

  constructor(private router: Router) { }

  ngOnInit(): void {
    this.filtrarEventosPendientes();
  }

  filtrarEventosPendientes(): void {
    const ahora = new Date();
    this.eventosPendientes = this.eventosInscritos.filter(evento => {
      const fechaFinEvento = new Date(evento.fecha_fin);
      return fechaFinEvento > ahora;
    });
  }

  mostrarMensaje(id:number): void {
    console.log('id evento:', id);
    this.router.navigate(['main/big_event', id]);
  }
}
