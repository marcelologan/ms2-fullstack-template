import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { IMovimentacao } from '../types';
import {db} from '../config/database';

export class MovimentacaoModel {
  
  static async criar(movimentacao: IMovimentacao): Promise<number> {
    const queryStr = `
      INSERT INTO movimentacoes (usuario_id, valor, tipo, categoria, descricao, data_movimentacao)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const valores = [
      movimentacao.usuario_id,
      movimentacao.valor,
      movimentacao.tipo,
      movimentacao.categoria,
      movimentacao.descricao || null,
      movimentacao.data_movimentacao
    ];
    
    const [result] = await db.execute<ResultSetHeader>({
      sql: queryStr,
      values: valores
    });
    
    return result.insertId;
  }

  static async buscarPorUsuario(usuarioId: number): Promise<IMovimentacao[]> {
    // Buscamos ordenando da mais recente para a mais antiga (padrão de extrato)
    const queryStr = `
      SELECT * FROM movimentacoes 
      WHERE usuario_id = ? 
      ORDER BY data_movimentacao DESC, id DESC
    `;
    
    const [linhas] = await db.execute<RowDataPacket[]>({
      sql: queryStr,
      values: [usuarioId]
    });
    
    return linhas as IMovimentacao[];
  }

  static async deletarSeguro(id: number, usuarioId: number): Promise<boolean> {
    // A deleção exige o usuarioId para garantir que um usuário 
    // não consiga deletar a movimentação de outro via API
    const queryStr = `DELETE FROM movimentacoes WHERE id = ? AND usuario_id = ?`;
    
    const [result] = await db.execute<ResultSetHeader>({
      sql: queryStr,
      values: [id, usuarioId]
    });
    
    return result.affectedRows > 0;
  }

  // Busca uma movimentação específica garantindo que pertence ao usuário logado (IDOR protection)
  static async buscarPorId(id: number, usuarioId: number): Promise<IMovimentacao | null> {
    const queryStr = `SELECT * FROM movimentacoes WHERE id = ? AND usuario_id = ? LIMIT 1`;
    const [linhas] = await db.execute<RowDataPacket[]>({ sql: queryStr, values: [id, usuarioId] });
    return linhas.length ? (linhas[0] as IMovimentacao) : null;
  }

  // Atualiza garantindo a posse do registro
  static async atualizar(id: number, usuarioId: number, dados: Partial<IMovimentacao>): Promise<boolean> {
    // Montagem dinâmica do UPDATE para atualizar apenas os campos enviados
    const campos: string[] = [];
    const valores: any[] = [];

    if (dados.valor !== undefined) { campos.push('valor = ?'); valores.push(dados.valor); }
    if (dados.tipo !== undefined) { campos.push('tipo = ?'); valores.push(dados.tipo); }
    if (dados.categoria !== undefined) { campos.push('categoria = ?'); valores.push(dados.categoria); }
    if (dados.descricao !== undefined) { campos.push('descricao = ?'); valores.push(dados.descricao); }
    if (dados.data_movimentacao !== undefined) { campos.push('data_movimentacao = ?'); valores.push(dados.data_movimentacao); }

    if (campos.length === 0) return false;

    const queryStr = `UPDATE movimentacoes SET ${campos.join(', ')} WHERE id = ? AND usuario_id = ?`;
    valores.push(id, usuarioId);

    const [result] = await db.execute<ResultSetHeader>({ sql: queryStr, values: valores });
    return result.affectedRows > 0;
  }

  // Master Query: Lida com Tipo, Categoria, Data exata e Período
  static async listarComFiltros(usuarioId: number, filtros: any): Promise<{ movimentacoes: IMovimentacao[], somatorio: number }> {
    let queryStr = `SELECT * FROM movimentacoes WHERE usuario_id = ?`;
    const valores: any[] = [usuarioId];

    if (filtros.tipo) {
      queryStr += ` AND tipo = ?`;
      valores.push(filtros.tipo);
    }
    if (filtros.categoria) {
      queryStr += ` AND categoria = ?`;
      valores.push(filtros.categoria);
    }
    if (filtros.data) {
      queryStr += ` AND data_movimentacao = ?`;
      valores.push(filtros.data);
    }
    if (filtros.dataInicial && filtros.dataFinal) {
      queryStr += ` AND data_movimentacao BETWEEN ? AND ?`;
      valores.push(filtros.dataInicial, filtros.dataFinal);
    }

    queryStr += ` ORDER BY data_movimentacao DESC, id DESC`;

    const [linhas] = await db.execute<RowDataPacket[]>({ sql: queryStr, values: valores });
    const movimentacoes = linhas as IMovimentacao[];

    // Como já trouxemos os dados para a memória (Node.js), o somatório via reduce é O(N) e 
    // poupa uma segunda query pesada (SUM) no MySQL.
    const somatorio = movimentacoes.reduce((acc, mov) => acc + Number(mov.valor), 0);

    return { movimentacoes, somatorio };
  }
}