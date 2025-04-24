import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ServiciosEventosService } from '../../servicios-eventos.service';
import { CommonModule, DatePipe } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { MapaComponent } from '../mapa/mapa.component';
import { LatLng } from 'leaflet';
import { ServiciosService } from '../../servicios.service';
import { ModalAdminEventoComponent } from '../modal-admin-evento/modal-admin-evento.component';

@Component({
  selector: 'app-evento-detalle',
  standalone: true,
  imports: [CommonModule, DatePipe, MapaComponent, ModalAdminEventoComponent],
  templateUrl: './evento-detalle.component.html',
  styleUrls: ['./evento-detalle.component.css']
})
export class EventoDetalleComponent implements OnInit, OnDestroy {
  evento: any;
  eventoId: number = 0;
  loggedInUsername: any; // se remplaza el nombre de usuario recogiendolo desde la cookie
  private readonly destroy$ = new Subject<void>();
  eventoCoords: LatLng = new LatLng(41.619819091543846, -4.759047446744906);
  esCreador: boolean = false; // Nueva propiedad para indicar si el usuario es el creador
  userIdLogueado: number | null = null; // ID del usuario logueado
  mostrarModalAdmin: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private serviciosService: ServiciosEventosService,
    private servicioGeneral: ServiciosService
  ) { }

  ngOnInit(): void {
    this.loggedInUsername = this.getCookie('username');
    this.obtenerIdUsuarioLogueado(this.loggedInUsername); // Obtener el ID del usuario logueado
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.eventoId = +params['id'];
      this.cargarDetalleEvento(this.eventoId, this.loggedInUsername);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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

  cargarDetalleEvento(id: number, username: string | null) {
    if (username) {
      this.serviciosService.obtenerEventoDetalle(id, username).pipe(takeUntil(this.destroy$)).subscribe(
        (data) => {
          this.evento = data;
          console.log('Detalle del evento:', this.evento);
          this.actualizarCoordenadas();
          this.verificarCreador(); // Llamar a la función para verificar si es el creador
        },
        (error) => {
          console.error('Error al cargar el detalle del evento:', error);
        }
      );
    } else {
      console.warn('No se ha definido el nombre de usuario.');
    }
  }

  actualizarCoordenadas(): void {
    if (this.evento && this.evento.latitud !== null && this.evento.longitud !== null) {
      this.eventoCoords = new LatLng(parseFloat(this.evento.longitud), parseFloat(this.evento.latitud));
      console.log('Coordenadas del evento actualizadas:', this.eventoCoords);
    } else {
      console.warn('No se recibieron latitud o longitud válidas del backend, manteniendo las coordenadas iniciales.');
    }
  }

  obtenerIdUsuarioLogueado(nombreUsuario: string): void {
    this.servicioGeneral.getUserIdByUsername(nombreUsuario).pipe(takeUntil(this.destroy$)).subscribe(
      (response) => {
        this.userIdLogueado = response.id;
        console.log('ID del usuario logueado:', this.userIdLogueado);
        // Aquí puedes realizar cualquier acción adicional que necesites con el ID del creador
      },
      (error) => {
        console.error('Error al obtener el ID del usuario logueado:', error);
        this.userIdLogueado = null;
      }
    );
  }

  verificarCreador(): void {
    this.esCreador = this.evento && this.evento.usuario_creador_id == this.userIdLogueado;
    console.log('ID del creador del evento:', this.evento.usuario_creador_id);
    console.log('ID del usuario logueado:', this.userIdLogueado);
    console.log('Es creador del evento:', this.esCreador);
  }

  mostrarPepinillo(): void {
    console.log('pepinillo');
    this.mostrarModalAdmin = true;
  }

  darLike() {
    if (this.loggedInUsername) {
      this.serviciosService.gestionarLikeDislike(this.eventoId, 'like', this.loggedInUsername).pipe(takeUntil(this.destroy$)).subscribe(
        (response) => {
          console.log('Respuesta del like:', response);
          this.cargarDetalleEvento(this.eventoId, this.loggedInUsername);
        },
        (error) => {
          console.error('Error al dar like:', error);
        }
      );
    } else {
      console.warn('Debes estar logueado para dar like.');
    }
  }

  darDislike() {
    if (this.loggedInUsername) {
      this.serviciosService.gestionarLikeDislike(this.eventoId, 'dislike', this.loggedInUsername).pipe(takeUntil(this.destroy$)).subscribe(
        (response) => {
          console.log('Respuesta del dislike:', response);
          this.cargarDetalleEvento(this.eventoId, this.loggedInUsername);
        },
        (error) => {
          console.error('Error al dar dislike:', error);
        }
      );
    } else {
      console.warn('Debes estar logueado para dar dislike.');
    }
  }

  inscribirse() {
    if (this.loggedInUsername) {
      this.serviciosService.inscribirseEvento(this.eventoId, this.loggedInUsername).pipe(takeUntil(this.destroy$)).subscribe(
        (response) => {
          console.log('Respuesta de inscripción:', response);
          this.cargarDetalleEvento(this.eventoId, this.loggedInUsername);
        },
        (error) => {
          console.error('Error al inscribirse:', error);
        }
      );
    } else {
      console.warn('Debes estar logueado para inscribirte.');
    }
  }

  desinscribirse() {
    if (this.loggedInUsername) {
      this.serviciosService.desinscribirseEvento(this.eventoId, this.loggedInUsername).pipe(takeUntil(this.destroy$)).subscribe(
        (response) => {
          console.log('Respuesta de desinscripción:', response);
          this.cargarDetalleEvento(this.eventoId, this.loggedInUsername);
        },
        (error) => {
          console.error('Error al desinscribirse:', error);
        }
      );
    } else {
      console.warn('Debes estar logueado para desinscribirse.');
    }
  }

  get usuarioLogueadoId(): boolean {
    return !!this.loggedInUsername;
  }
}