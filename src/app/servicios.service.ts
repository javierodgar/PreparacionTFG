import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class ServiciosService {
  private baseUrl = 'http://localhost/dataTFG/'; // Ajusta la URL según tu configuración

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

  register(formData: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}register.php`, formData);
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

  getPublicationWithComments(publicacionId: number): Observable<any> {
    const params = { publicacion_id: publicacionId.toString() };
    return this.http.get<any>(`${this.baseUrl}get_post_coments.php`, { params: params, headers: this.getHeaders() });
  }

  saveComment(publicacionId: number, username: string, texto: string): Observable<any> {
    const body = {
      publicacion_id: publicacionId,
      username: username,
      texto: texto
    };
    return this.http.post(`${this.baseUrl}save_comment.php`, body, { headers: this.getHeaders() });
  }

  likeDislikePost(publicacionId: number, username: string, tipo: 'like' | 'dislike'): Observable<any> {
    const body = {
      publicacion_id: publicacionId,
      username: username,
      tipo: tipo
    };
    return this.http.post(`${this.baseUrl}like_dislike_post.php`, body, { headers: this.getHeaders() });
  }

  getLikesDislikes(publicacionId: number): Observable<any> {
    const params = { publicacion_id: publicacionId.toString() };
    return this.http.get<any>(`${this.baseUrl}get_likes_dislikes.php`, { params: params, headers: this.getHeaders() });
  }

  deleteComment(comentarioId: number): Observable<any> {
    const params = { comentario_id: comentarioId.toString() };
    return this.http.delete(`${this.baseUrl}delete_comment.php`, { params: params, headers: this.getHeaders() });
  }

  updateComment(publicacionId: number, comentarioId: number, nuevoTexto: string): Observable<any> {
    const body = {
      publicacion_id: publicacionId,
      comentario_id: comentarioId,
      nuevo_texto: nuevoTexto
    };
    return this.http.put(`${this.baseUrl}update_comment.php`, body, { headers: this.getHeaders() });
  }

  search(searchTerm: string, filterOptions: string[]): Observable<any> {
    let url = `${this.baseUrl}search.php?term=${encodeURIComponent(searchTerm)}`;

    if (filterOptions && filterOptions.length > 0) {
      url += `&filters=${encodeURIComponent(JSON.stringify(filterOptions))}`;
    }

    return this.http.get(url, { headers: this.getHeaders() });
  }

  getMatchingHashtags(query: string): Observable<any> {
    const url = `${this.baseUrl}get_hashtags.php?query=${encodeURIComponent(query)}`;
    return this.http.get(url);
  }

    // Nueva función: Registrar usuario
  // async register(username: string, firstName: string, lastName: string, lastName2: string, city: string, email: string, encryptedPassword: string): Promise<any> {
  //   const body = {
  //     username,
  //     firstName,
  //     lastName,
  //     lastName2,
  //     city,
  //     email,
  //     encryptedPassword
  //   };
  //   try {
  //     const response = await this.http.post(
  //       `${this.baseUrl}register.php`,
  //       body,
  //       { headers: this.getHeaders() }
  //     ).toPromise();
  //     return response;
  //   } catch (error) {
  //     console.error('Error en register:', error);
  //     return { message: 'Error en la solicitud', error };
  //   }
  // }
}
