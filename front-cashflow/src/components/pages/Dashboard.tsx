import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Usuario } from '../../types';
import { FeedbackModal } from '../FeedbackModal';

export function Dashboard() {
    const navegar = useNavigate();

    // Estados de dados
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);
    const [busca, setBusca] = useState('');

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

    const usuarioLogadoNome = localStorage.getItem('kamikase_usuario') || 'Usuário';
    const usuarioLogadoEmail = localStorage.getItem('kamikase_email') || 'Não informado';

    // Função para carregar os usuários autenticados da API
    const carregarUsuarios = async () => {
        const token = localStorage.getItem('kamikase_token');
        if (!token) {
            navegar('/login');
            return;
        }

        setCarregando(true);
        setErro(null);

        try {
            const resposta = await fetch('http://localhost:3000/api/usuarios', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (resposta.status === 401) {
                // Token expirado ou inválido
                localStorage.removeItem('kamikase_token');
                localStorage.removeItem('kamikase_usuario');
                localStorage.removeItem('kamikase_email');
                localStorage.removeItem('kamikase_usuario_id');
                navegar('/login');
                return;
            }

            const dados = await resposta.json();

            if (resposta.ok) {
                setUsuarios(Array.isArray(dados) ? dados : []);
            } else {
                setErro(dados.erro || 'Falha ao buscar usuários do sistema.');
            }
        } catch (err) {
            setErro('Não foi possível conectar ao servidor. Verifique se o back-end está ativo.');
        } finally {
            setCarregando(false);
        }
    };

    useEffect(() => {
        carregarUsuarios();
    }, []);

    // Formatação de Data
    const formatarData = (dataStr?: string) => {
        if (!dataStr) return '-';
        const data = new Date(dataStr);
        if (isNaN(data.getTime())) return dataStr;
        return data.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Formatação de telefone
    const formatarTelefone = (tel?: string | null) => {
        if (!tel) return '-';
        const num = tel.replace(/\D/g, '');
        if (num.length === 11) {
            return `(${num.slice(0, 2)}) ${num.slice(2, 7)}-${num.slice(7)}`;
        }
        if (num.length === 10) {
            return `(${num.slice(0, 2)}) ${num.slice(2, 6)}-${num.slice(6)}`;
        }
        return tel;
    };

    // Filtro de usuários
    const usuariosFiltrados = useMemo(() => {
        if (!busca.trim()) return usuarios;
        const termo = busca.toLowerCase();
        return usuarios.filter(
            (u) =>
                (u.nome && u.nome.toLowerCase().includes(termo)) ||
                (u.email && u.email.toLowerCase().includes(termo)) ||
                (u.telefone && u.telefone.includes(termo))
        );
    }, [usuarios, busca]);

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* CABEÇALHO DO PAINEL */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                        Painel de Usuários
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">
                        Área autenticada com listagem de usuários e status da sessão.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse"></span>
                        Sessão Ativa (JWT)
                    </span>
                </div>
            </div>

            {/* CARDS NO TOPO: USUÁRIO LOGADO, TOTAL USUÁRIOS E STATUS DO TEMPLATE */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* CARD PERFIL */}
                <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-cyan-500/50 transition">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Usuário Logado</span>
                            <h3 className="text-xl font-bold text-white mt-1 truncate max-w-[200px]" title={usuarioLogadoNome}>
                                {usuarioLogadoNome}
                            </h3>
                            <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[200px]" title={usuarioLogadoEmail}>
                                {usuarioLogadoEmail}
                            </p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* CARD TOTAL USUÁRIOS */}
                <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-indigo-500/50 transition">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total de Usuários</span>
                            <h3 className="text-2xl font-black text-white mt-1">
                                {carregando ? '...' : usuarios.length}
                            </h3>
                            <p className="text-xs text-slate-400 mt-0.5">Cadastrados no MySQL</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* CARD STATUS DO TEMPLATE */}
                <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-emerald-500/50 transition">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Status do Template</span>
                            <h3 className="text-lg font-bold text-emerald-400 mt-1">
                                Pronto para Uso
                            </h3>
                            <p className="text-xs text-slate-400 mt-0.5">Rotas protegidas ativas</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* BARRA DE CONTROLE: BUSCA E RECARREGAR */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                        <h3 className="text-xl font-bold text-white">Usuários Cadastrados</h3>
                        <p className="text-xs text-slate-400">
                            {usuariosFiltrados.length} {usuariosFiltrados.length === 1 ? 'usuário encontrado' : 'usuários encontrados'}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative flex-1 sm:w-64">
                            <input
                                type="text"
                                value={busca}
                                onChange={(e) => setBusca(e.target.value)}
                                placeholder="Buscar por nome ou e-mail..."
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                            />
                            {busca && (
                                <button
                                    onClick={() => setBusca('')}
                                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white text-xs"
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        <button
                            onClick={carregarUsuarios}
                            disabled={carregando}
                            className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-2 active:scale-95 disabled:opacity-50"
                        >
                            <svg className={`w-4 h-4 ${carregando ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Atualizar
                        </button>
                    </div>
                </div>

                {erro && (
                    <div className="bg-red-500/10 border border-red-500/40 text-red-400 p-4 rounded-xl text-sm font-medium flex items-center gap-3">
                        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span>{erro}</span>
                    </div>
                )}

                {/* TABELA DE USUÁRIOS */}
                {carregando ? (
                    <div className="py-12 text-center text-slate-400 space-y-3">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-cyan-500/30 border-t-cyan-400"></div>
                        <p className="text-sm">Carregando lista de usuários...</p>
                    </div>
                ) : usuariosFiltrados.length === 0 ? (
                    <div className="py-12 text-center border-2 border-dashed border-slate-700 rounded-xl bg-slate-900/40">
                        <div className="mx-auto w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 mb-3">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <h4 className="text-lg font-bold text-white mb-1">Nenhum usuário encontrado</h4>
                        <p className="text-slate-400 text-sm max-w-sm mx-auto">
                            {busca ? 'Nenhum usuário corresponde ao filtro pesquisado.' : 'Nenhum usuário cadastrado no momento.'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-700/60">
                        <table className="w-full text-left text-sm text-slate-300">
                            <thead className="bg-slate-900/90 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-700">
                                <tr>
                                    <th className="py-3 px-4">ID</th>
                                    <th className="py-3 px-4">Nome</th>
                                    <th className="py-3 px-4">E-mail</th>
                                    <th className="py-3 px-4">Telefone</th>
                                    <th className="py-3 px-4">Cadastrado em</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {usuariosFiltrados.map((u) => (
                                    <tr key={u.id} className="hover:bg-slate-700/30 transition">
                                        <td className="py-3 px-4 font-mono text-cyan-400 font-semibold">
                                            #{u.id}
                                        </td>
                                        <td className="py-3 px-4 font-medium text-white">
                                            {u.nome || <span className="text-slate-500 italic">Não informado</span>}
                                        </td>
                                        <td className="py-3 px-4 font-mono text-xs text-slate-300">
                                            {u.email}
                                        </td>
                                        <td className="py-3 px-4 text-xs">
                                            {formatarTelefone(u.telefone)}
                                        </td>
                                        <td className="py-3 px-4 text-xs text-slate-400">
                                            {formatarData(u.criado_em)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* SEÇÃO DIDÁTICA: COMO EXTENDER ESTE TEMPLATE */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold text-sm">
                        💡
                    </div>
                    <div>
                        <h4 className="text-base font-bold text-white">Guia de Extensão do Template</h4>
                        <p className="text-xs text-slate-400">Como adicionar novas entidades a este projeto monorepo</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
                    <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
                        <span className="font-bold text-cyan-400 block text-sm">1. Banco & Model</span>
                        <p>
                            Crie a nova tabela no MySQL com chave estrangeira <code className="text-cyan-300">usuario_id</code> se pertencer a usuários. Crie o respectivo Model em <code className="text-cyan-300">api-cashflow/src/models/</code>.
                        </p>
                    </div>

                    <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
                        <span className="font-bold text-cyan-400 block text-sm">2. Controller & Rotas</span>
                        <p>
                            Crie os métodos no Controller e registre as rotas protegidas usando o <code className="text-cyan-300">authMiddleware</code> em <code className="text-cyan-300">api-cashflow/src/routes/</code>.
                        </p>
                    </div>

                    <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
                        <span className="font-bold text-cyan-400 block text-sm">3. Front-end React</span>
                        <p>
                            Adicione novos componentes e páginas em <code className="text-cyan-300">front-cashflow/src/components/pages/</code>, conectando-os às rotas em <code className="text-cyan-300">App.tsx</code>.
                        </p>
                    </div>
                </div>
            </div>

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