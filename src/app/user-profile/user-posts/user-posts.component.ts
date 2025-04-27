import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-posts',
  imports: [CommonModule],
  templateUrl: './user-posts.component.html',
  styleUrl: './user-posts.component.css'
})
export class UserPostsComponent {
  @Input() posts: any[] = [];
  @Input() dataUrl: string = '';
  @Output() viewPost = new EventEmitter<number>();

  constructor(private router: Router) { }

  goToPost(id: number) {
    this.viewPost.emit(id);
  }
}
