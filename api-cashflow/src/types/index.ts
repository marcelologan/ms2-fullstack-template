export interface IUsuario {
  id?: number;
  email: string;
  nome?: string | null;
  telefone?: string | null;
  senha: string;
  criado_em?: Date;
  atualizado_em?: Date;
}

// Mantenha a IUsuario que já existe e adicione:

export interface IMovimentacao {
  id?: number;
  usuario_id: number; // Chave estrangeira
  valor: number;
  tipo: 'entrada' | 'saida'; // Tipo estrito (Union Type)
  categoria: string;
  descricao?: string | null;
  data_movimentacao: string | Date; // string para facilitar o input 'YYYY-MM-DD'
  criado_em?: Date;
  atualizado_em?: Date;
}