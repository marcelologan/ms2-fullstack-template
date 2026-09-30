export interface IUsuario {
  id?: number;
  email: string;
  nome?: string | null;
  telefone?: string | null;
  senha: string;
  criado_em?: Date;
  atualizado_em?: Date;
}