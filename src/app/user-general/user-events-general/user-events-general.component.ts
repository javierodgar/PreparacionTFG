import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
@Component({
  selector: 'app-user-events-general',
  imports: [CommonModule, DatePipe],
  templateUrl: './user-events-general.component.html',
  styleUrl: './user-events-general.component.css'
})
export class UserEventsGeneralComponent {
  @Input() events: any[] = [];
  @Input() dataUrl: string = 'http://localhost/dataTFG/'; // Ajusta la URL si es diferente
  @Output() viewEvent = new EventEmitter<number>();

  constructor(private router: Router) { }

  goToEvent(id: number) {
    this.viewEvent.emit(id);
  }
}
