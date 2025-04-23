import { Component, Output, EventEmitter, Input, AfterViewInit, OnDestroy, ElementRef, ViewChild, NgZone } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ServiciosEventosService } from '../../servicios-eventos.service';
import { Map, TileLayer, Marker, LatLng, divIcon } from 'leaflet';
import { Subject, takeUntil, debounceTime } from 'rxjs'; // Importa debounceTime
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-crear-eventos',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './crear-eventos.component.html',
  styleUrls: ['./crear-eventos.component.css']
})
export class CrearEventosComponent implements AfterViewInit, OnDestroy {
  @Input() isVisible: boolean = false;
  @Output() modalCerrado = new EventEmitter<void>();
  @Output() eventoCreadoExitoso = new EventEmitter<void>();

  @ViewChild('mapaCrear') mapContainer!: ElementRef;
  private map: Map | undefined;
  private marker: Marker | undefined;
  private readonly destroy$ = new Subject<void>();
  private direccionInputValue = new Subject<string>(); // Subject para el debounce
  latitud: number = 41.655;
  longitud: number = -4.725;
  direccion: string = '';

  constructor(private serviciosService: ServiciosEventosService, private ngZone: NgZone, private http: HttpClient) { }

  ngAfterViewInit(): void {
    this.initMap();
    this.setupDireccionDebounce(); // Asegúrate de llamar a esta función
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.map) {
      this.map.remove();
    }
  }

  cerrar() {
    this.isVisible = false;
    this.modalCerrado.emit();
  }

  submitForm(event: any) {
    event.preventDefault();
    this.mostrarCoordenadasEnConsola();
    this.guardarNuevoEvento(event.target);
  }

  mostrarCoordenadasEnConsola() {
    console.log('Coordenadas al enviar: Latitud:', this.latitud, 'Longitud:', this.longitud);
  }

  guardarNuevoEvento(form: any) {
    const nuevoEvento = {
      titulo: form.titulo.value,
      descripcion: form.descripcion.value,
      categoria: form.categoria.value,
      imagen_portada: form.imagen_portada.files[0],
      direccion: this.direccion,
      fecha_inicio: form.fecha_inicio.value,
      fecha_fin: form.fecha_fin.value,
      latitud: this.latitud,
      longitud: this.longitud
    };

    this.serviciosService.crearEvento(this.formData(nuevoEvento)).subscribe(
      (response) => {
        console.log('Evento creado:', response);
        this.eventoCreadoExitoso.emit();
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
    formData.append('latitud', evento.latitud.toString());
    formData.append('longitud', evento.longitud.toString());
    return formData;
  }

  private initMap(): void {
    if (this.mapContainer) {
      this.map = new Map(this.mapContainer.nativeElement).setView([this.latitud, this.longitud], 13);

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

      this.marker = new Marker([this.latitud, this.longitud], { icon: customIcon, draggable: true }).addTo(this.map);

      this.marker.on('dragend', () => {
        const newLatLng = this.marker?.getLatLng();
        if (newLatLng) {
          this.latitud = newLatLng.lat;
          this.longitud = newLatLng.lng;
          console.log('Nueva latitud (drag):', this.latitud, 'Nueva longitud (drag):', this.longitud);
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
          this.latitud = parseFloat(results[0].lat);
          this.longitud = parseFloat(results[0].lon);
          console.log('Coordenadas obtenidas (geocode): Latitud:', this.latitud, 'Longitud:', this.longitud);
          this.updateMarkerPosition();
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
          this.direccion = data.display_name;
          console.log('Dirección obtenida (reversa):', this.direccion);
        } else {
          this.direccion = 'Dirección no encontrada';
          console.warn('No se pudo obtener la dirección para estas coordenadas.');
        }
      },
      (error) => {
        this.direccion = 'Error al obtener la dirección';
        console.error('Error en la geocodificación inversa:', error);
      }
    );
  }

  updateMarkerPosition() {
    if (this.map && this.marker) {
      const newLatLng = new LatLng(this.latitud, this.longitud);
      this.marker.setLatLng(newLatLng);
      this.map.setView(newLatLng, 13);
    }
  }
}