import React, { useState, useEffect } from 'react';
import './Header.css';
import { useNavigate } from 'react-router-dom';
import logoSenai from '../assets/imagens/logosenai.png';
import iconeUsuario from '../assets/imagens/boneco.png';

import ModalLogin from './ModalLogin';
import ModalCadastro from './ModalCadastro';
import ModalSenha from './ModalSenha';

// Função auxiliar para extrair o nome do usuário do localStorage
const getNomeUsuarioLogado = () => {
    try {
        const usuarioLogadoString = localStorage.getItem('usuarioLogado');
        if (usuarioLogadoString) {
            const usuarioLogado = JSON.parse(usuarioLogadoString);
            // Verifica se o objeto tem a propriedade 'nome' e retorna.
            // Se o objeto de login não tiver 'nome', você precisará ajustar esta linha
            // para a propriedade correta (ex: usuarioLogado.email, usuarioLogado.apelido, etc.)
            return usuarioLogado.nome || usuarioLogado.email; 
        }
    } catch (error) {
        console.error("Erro ao ler ou fazer parse do usuário logado:", error);
    }
    return null; // Retorna null se não estiver logado ou em caso de erro
};


function Header() {
    const navigate = useNavigate();
    const [modalAberto, setModalAberto] = useState(''); // 'login', 'cadastro', 'senha', ''
    
    // 1. NOVO ESTADO: Armazena o nome do usuário para exibição no cabeçalho
    const [nomeExibicao, setNomeExibicao] = useState(getNomeUsuarioLogado());

    // 2. useEffect para atualizar o estado quando o login for completado ou alterado
    useEffect(() => {
        // Esta função garante que o nome seja atualizado
        const checkLoginStatus = () => {
            setNomeExibicao(getNomeUsuarioLogado());
        };

        // Adiciona um listener para o evento 'storage' (útil se o login for feito em outra aba)
        window.addEventListener('storage', checkLoginStatus);
        
        // Opcional: Adiciona um listener para um evento customizado disparado no ModalLogin
        // Ex: window.addEventListener('login-success', checkLoginStatus); 
        // Você precisaria disparar esse evento no ModalLogin após o sucesso.

        // Limpa o listener ao desmontar o componente
        return () => {
            window.removeEventListener('storage', checkLoginStatus);
            // window.removeEventListener('login-success', checkLoginStatus);
        };
    }, []); 

    // Opcional: Função para forçar a atualização do nome após fechar o ModalLogin, 
    // caso o login tenha sido bem sucedido dentro dele.
    const handleCloseModal = (isSuccessfulLogin = false) => {
        setModalAberto('');
        // Se o login foi bem-sucedido (você precisa passar essa informação do ModalLogin)
        if (isSuccessfulLogin) {
            setNomeExibicao(getNomeUsuarioLogado());
        }
        // Uma verificação simples após fechar o modal, se você não tem como saber o sucesso:
        setNomeExibicao(getNomeUsuarioLogado());
    };


    const menuItems = [
        { texto: 'O SENAI', ativo: true, link: 'https://www.sp.senai.br/' },
        { texto: 'Transparência', link: 'https://transparencia.sp.senai.br/' },
        { texto: 'Contato com a Ouvidoria' }
    ];

    function handleAlunoClick() {
        // Verifica se o nomeExibicao já foi carregado.
        const isUserLoggedIn = !!nomeExibicao; 

        if (isUserLoggedIn) {
            // Se já estiver logado (ou seja, nomeExibicao não é null), 
            // tenta redirecionar (reutiliza a lógica de redirecionamento)
            const usuarioLogadoString = localStorage.getItem('usuarioLogado');
            if (!usuarioLogadoString) return navigate('/'); // Caso localStorage tenha sido limpo

            try {
                const usuarioLogado = JSON.parse(usuarioLogadoString);
                const email = usuarioLogado.email;
    
                if (!email) return navigate('/');
    
                // Lógica de Redirecionamento 
                if (email === "pino@senai.br") return navigate("/admin/adm-mec");
                if (email === "chile@senai.br") return navigate("/admin/adm-info");
                if (email === "diretor@senai.br") return navigate("/admin");
                if (email === "viera@senai.br") return navigate("/admin/adm-fac");
                
                if (email.endsWith("@aluno.senai.br")) return navigate("/aluno");
                if (email.endsWith("@senai.br")) return navigate("/funcionario");
                
                navigate('/'); 
    
            } catch (error) {
                // Em caso de erro (JSON inválido), abre o modal de login
                setModalAberto('login'); 
            }

        } else {
            // Não logado → abre modal de login
            setModalAberto('login'); 
        }
    }


    return (
        <>
            <header className="header">
                <img src={logoSenai} alt="Logo SENAI" className="logo-senai" />

                <nav className="nav-menu">
                    {menuItems.map(({ texto, ativo, link }, index) => (
                        <a
                            href={link ? link : '#'}
                            key={index}
                            className={`nav-item ${ativo ? 'ativo' : ''}`}
                            {...(link ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                        >
                            {texto}
                        </a>
                    ))}
                </nav>

                <button
                    className="usuario"
                    type="button"
                    onClick={handleAlunoClick} 
                >
                    <div className="divisor" />
                    <img src={iconeUsuario} alt="Usuário" className="icone-usuario" />
                    {/* 3. MUDANÇA PRINCIPAL AQUI: Usa nomeExibicao ou "Entrar" */}
                    <span className="sou-aluno">
                        {nomeExibicao ? nomeExibicao.split(' ')[0] : 'Entrar'}
                    </span>
                    {/* Exibe apenas o primeiro nome se estiver logado, senão 'Entrar' */}
                </button>
            </header>

            {/* Modal Login */}
            {React.createElement(ModalLogin, {
                key: 'modal-login',
                isOpen: modalAberto === 'login',
                // Usa a função atualizada que verifica o login após fechar
                onClose: () => handleCloseModal(true), 
                onCadastro: () => setModalAberto('cadastro'),
                onEsqueciSenha: () => setModalAberto('senha')
            })}

            {/* Modal Cadastro */}
            {React.createElement(ModalCadastro, {
                key: 'modal-cadastro',
                isOpen: modalAberto === 'cadastro',
                onClose: () => setModalAberto('login')
            })}

            {/* Modal Esqueci Senha */}
            {React.createElement(ModalSenha, {
                key: 'modal-senha',
                isOpen: modalAberto === 'senha',
                onClose: () => setModalAberto('login')
            })}
        </>
    );
}

export default Header;