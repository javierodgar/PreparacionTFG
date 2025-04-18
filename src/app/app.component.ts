import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select'; // Importa NgSelectModule

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NgSelectModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'TFG';
}
