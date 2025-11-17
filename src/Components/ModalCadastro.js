import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Modal.css";
import logosenai from "../assets/imagens/logosenai.png";
import boneco from "../assets/imagens/boneco.png";
import cadeado from "../assets/imagens/cadeado.png";
import { api } from "../services/api";

// Função utilitária para salvar o novo usuário na lista do localStorage
const persistNewUserLocally = (newUser) => {
    try {
        const storedUsers = localStorage.getItem('usuarios');
        let users = storedUsers ? JSON.parse(storedUsers) : [];
        
        if (!users.some(u => u.email === newUser.email)) {
            users.push(newUser);
            localStorage.setItem('usuarios', JSON.stringify(users));
        }
    } catch (e) {
        console.error("Erro ao salvar o usuário no localStorage:", e);
    }
};

function ModalCadastro({ isOpen, onClose }) {
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [nome, setNome] = useState("");
    const [telefone, setTelefone] = useState(""); 
    const [cpf, setCpf] = useState("");     
    const [curso, setCurso] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    if (!isOpen) return null;

    const redirecionarPorEmail = (email) => {
        const emailLower = email.toLowerCase();
        
        // Regras de ADMIN (manter em minúsculas para consistência)
        if (emailLower === "pino@docente.senai.br" || emailLower === "pino@senai.br") return navigate("/admin/adm-mec");
        if (emailLower === "chile@docente.senai.br" || emailLower === "chile@senai.br") return navigate("/admin/adm-info");
        if (emailLower === "diretor@docente.senai.br") return navigate("/admin");
        if (emailLower === "vieira@docente.senai.br" || emailLower === "vieira@senai.br") return navigate("/admin/adm-fac");
        
        // Regras de ALUNO e FUNCIONÁRIO/DOCENTE (Geral e SP)
        if (emailLower.endsWith("@aluno.senai.br")) return navigate("/aluno");
        
        // 💡 CORRIGIDO: Inclui os domínios de funcionário SP e genéricos
        if (
            emailLower.endsWith("@sp.senai.br") || 
            emailLower.endsWith("@sp.docente.senai.br") ||
            emailLower.endsWith("@senai.br") || 
            emailLower.endsWith("@docente.senai.br")
        ) return navigate("/funcionario");
        
        alert("E-mail não autorizado.");
    };

    const handleCadastro = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const emailLower = email.toLowerCase();
        let cargoUsuario = "";

        // 💡 CORRIGIDO: Determinação do cargo
        if (emailLower.endsWith("@aluno.senai.br")) {
            cargoUsuario = "ALUNO";
        } 
        else if (
            emailLower.endsWith("@sp.senai.br") ||
            emailLower.endsWith("@sp.docente.senai.br") ||
            emailLower.endsWith("@senai.br") ||
            emailLower.endsWith("@docente.senai.br")
        ) {
            cargoUsuario = "FUNCIONARIO";
        } else {
            setError("E-mail inválido. Utilize um domínio @senai.br ou @aluno.senai.br válido.");
            setLoading(false);
            return;
        }

        try {
            // 💡 CORRIGIDO: Constrói o payload com todos os dados do formulário
            const cadastroPayload = {
                emailEducacional: email,
                senha: senha,
                cargoUsuario: cargoUsuario, 
                nome: nome, 
                telefone: telefone,
                cpf: cpf
            };

            // 💡 CORRIGIDO: Adiciona o campo 'curso' *somente* se for ALUNO, se o back-end esperar.
            // Se o seu back-end usa o mesmo modelo para os dois, ele deve ser opcional.
            if (cargoUsuario === "ALUNO" && curso) {
                cadastroPayload.curso = curso; 
            }
            
            // 1. Chama a API de cadastro do back-end
            await api.post("/login/cadastrar", cadastroPayload);

            // 2. Cadastro bem-sucedido - agora faz login automático
            const response = await api.post("/login/autenticar", {
                emailEducacional: email,
                senha: senha
            });
            
            const { token, refreshToken } = response.data || {};

            if (token) localStorage.setItem("authToken", token);
            if (refreshToken) localStorage.setItem("refreshToken", refreshToken);

            // Determina o valor final do curso para armazenamento local
            const cursoFinal = cargoUsuario === "ALUNO" ? (curso || "Aguardando Seleção") : "N/A";

            const novoUsuarioCompleto = {
                email,
                nome,
                telefone,
                cpf,
                curso: cursoFinal,
                endereco: "N/A" 
            };
            
            // 3. Persistência e Redirecionamento
            persistNewUserLocally(novoUsuarioCompleto);
            localStorage.setItem("usuarioLogado", JSON.stringify({ email, nome, curso: cursoFinal }));

            alert("Cadastro realizado com sucesso!");
            redirecionarPorEmail(email);
            
            // Limpa o formulário e fecha o modal
            setNome(""); 
            setEmail(""); 
            setSenha(""); 
            setTelefone(""); 
            setCpf(""); 
            setCurso("");
            onClose();
        } catch (err) {
            console.error("Erro no cadastro:", err);
            
            let message = "Erro ao conectar com o servidor. Verifique a URL da API ou sua conexão.";
            
            // 💡 CORRIGIDO: Tratamento de erro do Axios
            if (err.response) {
                if (err.response.data && err.response.data.message) {
                    message = err.response.data.message;
                } else if (err.response.status === 409) {
                    message = "E-mail já cadastrado!";
                } else if (err.response.status === 400) {
                    message = "Dados inválidos: O servidor rejeitou o formulário. Verifique os campos CPF/Telefone ou se a API exige o campo 'curso' mesmo para funcionários.";
                } else {
                    message = `Erro na requisição (Status: ${err.response.status}).`;
                }
            } else if (err.message) {
                 message = `Falha de rede ou configuração: ${err.message}`;
            }

            setError(message);
            
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>×</button>
                <img src={logosenai} alt="Logo SENAI" className="logo-senai-modal" />
                <div className="linha-vermelha" />
                <h2 className="titulo-principal">Cadastro</h2>
                {error && <div className="error-message" style={{ color: "red", marginBottom: "10px", textAlign: "center" }}>{error}</div>}
                
                <form onSubmit={handleCadastro}>
                    
                    <div className="input-icon-container">
                        <img src={boneco} alt="nome" />
                        <input
                            type="text"
                            placeholder="Nome Completo"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            required
                        />
                    </div>
                    
                    <div className="input-icon-container">
                        <img src={boneco} alt="cpf" />
                        <input
                            type="text"
                            placeholder="CPF (Somente números)"
                            value={cpf}
                            onChange={(e) => setCpf(e.target.value.replace(/\D/g, '').substring(0, 11))}
                            required
                            maxLength={11}
                        />
                    </div>
                    
                    <div className="input-icon-container">
                        <img src={boneco} alt="telefone" />
                        <input
                            type="tel"
                            placeholder="Telefone (ex: 11987654321)"
                            value={telefone}
                            onChange={(e) => setTelefone(e.target.value.replace(/\D/g, '').substring(0, 11))}
                            required
                            maxLength={11}
                        />
                    </div>
                    
                    <div className="input-icon-container">
                        <img src={boneco} alt="email" />
                        <input
                            type="email"
                            placeholder="E-mail (obrigatório: @sp.senai.br, @senai.br ou @aluno.senai.br)"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    
                    {/* O campo Curso só aparece e é obrigatório para ALUNO */}
                    {email.toLowerCase().endsWith("@aluno.senai.br") && (
                        <div className="input-icon-container">
                            <img src={boneco} alt="curso" />
                            <select
                                value={curso}
                                onChange={(e) => setCurso(e.target.value)}
                                required={email.toLowerCase().endsWith("@aluno.senai.br")}
                                style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
                            >
                                <option value="">Selecione seu curso</option>
                                <option value="ADS">Análise e Desenvolvimento de Sistemas</option>
                                <option value="Redes">Redes de Computadores</option>
                                <option value="Mecânica">Mecânica</option>
                                <option value="Manufatura Digital">Manufatura Digital</option>
                                <option value="Faculdade">Faculdade SENAI</option>
                            </select>
                        </div>
                    )}
                    
                    <div className="input-icon-container">
                        <img src={cadeado} alt="senha" />
                        <input
                            type="password"
                            placeholder="Senha (mínimo 8 caracteres)"
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                            required
                            minLength={8}
                        />
                    </div>
                    
                    <button type="submit" className="submit-btn" disabled={loading}>
                        {loading ? "Cadastrando..." : "Cadastrar"}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default ModalCadastro;