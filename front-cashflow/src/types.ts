export interface Movimentacao {
    id?: number;
    usuario_id?: number;
    valor: number;
    tipo: 'entrada' | 'saida';
    categoria: string;
    descricao?: string | null;
    data_movimentacao: string;
    criado_em?: string;
    atualizado_em?: string;
}

