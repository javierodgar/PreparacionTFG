import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
@Component({
  selector: 'app-main',
  imports: [RouterOutlet],
  templateUrl: './main.component.html',
  styleUrl: './main.component.css'
})
export class MainComponent {

  username: string | null = null;
  constructor(private router: Router) {
    this.username = this.getCookie('username');
  }
  
  /**
   * Gets the value of a cookie with the given name.
   * Returns null if the cookie does not exist.
   * @param name The name of the cookie.
   */
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

  /**
   * Shows the posts page.
   */
  showPosts(){
    this.router.navigate(['main/posts']);
  }

  /**
   * Navigates to the user information page.
   */
  showUser(){
    this.router.navigate(['main/user_info'])

  }
  
}
