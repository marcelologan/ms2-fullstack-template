import { useNavigate } from 'react-router-dom';

export function Header() {
    const navegar = useNavigate();
    const token = localStorage.getItem('kamikase_token');
    const usuarioNome = localStorage.getItem('kamikase_usuario') || 'Usuário';

    const lidarComLogout = () => {
        localStorage.removeItem('kamikase_token');
        localStorage.removeItem('kamikase_usuario');
        navegar('/');
    };

    return (
        <header className="bg-slate-800 border-b border-slate-700 p-4 sm:p-6 shadow-md">
            <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center space-x-3 cursor-pointer" onClick={() => token && navegar('/dashboard')}>
                    <div className="w-10 h-10 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-black text-xl">
                        $
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-cyan-400">
                            MS² Cashflow
                        </h1>
                        <p className="text-slate-400 text-xs">Controle de Finanças Pessoais</p>
                    </div>
                </div>
                
                {token && (
                    <nav className="flex items-center space-x-4">
                        <span className="text-slate-300 text-sm hidden md:inline">
                            Olá, <strong className="text-cyan-300">{usuarioNome}</strong>
                        </span>
                        <button 
                            onClick={() => navegar('/dashboard')}
                            className="text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-700 text-sm font-medium transition"
                        >
                            Dashboard
                        </button>
                        <button 
                            onClick={lidarComLogout}
                            className="bg-red-600/80 hover:bg-red-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold transition flex items-center gap-1.5 shadow-sm hover:shadow"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Sair
                        </button>
                    </nav>
                )}
            </div>
        </header>
    );
}