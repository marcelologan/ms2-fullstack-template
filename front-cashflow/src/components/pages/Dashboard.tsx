import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MovimentacaoModal } from '../MovimentacaoModal';
import type { Movimentacao } from '../../types';
import { ConfirmacaoModal } from '../ConfirmacaoModal';
import { FeedbackModal } from '../FeedbackModal';

export function Dashboard() {
    const navegar = useNavigate();

    // Estados de dados
    const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);

    // Filtro da tabela: 'todas' | 'entrada' | 'saida'
    const [filtroTipo, setFiltroTipo] = useState<'todas' | 'entrada' | 'saida'>('todas');

    // Estados dos Modais
    const [modalFormAberto, setModalFormAberto] = useState(false);
    const [itemEmEdicao, setItemEmEdicao] = useState<Movimentacao | null>(null);

    const [modalExcluirAberto, setModalExcluirAberto] = useState(false);
    const [itemParaExcluir, setItemParaExcluir] = useState<Movimentacao | null>(null);
    const [excluindo, setExcluindo] = useState(false);

    const [feedbackModal, setFeedbackModal] = useState<{
        visivel: boolean;
        tipo: 'sucesso' | 'erro';
        titulo: string;
        mensagem: string;
    }>({
        visivel: false,
        tipo: 'sucesso',
        titulo: '',
        mensagem: ''
    });

    // Função de busca das movimentações da API
    const carregarMovimentacoes = async () => {
        const token = localStorage.getItem('kamikase_token');
        if (!token) {
            navegar('/');
            return;
        }

        setCarregando(true);
        setErro(null);

        try {
            const resposta = await fetch('http://localhost:3000/api/movimentacoes', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (resposta.status === 401) {
                // Token expirado ou inválido
                localStorage.removeItem('kamikase_token');
                localStorage.removeItem('kamikase_usuario');
                navegar('/');
                return;
            }

            const dados = await resposta.json();

            if (resposta.ok) {
                // A API devolve { total_registros, somatorio, dados: [...] }
                setMovimentacoes(dados.dados || []);
            } else {
                setErro(dados.erro || 'Falha ao buscar movimentações.');
            }
        } catch (err) {
            setErro('Não foi possível conectar ao servidor. Verifique se o back-end está ativo.');
        } finally {
            setCarregando(false);
        }
    };

    useEffect(() => {
        carregarMovimentacoes();
    }, []);

    // Formatação de Moeda
    const formatarMoeda = (valor: number) => {
        return Number(valor).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
    };

    // Formatação de Data
    const formatarData = (dataStr: string) => {
        if (!dataStr) return '-';
        const partes = String(dataStr).slice(0, 10).split('-');
        if (partes.length === 3) {
            const [ano, mes, dia] = partes;
            return `${dia}/${mes}/${ano}`;
        }
        return dataStr;
    };

    // Cálculos dos Cards do Mês Corrente
    const agora = new Date();
    const anoAtual = agora.getFullYear();
    const mesAtual = agora.getMonth() + 1; // 1 a 12

    const totaisMesCorrente = useMemo(() => {
        let totalEntradas = 0;
        let totalSaidas = 0;

        movimentacoes.forEach((mov) => {
            const partes = String(mov.data_movimentacao).slice(0, 10).split('-');
            if (partes.length === 3) {
                const anoMov = Number(partes[0]);
                const mesMov = Number(partes[1]);

                if (anoMov === anoAtual && mesMov === mesAtual) {
                    const valorNum = Number(mov.valor);
                    if (mov.tipo === 'entrada') {
                        totalEntradas += valorNum;
                    } else if (mov.tipo === 'saida') {
                        totalSaidas += valorNum;
                    }
                }
            }
        });

        const saldoMes = totalEntradas - totalSaidas;

        return {
            totalEntradas,
            totalSaidas,
            saldoMes
        };
    }, [movimentacoes, anoAtual, mesAtual]);

    // Nome do mês atual por extenso
    const nomeMesCorrente = useMemo(() => {
        const formatador = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' });
        const texto = formatador.format(agora);
        return texto.charAt(0).toUpperCase() + texto.slice(1);
    }, [agora]);

    // Filtragem das movimentações para a tabela
    const movimentacoesFiltradas = useMemo(() => {
        if (filtroTipo === 'todas') return movimentacoes;
        return movimentacoes.filter((mov) => mov.tipo === filtroTipo);
    }, [movimentacoes, filtroTipo]);

    // Ações de Criação e Edição
    const abrirModalCriacao = () => {
        setItemEmEdicao(null);
        setModalFormAberto(true);
    };

    const abrirModalEdicao = (mov: Movimentacao) => {
        setItemEmEdicao(mov);
        setModalFormAberto(true);
    };

    const lidarComSucessoForm = (mensagem: string) => {
        setFeedbackModal({
            visivel: true,
            tipo: 'sucesso',
            titulo: 'Operação Realizada!',
            mensagem
        });
        carregarMovimentacoes();
    };

    // Ação de Exclusão
    const abrirModalExclusao = (mov: Movimentacao) => {
        setItemParaExcluir(mov);
        setModalExcluirAberto(true);
    };

    const confirmarExclusao = async () => {
        if (!itemParaExcluir?.id) return;

        const token = localStorage.getItem('kamikase_token');
        if (!token) return;

        setExcluindo(true);

        try {
            const resposta = await fetch(`http://localhost:3000/api/movimentacoes/${itemParaExcluir.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const dados = await resposta.json();

            if (resposta.ok) {
                setModalExcluirAberto(false);
                setItemParaExcluir(null);
                setFeedbackModal({
                    visivel: true,
                    tipo: 'sucesso',
                    titulo: 'Excluído com Sucesso!',
                    mensagem: 'A movimentação foi removida permanentemente do sistema.'
                });
                carregarMovimentacoes();
            } else {
                setFeedbackModal({
                    visivel: true,
                    tipo: 'erro',
                    titulo: 'Erro ao Excluir',
                    mensagem: dados.erro || 'Não foi possível excluir o item.'
                });
            }
        } catch (err) {
            setFeedbackModal({
                visivel: true,
                tipo: 'erro',
                titulo: 'Erro de Conexão',
                mensagem: 'Não foi possível conectar ao servidor para apagar a movimentação.'
            });
        } finally {
            setExcluindo(false);
        }
    };

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* CABEÇALHO DO PAINEL */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                        Painel de Movimentações
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">
                        Acompanhe seu fluxo de caixa e mantenha suas finanças organizadas.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse"></span>
                        Mês Ativo: {nomeMesCorrente}
                    </span>
                </div>
            </div>

            {/* CARDS NO TOPO: ENTRADAS, SAÍDAS E SALDO DO MÊS CORRENTE */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* CARD ENTRADAS */}
                <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-emerald-500/50 transition">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                Entradas do Mês
                            </span>
                            <h3 className="text-2xl sm:text-3xl font-black text-emerald-400">
                                {formatarMoeda(totaisMesCorrente.totalEntradas)}
                            </h3>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner group-hover:scale-110 transition">
                            {/* ÍCONE SETA PARA CIMA VERDE */}
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                            </svg>
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center text-xs text-slate-400">
                        <span className="text-emerald-400 font-semibold mr-1.5">↑ Créditos</span> no período de {nomeMesCorrente}
                    </div>
                </div>

                {/* CARD SAÍDAS */}
                <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-red-500/50 transition">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                Saídas do Mês
                            </span>
                            <h3 className="text-2xl sm:text-3xl font-black text-red-400">
                                {formatarMoeda(totaisMesCorrente.totalSaidas)}
                            </h3>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shadow-inner group-hover:scale-110 transition">
                            {/* ÍCONE SETA PARA BAIXO VERMELHA */}
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                            </svg>
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center text-xs text-slate-400">
                        <span className="text-red-400 font-semibold mr-1.5">↓ Débitos</span> no período de {nomeMesCorrente}
                    </div>
                </div>

                {/* CARD SALDO LÍQUIDO */}
                <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-cyan-500/50 transition">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                Saldo do Mês
                            </span>
                            <h3 className={`text-2xl sm:text-3xl font-black ${
                                totaisMesCorrente.saldoMes >= 0 ? 'text-cyan-400' : 'text-amber-400'
                            }`}>
                                {formatarMoeda(totaisMesCorrente.saldoMes)}
                            </h3>
                        </div>
                        <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shadow-inner group-hover:scale-110 transition ${
                            totaisMesCorrente.saldoMes >= 0
                                ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400'
                                : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                        }`}>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center text-xs text-slate-400">
                        Resultado financeiro em {nomeMesCorrente}
                    </div>
                </div>
            </div>

            {/* SEÇÃO DA TABELA: FILTRO + BOTÃO DE ADICIONAR */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-700/70">
                    <div>
                        <h3 className="text-xl font-bold text-white">Extrato de Movimentações</h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                            {movimentacoesFiltradas.length} {movimentacoesFiltradas.length === 1 ? 'registro encontrado' : 'registros encontrados'}
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        {/* SELECT DE FILTRO */}
                        <div className="flex items-center gap-2">
                            <label htmlFor="filtro-tipo" className="text-xs font-semibold text-slate-400 hidden sm:inline">
                                Filtrar:
                            </label>
                            <select
                                id="filtro-tipo"
                                value={filtroTipo}
                                onChange={(e) => setFiltroTipo(e.target.value as 'todas' | 'entrada' | 'saida')}
                                className="bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-cyan-500 transition cursor-pointer"
                            >
                                <option value="todas">🔄 Todas as Movimentações</option>
                                <option value="entrada">🟢 Apenas Entradas</option>
                                <option value="saida">🔴 Apenas Saídas</option>
                            </select>
                        </div>

                        {/* BOTÃO ADICIONAR MOVIMENTAÇÃO */}
                        <button
                            onClick={abrirModalCriacao}
                            className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition shadow-lg shadow-cyan-900/30 flex items-center justify-center gap-2 cursor-pointer hover:shadow-cyan-800/40"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                            </svg>
                            Nova Movimentação
                        </button>
                    </div>
                </div>

                {/* MENSAGEM DE ERRO (CASO HAJA) */}
                {erro && (
                    <div className="bg-red-500/10 border border-red-500/40 text-red-400 p-4 rounded-xl mb-6 text-sm flex items-center justify-between">
                        <span>🔴 {erro}</span>
                        <button 
                            onClick={carregarMovimentacoes} 
                            className="text-xs underline hover:text-red-300 font-semibold ml-4"
                        >
                            Tentar novamente
                        </button>
                    </div>
                )}

                {/* TABELA DE MOVIMENTAÇÕES */}
                {carregando ? (
                    <div className="py-16 text-center text-slate-400">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-cyan-500 border-t-transparent mb-3"></div>
                        <p className="text-sm">Carregando movimentações financeiras...</p>
                    </div>
                ) : movimentacoesFiltradas.length === 0 ? (
                    <div className="py-16 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-700/40 flex items-center justify-center text-slate-400">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <h4 className="text-lg font-bold text-white mb-1">Nenhuma movimentação encontrada</h4>
                        <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
                            {filtroTipo !== 'todas'
                                ? `Não há registros do tipo "${filtroTipo}". Tente mudar o filtro ou cadastrar um novo registro.`
                                : 'Você ainda não registrou nenhuma receita ou despesa. Comece adicionando sua primeira movimentação!'}
                        </p>
                        <button
                            onClick={abrirModalCriacao}
                            className="inline-flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-4 py-2 rounded-xl text-sm transition shadow-md shadow-cyan-900/30"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                            </svg>
                            Adicionar Agora
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-700 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    <th className="py-3 px-4">Tipo</th>
                                    <th className="py-3 px-4">Descrição</th>
                                    <th className="py-3 px-4">Categoria</th>
                                    <th className="py-3 px-4">Data</th>
                                    <th className="py-3 px-4 text-right">Valor</th>
                                    <th className="py-3 px-4 text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/60 text-sm">
                                {movimentacoesFiltradas.map((mov) => {
                                    const isEntrada = mov.tipo === 'entrada';

                                    return (
                                        <tr 
                                            key={mov.id} 
                                            className="hover:bg-slate-700/40 transition group"
                                        >
                                            {/* COLUNA TIPO COM ELEMENTO GRÁFICO (SETA VERDE/VERMELHA) */}
                                            <td className="py-4 px-4 whitespace-nowrap">
                                                {isEntrada ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-xs">
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                                        </svg>
                                                        Entrada
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/15 text-red-400 border border-red-500/30 shadow-xs">
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                                        </svg>
                                                        Saída
                                                    </span>
                                                )}
                                            </td>

                                            {/* COLUNA DESCRIÇÃO */}
                                            <td className="py-4 px-4 font-medium text-white max-w-xs truncate">
                                                {mov.descricao || <span className="text-slate-500 italic">Sem descrição</span>}
                                            </td>

                                            {/* COLUNA CATEGORIA */}
                                            <td className="py-4 px-4 whitespace-nowrap">
                                                <span className="px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-700 text-slate-300 text-xs font-medium">
                                                    {mov.categoria}
                                                </span>
                                            </td>

                                            {/* COLUNA DATA */}
                                            <td className="py-4 px-4 text-slate-300 whitespace-nowrap">
                                                {formatarData(mov.data_movimentacao)}
                                            </td>

                                            {/* COLUNA VALOR COM COR CORRESPONDENTE */}
                                            <td className="py-4 px-4 text-right whitespace-nowrap">
                                                <span className={`font-bold ${isEntrada ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {isEntrada ? '+ ' : '- '}
                                                    {formatarMoeda(Number(mov.valor))}
                                                </span>
                                            </td>

                                            {/* COLUNA AÇÕES: EDITAR E APAGAR */}
                                            <td className="py-4 px-4 text-center whitespace-nowrap">
                                                <div className="inline-flex items-center space-x-2">
                                                    <button
                                                        onClick={() => abrirModalEdicao(mov)}
                                                        className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 transition"
                                                        title="Editar movimentação"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => abrirModalExclusao(mov)}
                                                        className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-red-600/30 text-slate-300 hover:text-red-400 transition"
                                                        title="Apagar movimentação"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* MODAL DE FORMULÁRIO (CADASTRAR / EDITAR) */}
            <MovimentacaoModal
                visivel={modalFormAberto}
                aoFechar={() => {
                    setModalFormAberto(false);
                    setItemEmEdicao(null);
                }}
                aoSalvarSucesso={lidarComSucessoForm}
                movimentacaoParaEditar={itemEmEdicao}
            />

            {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
            <ConfirmacaoModal
                visivel={modalExcluirAberto}
                detalhe={
                    itemParaExcluir
                        ? `${itemParaExcluir.tipo === 'entrada' ? '🟢 Entrada' : '🔴 Saída'} de ${formatarMoeda(
                              Number(itemParaExcluir.valor)
                          )} - ${itemParaExcluir.descricao || itemParaExcluir.categoria}`
                        : undefined
                }
                aoConfirmar={confirmarExclusao}
                aoCancelar={() => {
                    setModalExcluirAberto(false);
                    setItemParaExcluir(null);
                }}
                carregando={excluindo}
            />

            {/* MODAL DE FEEDBACK (SUCESSO / ERRO) */}
            <FeedbackModal
                visivel={feedbackModal.visivel}
                tipo={feedbackModal.tipo}
                titulo={feedbackModal.titulo}
                mensagem={feedbackModal.mensagem}
                aoFechar={() => setFeedbackModal((prev) => ({ ...prev, visivel: false }))}
            />
        </div>
    );
}