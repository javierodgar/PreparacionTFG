import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServiciosEventosService } from '../../../servicios-eventos.service';
import { Subject, takeUntil, switchMap  } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-listado-inscritos',
  imports: [CommonModule],
  templateUrl: './listado-inscritos.component.html',
  styleUrl: './listado-inscritos.component.css'
})
export class ListadoInscritosComponent {
  eventoId: number | null = null;
  inscritos: any[] = [];
  private readonly destroy$ = new Subject<void>();

  constructor(
    private serviciosEventosService: ServiciosEventosService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        const idParam = params.get('id');
        if (idParam) {
          this.eventoId = +idParam;
          return this.cargarInscritosObservable(+idParam);
        } else {
          console.warn('No se encontró el ID del evento en la URL.');
          return [[]];
        }
      }),
      takeUntil(this.destroy$)
    ).subscribe(
      (data) => {
        this.inscritos = data;
        console.log('Inscritos del evento:', this.inscritos);
      },
      (error) => {
        console.error('Error al cargar los inscritos:', error);
      }
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarInscritosObservable(eventoId: number) {
    return this.serviciosEventosService.obtenerInscritosEvento(eventoId);
  }

  cargarInscritos(): void {
    if (this.eventoId !== null) {
      this.serviciosEventosService.obtenerInscritosEvento(this.eventoId)
        .pipe(takeUntil(this.destroy$))
        .subscribe(
          (data) => {
            this.inscritos = data;
          },
          (error) => {
            console.error('Error al cargar los inscritos:', error);
          }
        );
    }
  }

  eliminarInscrito(usuarioId: number) {
    if (this.eventoId !== null) {
      this.serviciosEventosService.eliminarInscritoEvento(this.eventoId, usuarioId)
        .pipe(takeUntil(this.destroy$))
        .subscribe(
          (response) => {
            console.log('Respuesta de eliminación:', response);
            this.cargarInscritos(); // Recargar la lista para actualizar la tabla
          },
          (error) => {
            console.error('Error al eliminar el inscrito:', error);
          }
        );
    } else {
      console.warn('No se puede eliminar el inscrito porque no se tiene el ID del evento.');
    }
  }
}
