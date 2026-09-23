import { useState, useEffect } from 'react';
import type { Movimentacao } from '../types';

export type { Movimentacao };

interface MovimentacaoModalProps {
    visivel: boolean;
    aoFechar: () => void;
    aoSalvarSucesso: (mensagem: string) => void;
    movimentacaoParaEditar?: Movimentacao | null;
}

const CATEGORIAS_ENTRADA = ['Salário', 'Vendas', 'Investimentos', 'Rendimento', 'Presente', 'Outros'];
const CATEGORIAS_SAIDA = ['Moradia', 'Alimentação', 'Transporte', 'Saúde', 'Educação', 'Lazer', 'Contas Fixas', 'Outros'];

export function MovimentacaoModal({
    visivel,
    aoFechar,
    aoSalvarSucesso,
    movimentacaoParaEditar
}: MovimentacaoModalProps) {
    const dataHoje = new Date().toISOString().split('T')[0];

    const [tipo, setTipo] = useState<'entrada' | 'saida'>('entrada');
    const [valor, setValor] = useState('');
    const [categoria, setCategoria] = useState('');
    const [categoriaPersonalizada, setCategoriaPersonalizada] = useState('');
    const [descricao, setDescricao] = useState('');
    const [dataMovimentacao, setDataMovimentacao] = useState(dataHoje);
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);

    // Quando o modal abre ou muda o item em edição
    useEffect(() => {
        if (movimentacaoParaEditar) {
            setTipo(movimentacaoParaEditar.tipo);
            setValor(String(movimentacaoParaEditar.valor));
            setDescricao(movimentacaoParaEditar.descricao || '');
            
            // Tratar formato da data (ex: '2026-09-22T00:00:00.000Z' para '2026-09-22')
            const dataLimpa = String(movimentacaoParaEditar.data_movimentacao).slice(0, 10);
            setDataMovimentacao(dataLimpa);

            const categoriasDisponiveis = movimentacaoParaEditar.tipo === 'entrada' ? CATEGORIAS_ENTRADA : CATEGORIAS_SAIDA;
            if (categoriasDisponiveis.includes(movimentacaoParaEditar.categoria)) {
                setCategoria(movimentacaoParaEditar.categoria);
                setCategoriaPersonalizada('');
            } else {
                setCategoria('Outros');
                setCategoriaPersonalizada(movimentacaoParaEditar.categoria);
            }
        } else {
            // Reset para nova movimentação
            setTipo('entrada');
            setValor('');
            setCategoria(CATEGORIAS_ENTRADA[0]);
            setCategoriaPersonalizada('');
            setDescricao('');
            setDataMovimentacao(dataHoje);
        }
        setErro(null);
    }, [movimentacaoParaEditar, visivel]);

    // Ajusta a categoria padrão ao alternar o tipo
    const lidarComMudancaTipo = (novoTipo: 'entrada' | 'saida') => {
        setTipo(novoTipo);
        const lista = novoTipo === 'entrada' ? CATEGORIAS_ENTRADA : CATEGORIAS_SAIDA;
        setCategoria(lista[0]);
        setCategoriaPersonalizada('');
    };

    if (!visivel) return null;

    const lidarComSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErro(null);

        const valorNumerico = parseFloat(valor.replace(',', '.'));
        if (isNaN(valorNumerico) || valorNumerico <= 0) {
            setErro('Por favor, informe um valor válido maior que zero.');
            return;
        }

        const categoriaFinal = categoria === 'Outros' && categoriaPersonalizada.trim()
            ? categoriaPersonalizada.trim()
            : categoria;

        if (!categoriaFinal) {
            setErro('Informe uma categoria.');
            return;
        }

        if (!dataMovimentacao) {
            setErro('Selecione uma data.');
            return;
        }

        const token = localStorage.getItem('kamikase_token');
        if (!token) {
            setErro('Sessão expirada. Faça login novamente.');
            return;
        }

        setCarregando(true);

        try {
            const payload = {
                valor: valorNumerico,
                tipo,
                categoria: categoriaFinal,
                descricao: descricao.trim() || null,
                data_movimentacao: dataMovimentacao
            };

            const isEdicao = !!movimentacaoParaEditar?.id;
            const url = isEdicao 
                ? `http://localhost:3000/api/movimentacoes/${movimentacaoParaEditar.id}`
                : 'http://localhost:3000/api/movimentacoes';
            
            const method = isEdicao ? 'PATCH' : 'POST';

            const resposta = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const dados = await resposta.json();

            if (resposta.ok) {
                const msgSucesso = isEdicao 
                    ? 'Movimentação atualizada com sucesso!' 
                    : 'Movimentação cadastrada com sucesso!';
                aoSalvarSucesso(msgSucesso);
                aoFechar();
            } else {
                setErro(dados.erro || 'Falha ao salvar a movimentação.');
            }
        } catch (error) {
            setErro('Erro de conexão com o servidor.');
        } finally {
            setCarregando(false);
        }
    };

    const categoriasAtuais = tipo === 'entrada' ? CATEGORIAS_ENTRADA : CATEGORIAS_SAIDA;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl max-w-lg w-full p-6 sm:p-8 transform transition-all">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                        {movimentacaoParaEditar ? '✏️ Editar Movimentação' : '➕ Nova Movimentação'}
                    </h3>
                    <button 
                        onClick={aoFechar} 
                        className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition"
                        title="Fechar"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {erro && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl mb-4 text-sm font-medium">
                        🔴 {erro}
                    </div>
                )}

                <form onSubmit={lidarComSubmit} className="space-y-4">
                    {/* SELEÇÃO DO TIPO: ENTRADA / SAÍDA */}
                    <div>
                        <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                            Tipo de Movimentação
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => lidarComMudancaTipo('entrada')}
                                className={`py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition border ${
                                    tipo === 'entrada'
                                        ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500 shadow-md shadow-emerald-950/40'
                                        : 'bg-slate-900/60 text-slate-400 border-slate-700 hover:border-slate-600 hover:text-slate-300'
                                }`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                </svg>
                                Entrada (Crédito)
                            </button>

                            <button
                                type="button"
                                onClick={() => lidarComMudancaTipo('saida')}
                                className={`py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition border ${
                                    tipo === 'saida'
                                        ? 'bg-red-600/20 text-red-400 border-red-500 shadow-md shadow-red-950/40'
                                        : 'bg-slate-900/60 text-slate-400 border-slate-700 hover:border-slate-600 hover:text-slate-300'
                                }`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                </svg>
                                Saída (Débito)
                            </button>
                        </div>
                    </div>

                    {/* VALOR E DATA */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2" htmlFor="valor">
                                Valor (R$) *
                            </label>
                            <input
                                id="valor"
                                type="number"
                                step="0.01"
                                min="0.01"
                                required
                                value={valor}
                                onChange={(e) => setValor(e.target.value)}
                                placeholder="0,00"
                                className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-semibold focus:outline-none focus:border-cyan-500 transition"
                            />
                        </div>

                        <div>
                            <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2" htmlFor="dataMovimentacao">
                                Data da Movimentação *
                            </label>
                            <input
                                id="dataMovimentacao"
                                type="date"
                                required
                                value={dataMovimentacao}
                                onChange={(e) => setDataMovimentacao(e.target.value)}
                                className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500 transition"
                            />
                        </div>
                    </div>

                    {/* CATEGORIA */}
                    <div>
                        <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2" htmlFor="categoria">
                            Categoria *
                        </label>
                        <select
                            id="categoria"
                            value={categoria}
                            onChange={(e) => setCategoria(e.target.value)}
                            className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500 transition"
                        >
                            {categoriasAtuais.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>

                        {categoria === 'Outros' && (
                            <input
                                type="text"
                                value={categoriaPersonalizada}
                                onChange={(e) => setCategoriaPersonalizada(e.target.value)}
                                placeholder="Especifique a categoria personalizada"
                                className="w-full mt-2 p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-500 transition"
                            />
                        )}
                    </div>

                    {/* DESCRIÇÃO */}
                    <div>
                        <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2" htmlFor="descricao">
                            Descrição (Opcional)
                        </label>
                        <input
                            id="descricao"
                            type="text"
                            value={descricao}
                            onChange={(e) => setDescricao(e.target.value)}
                            placeholder="Ex: Compra no supermercado, Freelance, etc."
                            maxLength={255}
                            className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500 transition"
                        />
                    </div>

                    {/* BOTÕES */}
                    <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-700/60">
                        <button
                            type="button"
                            onClick={aoFechar}
                            disabled={carregando}
                            className="px-5 py-2.5 rounded-xl font-semibold text-slate-300 hover:text-white bg-slate-700/50 hover:bg-slate-700 transition"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={carregando}
                            className={`px-6 py-2.5 rounded-xl font-bold text-white shadow-lg transition disabled:opacity-50 ${
                                tipo === 'entrada'
                                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/40'
                                    : 'bg-red-600 hover:bg-red-500 shadow-red-950/40'
                            }`}
                        >
                            {carregando 
                                ? 'Salvando...' 
                                : movimentacaoParaEditar ? 'Atualizar Movimentação' : 'Cadastrar Movimentação'
                            }
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

