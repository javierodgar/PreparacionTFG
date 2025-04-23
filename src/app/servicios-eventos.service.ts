import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Eventos } from './eventos';

@Injectable({
  providedIn: 'root'
})
export class ServiciosEventosService {
  private baseUrl = 'http://localhost/dataTFG/eventos/'; // Reemplaza con la URL base de tu backend

  constructor(private http: HttpClient) { }

  obtenerEventos(): Observable<Eventos[]> {
    return this.http.get<Eventos[]>(`${this.baseUrl}obtener_eventos.php`);
  }

  crearEvento(formData: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}crear_evento.php`, formData);
  }

  obtenerEventoDetalle(id: number, username: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/obtener_evento.php?id=${id}&username=${username}`);
  }

  gestionarLikeDislike(eventoId: number, tipo: 'like' | 'dislike', username: string): Observable<any> {
    const body = { evento_id: eventoId, tipo: tipo, username: username };
    return this.http.post(`${this.baseUrl}/gestionar_like_dislike.php`, body);
  }

  inscribirseEvento(eventoId: number, username: string): Observable<any> {
    const body = { evento_id: eventoId, username: username };
    return this.http.post(`${this.baseUrl}/inscribirse_evento.php`, body);
  }

  desinscribirseEvento(eventoId: number, username: string): Observable<any> {
    const body = { evento_id: eventoId, username: username };
    return this.http.post(`${this.baseUrl}/desinscribirse_evento.php`, body);
  }
}
