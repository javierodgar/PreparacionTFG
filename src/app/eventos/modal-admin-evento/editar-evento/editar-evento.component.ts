import { Component, Output, EventEmitter, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { switchMap, takeUntil, debounceTime } from 'rxjs/operators';
import { Map, TileLayer, Marker, LatLng, divIcon } from 'leaflet';
import { Subject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ServiciosEventosService } from '../../../servicios-eventos.service';

interface Evento {
  id?: number;
  titulo: string;
  descripcion?: string;
  categoria: string;
  imagen_portada?: string;
  direccion: string;
  fecha_inicio: string;
  fecha_fin: string;
  latitud: number;
  longitud: number;
}


@Component({
  selector: 'app-editar-evento',
  imports: [CommonModule, FormsModule],
  templateUrl: './editar-evento.component.html',
  styleUrl: './editar-evento.component.css'
})
export class EditarEventoComponent implements OnInit, AfterViewInit, OnDestroy {
  @Output() guardarEvento = new EventEmitter<Evento>();
  @Output() cancelarEdicion = new EventEmitter<void>();
  @ViewChild('mapaCrear') mapContainer: ElementRef | undefined;

  evento: Evento = {
    id: undefined,
    titulo: '',
    categoria: '',
    direccion: '',
    fecha_inicio: '',
    fecha_fin: '',
    latitud: 41.655, // Valores por defecto
    longitud: -4.724
  };

  private map: Map | undefined;
  private marker: Marker | undefined;
  private destroy$ = new Subject<void>();
  private direccionInputValue = new Subject<string>();

  constructor(
    private eventosService: ServiciosEventosService,
    private route: ActivatedRoute,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        const eventoId = params.get('id');
        if (eventoId) {
          return this.eventosService.obtenerEventoPorId(+eventoId);
        } else {
          return [null];
        }
      })
    ).subscribe(eventoDesdeServicio => {
      if (eventoDesdeServicio) {
        this.evento = { ...eventoDesdeServicio };
        // Inicializar el mapa aquí después de obtener las coordenadas del evento
        if (this.map) {
          this.updateMapView();
          this.updateMarkerPosition();
        }
      } else {
        this.inicializarFormularioNuevo();
        // Inicializar el mapa con las coordenadas por defecto
        if (this.map) {
          this.updateMapView();
          this.updateMarkerPosition();
        }
      }
    });
    this.setupDireccionDebounce();
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  inicializarFormularioNuevo(): void {
    this.evento = {
      id: undefined,
      titulo: '',
      categoria: '',
      direccion: '',
      fecha_inicio: '',
      fecha_fin: '',
      latitud: 41.655,
      longitud: -4.724
    };
  }

  onSubmit(): void {
    if (this.evento.id) {
      this.eventosService.actualizarEvento(this.evento.id, this.evento).subscribe(
        (respuesta) => {
          console.log('Evento actualizado con éxito:', respuesta);
          this.guardarEvento.emit(this.evento);
          this.resetFormulario();
        },
        (error) => {
          console.error('Error al actualizar el evento:', error);
        }
      );
    } else {
      console.error('No se puede guardar el evento porque no tiene un ID (esto no debería pasar en la edición).');
    }
  }

  onCancelar(): void {
    this.cancelarEdicion.emit();
    this.resetFormulario();
  }

  actualizarLatitud(lat: number): void {
    this.evento.latitud = lat;
  }

  actualizarLongitud(lng: number): void {
    this.evento.longitud = lng;
  }

  private initMap(): void {
    if (this.mapContainer) {
      this.map = new Map(this.mapContainer.nativeElement).setView([this.evento.latitud, this.evento.longitud], 13);

      new TileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(this.map);

      const customIcon = divIcon({
        className: 'leaflet-div-icon',
        html: '<div style="background-color: red; color: white; border-radius: 50%; width: 20px; height: 20px; display: flex; justify-content: center; align-items: center; font-weight: bold; font-size: 14px;">x</div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
        popupAnchor: [0, -10]
      });

      this.marker = new Marker([this.evento.latitud, this.evento.longitud], { icon: customIcon, draggable: true }).addTo(this.map);

      this.marker.on('dragend', () => {
        const newLatLng = this.marker?.getLatLng();
        if (newLatLng) {
          this.evento.latitud = newLatLng.lat;
          this.evento.longitud = newLatLng.lng;
          console.log('Nueva latitud (drag):', this.evento.latitud, 'Nueva longitud (drag):', this.evento.longitud);
          this.reverseGeocode(newLatLng.lat, newLatLng.lng);
        }
      });

      setTimeout(() => {
        this.map?.invalidateSize();
      }, 0);
    } else {
      console.error('Error: mapContainer no está disponible para inicializar el mapa.');
    }
  }

  setupDireccionDebounce() {
    this.direccionInputValue.pipe(
      debounceTime(500),
      takeUntil(this.destroy$)
    ).subscribe(direccion => {
      if (direccion.length > 3) {
        this.geocodeAddress(direccion);
      } else {
        console.warn('Dirección demasiado corta para geocodificar.');
      }
    });
  }

  onDireccionInput(event: any) {
    this.direccionInputValue.next(event.target.value);
  }

  geocodeAddress(address: string) {
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}, Valladolid, Spain&format=json&limit=1`;

    this.http.get<any[]>(nominatimUrl).pipe(takeUntil(this.destroy$)).subscribe(
      (results) => {
        if (results && results.length > 0) {
          this.evento.latitud = parseFloat(results[0].lat);
          this.evento.longitud = parseFloat(results[0].lon);
          console.log('Coordenadas obtenidas (geocode): Latitud:', this.evento.latitud, 'Longitud:', this.evento.longitud);
          this.updateMarkerPosition();
          this.updateMapView();
        } else {
          console.warn('No se encontraron coordenadas para la dirección:', address);
        }
      },
      (error) => {
        console.error('Error en la geocodificación:', error);
      }
    );
  }

  reverseGeocode(lat: number, lng: number): void {
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;

    this.http.get<any>(nominatimUrl).pipe(takeUntil(this.destroy$)).subscribe(
      (data) => {
        if (data && data.display_name) {
          this.evento.direccion = data.display_name;
          console.log('Dirección obtenida (reversa):', this.evento.direccion);
        } else {
          this.evento.direccion = 'Dirección no encontrada';
          console.warn('No se pudo obtener la dirección para estas coordenadas.');
        }
      },
      (error) => {
        this.evento.direccion = 'Error al obtener la dirección';
        console.error('Error en la geocodificación inversa:', error);
      }
    );
  }

  updateMarkerPosition() {
    if (this.map && this.marker) {
      const newLatLng = new LatLng(this.evento.latitud, this.evento.longitud);
      this.marker.setLatLng(newLatLng);
    }
  }

  updateMapView() {
    if (this.map) {
      this.map.setView([this.evento.latitud, this.evento.longitud], 13);
      setTimeout(() => {
        this.map?.invalidateSize();
      }, 0);
    }
  }

  resetFormulario(): void {
    this.evento = {
      id: undefined,
      titulo: '',
      categoria: '',
      direccion: '',
      fecha_inicio: '',
      fecha_fin: '',
      longitud: 41.655,
      latitud: -4.724
    };
    this.resetMapView();
  }

  resetMapView(): void {
    if (this.map && this.mapContainer) {
      this.map.setView([41.655, -4.724], 13); // Resetea la vista del mapa a las coordenadas iniciales
      if (this.marker) {
        this.marker.setLatLng([41.655, -4.724]); // Resetea la posición del marcador
      }
    }
  }
}
