import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { MovimentacaoModel } from '../models/movimentacaoModel';
import { IMovimentacao } from '../types';

export class MovimentacaoController {

  static async criar(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const usuarioId = req.usuarioId!; // Injetado pelo authMiddleware
      const { valor, tipo, categoria, descricao, data_movimentacao } = req.body;

      if (!valor || !tipo || !categoria || !data_movimentacao) {
        return res.status(400).json({ erro: 'Valor, tipo, categoria e data são obrigatórios.' });
      }

      const novaMovimentacao: IMovimentacao = {
        usuario_id: usuarioId,
        valor: Number(valor),
        tipo,
        categoria: categoria.trim(),
        descricao: descricao?.trim(),
        data_movimentacao
      };

      const id = await MovimentacaoModel.criar(novaMovimentacao);

      return res.status(201).json({ mensagem: 'Movimentação registrada', id });
    } catch (error) {
      console.error('[MovimentacaoController.criar]', error);
      return res.status(500).json({ erro: 'Erro ao criar movimentação.' });
    }
  }

  static async buscarPorId(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const id = parseInt(req.params.id as string, 10);
      const usuarioId = req.usuarioId!;

      if (isNaN(id)) return res.status(400).json({ erro: 'ID inválido.' });

      const movimentacao = await MovimentacaoModel.buscarPorId(id, usuarioId);

      if (!movimentacao) return res.status(404).json({ erro: 'Movimentação não encontrada.' });

      return res.status(200).json(movimentacao);
    } catch (error) {
      console.error('[MovimentacaoController.buscarPorId]', error);
      return res.status(500).json({ erro: 'Erro interno.' });
    }
  }

  // Resolve todos os seus requisitos de listagem e somatório em um único método flexível
  static async listar(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const usuarioId = req.usuarioId!;
      // Extrai os filtros da URL (ex: /movimentacoes?tipo=entrada&categoria=lazer)
      const { tipo, categoria, data, dataInicial, dataFinal } = req.query;

      const resultado = await MovimentacaoModel.listarComFiltros(usuarioId, {
        tipo: tipo as string,
        categoria: categoria as string,
        data: data as string,
        dataInicial: dataInicial as string,
        dataFinal: dataFinal as string
      });

      return res.status(200).json({
        total_registros: resultado.movimentacoes.length,
        somatorio: resultado.somatorio,
        dados: resultado.movimentacoes
      });
    } catch (error) {
      console.error('[MovimentacaoController.listar]', error);
      return res.status(500).json({ erro: 'Erro ao listar movimentações.' });
    }
  }

  static async atualizar(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const id = parseInt(req.params.id as string, 10);
      const usuarioId = req.usuarioId!;
      const dados = req.body;

      if (isNaN(id)) return res.status(400).json({ erro: 'ID inválido.' });
      if (Object.keys(dados).length === 0) return res.status(400).json({ erro: 'Nenhum dado enviado para atualização.' });

      const atualizado = await MovimentacaoModel.atualizar(id, usuarioId, dados);

      if (!atualizado) return res.status(404).json({ erro: 'Movimentação não encontrada ou sem alterações.' });

      return res.status(200).json({ mensagem: 'Movimentação atualizada com sucesso.' });
    } catch (error) {
      console.error('[MovimentacaoController.atualizar]', error);
      return res.status(500).json({ erro: 'Erro ao atualizar.' });
    }
  }

  static async deletar(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const id = parseInt(req.params.id as string, 10);
      const usuarioId = req.usuarioId!;

      if (isNaN(id)) return res.status(400).json({ erro: 'ID inválido.' });

      const deletado = await MovimentacaoModel.deletarSeguro(id, usuarioId);

      if (!deletado) return res.status(404).json({ erro: 'Movimentação não encontrada.' });

      return res.status(200).json({ mensagem: 'Movimentação excluída.' });
    } catch (error) {
      console.error('[MovimentacaoController.deletar]', error);
      return res.status(500).json({ erro: 'Erro ao deletar.' });
    }
  }
}