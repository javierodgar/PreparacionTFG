export interface Eventos {
    id: number;
    titulo: string;
    descripcion?: string;
    categoria: string;
    imagen_portada?: string;
    direccion: string;
    fecha_creacion?: string; // O Date si prefieres manejarlo como objeto Date en Angular
    fecha_inicio: string; // O Date si prefieres manejarlo como objeto Date en Angular
    fecha_fin: string;
    usuario_creador_id: number;
}
