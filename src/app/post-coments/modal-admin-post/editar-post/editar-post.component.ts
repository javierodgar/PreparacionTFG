import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ServiciosService } from '../../../servicios.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
@Component({
  selector: 'app-editar-post',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './editar-post.component.html',
  styleUrl: './editar-post.component.css'
})
export class EditarPostComponent implements OnInit {
  postId: number | null = null;
  postForm: FormGroup;
  post: any;
  selectedFile: File | null = null;
  selectedHashtags: string[] = [];
  @ViewChild('hashtagInput') hashtagInput!: ElementRef;

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private postService: ServiciosService
  ) {
    this.postForm = this.formBuilder.group({
      titulo: ['', Validators.required],
      imagen: [null], // Cambiamos el valor inicial a null
      texto: ['', Validators.required],
      hashtags: ['']
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.postId = +params['id'];
      if (this.postId) {
        this.cargarPost(this.postId);
      }
    });
  }

  addHashtagFromInput() {
    const inputValue = this.hashtagInput.nativeElement.value;
    const trimmedTag = inputValue.trim();
    if (trimmedTag && !this.selectedHashtags.includes(trimmedTag)) {
      const formattedTag = trimmedTag.startsWith('#') ? trimmedTag : `#${trimmedTag}`;
      this.selectedHashtags.push(formattedTag);
    }
    this.hashtagInput.nativeElement.value = ''; // Limpiar el input después de añadir
  }

  removeSelectedHashtag(hashtagToRemove: string) {
    this.selectedHashtags = this.selectedHashtags.filter(hashtag => hashtag !== hashtagToRemove);
  }

  cargarPost(id: number): void {
    this.postService.getPostById(id).subscribe(
      (post) => {
        this.post = post;
        this.postForm.patchValue({
          titulo: post.titulo,
          texto: post.texto,
          // No establecer hashtags aquí, los manejaremos con selectedHashtags
        });
        // Inicializar selectedHashtags directamente desde el array de hashtags
        this.selectedHashtags = post.hashtags || [];
      },
      (error) => {
        console.error('Error al cargar el post:', error);
      }
    );
  }
  onFileChange(event: any): void {
    if (event.target.files && event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
    } else {
      this.selectedFile = null;
    }
  }

  guardarCambios(): void {
    if (this.postForm.valid && this.postId && this.post) {
      const formData = new FormData();
      formData.append('id', String(this.postId));
      formData.append('usuario', this.post.usuario);
      formData.append('titulo', this.postForm.value.titulo);
      formData.append('texto', this.postForm.value.texto);
      formData.append('hashtags', this.selectedHashtags.join(','));
      formData.append('fecha_creacion', this.post.fecha_creacion);

      if (this.selectedFile) {
        formData.append('imagen', this.selectedFile, this.selectedFile.name);
      } else if (this.post.imagen) {
        // Si no se selecciona un nuevo archivo, mantenemos la imagen existente (podrías no querer esto, dependiendo de tu lógica)
        formData.append('imagen_existente', this.post.imagen);
      }

      this.postService.actualizarPost(this.postId, formData).subscribe( // Cambiamos al nuevo método del servicio
        (response) => {
          console.log('Post actualizado con éxito:', response);
        },
        (error) => {
          console.error('Error al actualizar el post:', error);
        }
      );
    } else {
      console.log('Formulario inválido o falta información del post.');
    }
  }
}
