import React, { useState, useEffect } from 'react';
import './Header.css';
import { useNavigate } from 'react-router-dom';
import logoSenai from '../assets/imagens/logosenai.png';
import iconeUsuario from '../assets/imagens/boneco.png';
import ModalLogin from './ModalLogin';
import ModalCadastro from './ModalCadastro';
import ModalSenha from './ModalSenha';


const getNomeUsuarioLogado = () => {
    try {
        const usuarioLogadoString = localStorage.getItem('usuarioLogado');
        if (usuarioLogadoString) {
            const usuarioLogado = JSON.parse(usuarioLogadoString);
            return usuarioLogado.nome || usuarioLogado.email; 
        }
    } catch (error) {
        console.error("Erro ao ler ou fazer parse do usuário logado:", error);
    }
    return null; 
};


function Header() {
    const navigate = useNavigate();
    const [modalAberto, setModalAberto] = useState(''); 
    
    
    const [nomeExibicao, setNomeExibicao] = useState(getNomeUsuarioLogado());

    function handleLogout() {
        try {
            localStorage.removeItem('authToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('usuarioLogado');
        } catch (e) {
            console.error('Erro ao limpar credenciais do usuário:', e);
        }
        setNomeExibicao(null);
        setModalAberto('');
        navigate('/');
    }

    
    useEffect(() => {
        
        const checkLoginStatus = () => {
            setNomeExibicao(getNomeUsuarioLogado());
        };

        
        window.addEventListener('storage', checkLoginStatus);
       

      
        return () => {
            window.removeEventListener('storage', checkLoginStatus);
            
        };
    }, []); 

   
    const handleCloseModal = (isSuccessfulLogin = false) => {
        setModalAberto('');
        
        if (isSuccessfulLogin) {
            setNomeExibicao(getNomeUsuarioLogado());
        }
       
        setNomeExibicao(getNomeUsuarioLogado());
    };


    const menuItems = [
        { texto: 'O SENAI', ativo: true, link: 'https://www.sp.senai.br/' },
        { texto: 'Transparência', link: 'https://transparencia.sp.senai.br/' },
        { texto: 'Contato com a Ouvidoria', link: 'https://wa.me/551156423407' },
    ];

    function handleAlunoClick() {
        
        const isUserLoggedIn = !!nomeExibicao; 

        if (isUserLoggedIn) {
            
            const usuarioLogadoString = localStorage.getItem('usuarioLogado');
            if (!usuarioLogadoString) return navigate('/'); 

            try {
                const usuarioLogado = JSON.parse(usuarioLogadoString);
                const email = usuarioLogado.email;
    
                if (!email) return navigate('/');
    
                
                if (email === "pino@docente.senai.br" || email === "pino@senai.br") return navigate("/admin/adm-mec");
                if (email === "chile@docente.senai.br" || email === "chile@senai.br") return navigate("/admin/adm-info");
                if (email === "diretor@senai.br") return navigate("/admin");
                if (email === "vieira@docente.senai.br" || email === "vieira@senai.br") return navigate("/admin/adm-fac");
                
                if (email.endsWith("@aluno.senai.br")) return navigate("/aluno");
                if (email.endsWith("@senai.br") || email.endsWith("@docente.senai.br")) return navigate("/funcionario");
                
                navigate('/'); 
    
            } catch (error) {
                
                setModalAberto('login'); 
            }

        } else {
          
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
                    
                    <span className="sou-aluno">
                        {nomeExibicao ? nomeExibicao.split(' ')[0] : 'Entrar'}
                    </span>
                    
                </button>

                {nomeExibicao && (
                    <button
                        className="usuario"
                        type="button"
                        onClick={handleLogout}
                        style={{ marginLeft: '8px' }}
                    >
                        Sair
                    </button>
                )}
            </header>

           
            {React.createElement(ModalLogin, {
                key: 'modal-login',
                isOpen: modalAberto === 'login',
               
                onClose: () => handleCloseModal(true), 
                onCadastro: () => setModalAberto('cadastro'),
                onEsqueciSenha: () => setModalAberto('senha')
            })}

           
            {React.createElement(ModalCadastro, {
                key: 'modal-cadastro',
                isOpen: modalAberto === 'cadastro',
                onClose: () => setModalAberto('login')
            })}

           
            {React.createElement(ModalSenha, {
                key: 'modal-senha',
                isOpen: modalAberto === 'senha',
                onClose: () => setModalAberto('login')
            })}
        </>
    );
}

export default Header;
