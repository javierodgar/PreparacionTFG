import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class ServiciosService {
  private baseUrl = '/dataTFG/'; // Ajusta la URL según tu configuración

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
  }

  // Obtener datos del usuario por username usando promesas
  async getUser(username: string): Promise<any> {
    const body = { username };
    try {
      const response = await this.http.post(
        `${this.baseUrl}dataGet.php`,
        body,
        { headers: this.getHeaders() }
      ).toPromise();
      return response;
    } catch (error) {
      console.error('Error en la solicitud:', error);
      return { message: 'Error en la solicitud', error };
    }
  }

  // Nueva función: Registrar usuario
  async register(username: string, firstName: string, lastName: string, lastName2: string, city: string, email: string, encryptedPassword: string): Promise<any> {
    const body = {
      username,
      firstName,
      lastName,
      lastName2,
      city,
      email,
      encryptedPassword
    };
    try {
      const response = await this.http.post(
        `${this.baseUrl}register.php`,
        body,
        { headers: this.getHeaders() }
      ).toPromise();
      return response;
    } catch (error) {
      console.error('Error en register:', error);
      return { message: 'Error en la solicitud', error };
    }
  }

  // Nueva función: Obtener publicaciones
  getPosts(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}get_posts.php`);
  }

  savePost(postData: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}save_post.php`, postData); // Sin headers porque FormData maneja el Content-Type automáticamente
  }

  getUserData(username: string): Observable<any> {
    const body = { username };
    return this.http.post(`${this.baseUrl}get_user_data.php`, body, { headers: this.getHeaders() });
  }

  updateUser(userData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}update_user.php`, userData);
  }

  getProfileImage(username: string): Observable<any> {
    const body = { username };
    return this.http.post(`${this.baseUrl}get_profile_image.php`, body, { headers: this.getHeaders() });
  }
}
