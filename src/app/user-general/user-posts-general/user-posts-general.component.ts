import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
@Component({
  selector: 'app-user-posts-general',
  imports: [CommonModule],
  templateUrl: './user-posts-general.component.html',
  styleUrl: './user-posts-general.component.css'
})
export class UserPostsGeneralComponent {
  @Input() posts: any[] = [];
  @Input() dataUrl: string = '';
  @Output() viewPost = new EventEmitter<number>();

  constructor(private router: Router) { }

  goToPost(id: number) {
    this.viewPost.emit(id);
  }
}
