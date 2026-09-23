import { useState } from 'react';
// 1. Importamos o Hook de navegação
import { useNavigate } from 'react-router-dom';

export function LoginForm() {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [erro, setErro] = useState<string | null>(null);
    const [carregando, setCarregando] = useState(false);
    
    // 2. Instanciamos o navegador programático
    const navegar = useNavigate();

    const lidarComSubmit = async (evento: React.FormEvent) => {
        evento.preventDefault(); 
        setErro(null);
        setCarregando(true);

        try {
            const resposta = await fetch('http://localhost:3000/api/usuarios/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha })
            });

            const dados = await resposta.json();

            if (resposta.ok) {
                // 3. O COFRE: Guardamos o Token JWT e o Nome do Usuário no navegador
                localStorage.setItem('kamikase_token', dados.token);
                localStorage.setItem('kamikase_usuario', dados.usuario?.nome || dados.nome || 'Usuário');
                
                // 4. O REDIRECIONAMENTO: Mandamos o usuário para o painel imediatamente!
                navegar('/dashboard');
                
            } else {
                setErro(dados.erro || "Falha na autenticação.");
            }
        } catch (error) {
            setErro("Servidor inoperante.");
        } finally {
            setCarregando(false);
        }
    };

    // ... (o restante do código do return continua exatamente igual)

    return (
        <form onSubmit={lidarComSubmit} className="bg-slate-800 p-8 rounded-xl shadow-2xl border border-slate-700 w-full max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Acesso ao Sistema</h2>

            {/* ÁREA DE FEEDBACK: Só aparece se a variável 'erro' tiver algum texto */}
            {erro && (
                <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded mb-4 text-sm font-medium text-center">
                    🔴 {erro}
                </div>
            )}

            <div className="mb-4">
                <label className="block text-slate-400 text-sm font-bold mb-2" htmlFor="email">
                    E-mail Corporativo
                </label>
                <input 
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 rounded bg-slate-900 border border-slate-600 text-white focus:outline-none focus:border-cyan-500 transition"
                    placeholder="soldado@kamikase.com"
                    required
                    disabled={carregando} // Impede de digitar enquanto carrega
                />
            </div>

            <div className="mb-6">
                <label className="block text-slate-400 text-sm font-bold mb-2" htmlFor="senha">
                    Senha
                </label>
                <input 
                    id="senha"
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="w-full p-3 rounded bg-slate-900 border border-slate-600 text-white focus:outline-none focus:border-cyan-500 transition"
                    placeholder="********"
                    required
                    disabled={carregando}
                />
            </div>

            <button 
                type="submit" 
                disabled={carregando} // Desliga o botão para evitar clique duplo
                className={`w-full font-bold py-3 px-4 rounded transition flex justify-center items-center ${
                    carregando 
                    ? 'bg-slate-600 cursor-not-allowed text-slate-400' 
                    : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                }`}
            >
                {/* Condicional JSX: Muda o texto do botão instantaneamente */}
                {carregando ? 'Autenticando...' : 'Entrar no Quartel'}
            </button>
        </form>
    );
}