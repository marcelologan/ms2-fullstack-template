import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { IUsuario } from '../types';
import {db} from '../config/database'; 

export class UsuarioModel {
  
  static async criar(usuario: IUsuario): Promise<number> {
    const queryStr = `
      INSERT INTO usuarios (email, nome, telefone, senha)
      VALUES (?, ?, ?, ?)
    `;
    const valores = [usuario.email, usuario.nome, usuario.telefone, usuario.senha];
    
    // Tipamos o retorno como ResultSetHeader e passamos o objeto QueryOptions
    const [result] = await db.execute<ResultSetHeader>({
      sql: queryStr,
      values: valores
    });
    
    return result.insertId;
  }

  static async buscarPorEmail(email: string): Promise<IUsuario | null> {
    const queryStr = `SELECT * FROM usuarios WHERE email = ? LIMIT 1`;
    
    // Tipamos o retorno como RowDataPacket[]
    const [linhas] = await db.execute<RowDataPacket[]>({
      sql: queryStr,
      values: [email]
    });
    
    return linhas.length ? (linhas[0] as IUsuario) : null;
  }

  static async buscarPorId(id: number): Promise<IUsuario | null> {
    const queryStr = `SELECT * FROM usuarios WHERE id = ? LIMIT 1`;
    
    const [linhas] = await db.execute<RowDataPacket[]>({
      sql: queryStr,
      values: [id]
    });
    
    return linhas.length ? (linhas[0] as IUsuario) : null;
  }

  static async buscarTodos(): Promise<Omit<IUsuario, 'senha'>[]> {
    // Nunca trafegar a senha em buscas massivas
    const queryStr = `SELECT id, email, nome, telefone, criado_em, atualizado_em FROM usuarios`;
    
    const [linhas] = await db.execute<RowDataPacket[]>({
      sql: queryStr
    });
    
    return linhas as Omit<IUsuario, 'senha'>[];
  }
}