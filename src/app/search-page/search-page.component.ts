import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Importa CommonModule
import { ServiciosService } from '../servicios.service';
import { FormsModule } from '@angular/forms'; // Importa FormsModule
import { Router } from '@angular/router';

@Component({
  selector: 'app-search-page',
  imports: [FormsModule, CommonModule],
  templateUrl: './search-page.component.html',
  styleUrl: './search-page.component.css'
})
export class SearchPageComponent implements OnInit{
  searchTerm: string = '';
  filterOptions = [
    { name: 'Publicaciones', value: 'publicaciones', checked: false },
    { name: 'Hashtags', value: 'hashtags', checked: false },
    { name: 'Usuarios', value: 'usuarios', checked: false }
  ];
  searchResults: any[] = [];
  topHashtags: any[] = []; // Array para los hashtags superiores
  loading: boolean = false;
  error: string = '';

  constructor(private searchService: ServiciosService, private router: Router) { }

  ngOnInit(): void {
    this.loadTopHashtags();
  }

  loadTopHashtags() {
    this.searchService.search('', ['hashtags']).subscribe({
      next: (data: any[]) => {
        this.topHashtags = data.filter((result: any) => result.tipo === 'hashtag')
                                  .sort((a: any, b: any) => b.conteo - a.conteo);
      },
      error: (err) => {
        console.error('Error al cargar hashtags:', err);
      }
    });
  }

  onFilterChanged(option: any) {
    option.checked = !option.checked;
  }

  onSearch() {
    const selectedFilters = this.filterOptions
      .filter(option => option.checked)
      .map(option => option.value);

    if (this.searchTerm.trim() === '' && selectedFilters.length === 0) {
      this.searchResults = [];
      return;
    }

    this.loading = true;
    this.error = '';
    this.searchService.search(this.searchTerm, selectedFilters).subscribe({
      next: (data: any[]) => {
        this.searchResults = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al realizar la búsqueda.';
        console.error(err);
        this.loading = false;
        this.searchResults = [];
      }
    });
  }

  consoleLog(value: any, type: string) {
    if (type === 'hashtag') {
      console.log('Hashtag clicado:', value);
      this.router.navigate(['main/hastag_posts', value]); // Navega al componente
    } else if (type === 'publicacion') {
      console.log('Publicación clicada (ID):', value);
      this.goToPost(value);
    } else if (type === 'usuario') {
      console.log('Usuario clicado:', value);
      this.showUserGeneral(value);
    } else if (type === 'follow') {
      console.log('Botón Seguir clicado:', value);
    }
  }

  stopEvent(event: Event) {
    event.stopPropagation();
  }

  goToPost(id: number) {
    this.router.navigate(['main/big_post', id]);
  }

  showUserGeneral(username: string) {
    this.router.navigate(['main/user_general', username]);
  }

}

