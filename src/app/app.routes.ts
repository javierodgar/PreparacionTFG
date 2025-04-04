import { Routes } from '@angular/router';
import { ArriveComponent } from './arrive/arrive.component';
import { MainComponent } from './main/main.component';
import { PostsComponent } from './posts/posts.component';
import { ErrorComponent } from './error/error.component';
import { UserProfileComponent } from './user-profile/user-profile.component';

export const routes: Routes = [
    {
        path: '',
        component: ArriveComponent
    },
    {
        path: 'main',
        component: MainComponent,
        children: [
            { path: 'posts', component: PostsComponent },
            { path: 'user_info', component: UserProfileComponent}
        ]
    },
    {
        path: '404',
        component: ErrorComponent
    },
    {
        path: '**',
        redirectTo: '404'
    }
];
