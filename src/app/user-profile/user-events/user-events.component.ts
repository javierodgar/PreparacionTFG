import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-events',
  imports: [CommonModule, DatePipe],
  templateUrl: './user-events.component.html',
  styleUrl: './user-events.component.css'
})
export class UserEventsComponent {
  @Input() events: any[] = [];
  @Input() dataUrl: string = 'http://localhost/dataTFG/'; // Asegúrate de que coincida con tu URL base
  @Output() viewEvent = new EventEmitter<number>();

  constructor(private router: Router) { }

  goToEvent(id: number) {
    this.viewEvent.emit(id);
  }
}
