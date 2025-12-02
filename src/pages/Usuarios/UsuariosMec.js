import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { manifestacoesService } from '../../services/manifestacoesService';
import Footer from '../../Components/Footer'; 
import logoSenai from '../../assets/imagens/logosenai.png'; 
import './UsuariosMec.css';

// Removemos: const { createElement: e } = React;

const normalizeString = (str) => {
    return String(str || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
};

const getTipoUsuarioFromEmail = (email) => {
    if (email.endsWith("@aluno.senai.br")) return "Aluno";
    if (email.endsWith("@senai.br")) return "Funcionário"; 
    return "Outro";
};

// Transformado em uma factory de serviço para garantir que não precise de useCallback
const CrudServiceSimulado = {
    getAllUsers: () => {
        try {
            const data = localStorage.getItem('usuarios');
            if (data) {
                return JSON.parse(data).map((user, index) => ({
                    id: user.id || index + 1,
                    tipo: getTipoUsuarioFromEmail(user.email), 
                    ...user
                }));
            }
            return [];
        } catch (e) {
            console.error("Erro ao carregar usuários do localStorage:", e);
            return [];
        }
    },
    persistUsers: (users) => {
        const usersToSave = users.map(({ id, tipo, ...rest }) => rest);
        localStorage.setItem('usuarios', JSON.stringify(usersToSave));
    }
};

const AdminHeader = ({ logo, usuarioNome, navigate, activePage }) => {
    const handleLogout = () => {
        localStorage.removeItem('usuarioLogado');
        navigate('/');
    };
    
    const getNavClass = (page) => {
        let baseClass = '';
        if (page === 'manifestacoes') baseClass = 'btn-manifestacoes';
        if (page === 'usuarios') baseClass = 'btn-usuarios';
        if (page === 'sair') baseClass = 'btn-sair';

        return page === activePage ? `${baseClass} active` : baseClass;
    }

    // JSX para AdminHeader
    return (
        <div className="admin-header-full">
            <div className="admin-header-left">
                <img src={logo} alt="SENAI Logo" />
                <div>
                    <h1>Painel Administrativo - Mecânica</h1>
                    <span>{`Bem-vindo(a), ${usuarioNome || 'Admin'}`}</span> 
                </div>
            </div>
            <div className="admin-header-right">
                <button
                    className={getNavClass('manifestacoes')}
                    onClick={() => navigate('/admin/adm-mec')}
                >
                    Manifestações
                </button>
                
                <button
                    className={getNavClass('usuarios')}
                    onClick={() => navigate('/admin/usuarios-mec')} 
                >
                    Usuários
                </button>
                
                <button
                    className={getNavClass('sair')}
                    onClick={handleLogout}
                >
                    Sair
                </button>
            </div>
        </div>
    );
};

const ModalInspecionarUsuario = ({ onClose, usuario }) => {
    if (!usuario) return null;

    // JSX para ModalInspecionarUsuario
    return (
        <div className="modal-overlay" onClick={onClose}> 
            <div 
                className="modal-content modal-inspecionar" 
                onClick={(e) => e.stopPropagation()} 
            >
                <div className="modal-header">
                    <h2>{`Inspeção de Usuário: ${usuario.nome}`}</h2>
                    <button className="close-button" onClick={onClose}>×</button>
                </div>

                <div className="modal-body">
                    <p><strong>Nome Completo: </strong>{usuario.nome}</p>
                    <p><strong>Tipo de Usuário: </strong>{usuario.tipo || 'N/A'}</p>
                    <p><strong>Email: </strong>{usuario.email}</p>
                    <p><strong>Curso/Área: </strong>{usuario.curso || 'N/A'}</p>
                    <p><strong>Telefone: </strong>{usuario.telefone || 'N/A'}</p>
                    <p><strong>CPF: </strong>{usuario.cpf || 'N/A'}</p>
                </div>
                
                <div className="modal-actions">
                    <button 
                        className="btn-primary" 
                        onClick={onClose} 
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
}

function UsuariosMec() {
    const navigate = useNavigate();
    const [usuarios, setUsuarios] = useState([]);
    const [usuarioLogado, setUsuarioLogado] = useState(null);
    const [filtroTipo, setFiltroTipo] = useState('Todos');
    const [modalUsuario, setModalUsuario] = useState(null); 

    // Use useMemo para garantir que ADMIN_EMAILS seja estável
    const ADMIN_EMAILS = useMemo(() => ['pino@senai.br', 'pino@docente.senai.br', 'carlos.pino@sp.senai.br'], []);

    // Função de carregamento e filtragem de usuários usando useCallback
    const carregarUsuarios = useCallback(async () => {
        let usuario = null;
        try {
            const stored = localStorage.getItem('usuarioLogado');
            if (stored) {
                usuario = JSON.parse(stored);
                setUsuarioLogado(usuario);
            }
        } catch (e) {
            console.error('Erro ao parse do localStorage (usuarioLogado):', e);
        }

        if (!usuario || !ADMIN_EMAILS.includes(usuario.email)) {
            alert('Você precisa estar logado como administrador de mecânica para acessar esta página.');
            navigate('/');
            return;
        }

        // Buscar usuários do backend
        try {
            const todosUsuarios = await manifestacoesService.listarUsuarios();
            
            console.log('╔════════════════════════════════════════╗');
            console.log('║  USUÁRIOS CARREGADOS - MECÂNICA        ║');
            console.log('╚════════════════════════════════════════╝');
            console.log('Total de usuários:', todosUsuarios.length);
            
            // Mapeia e filtra usuários
            const usuariosMapeados = todosUsuarios.map(u => ({
                id: u.id,
                nome: u.nome || 'Nome não informado',
                email: u.emailEducacional,
                tipo: getTipoUsuarioFromEmail(u.emailEducacional),
                curso: u.curso || u.emailEducacional?.split('@')[0] || 'N/A',
                telefone: u.telefone || 'N/A',
                cpf: u.cpf || 'N/A',
                cargo: u.cargoUsuario || 'N/A'
            }));
            
            // Filtra apenas usuários da área de Mecânica (exceto admins)
            const usuariosFiltrados = usuariosMapeados.filter(u => {
                const cursoNormalizado = normalizeString(u.curso);
                const isAreaMec = cursoNormalizado.includes('mecanica') || 
                                 cursoNormalizado.includes('mecânica') ||
                                 cursoNormalizado.includes('mecatronica') ||
                                 cursoNormalizado.includes('mecatrônica');
                
                const isNotAdmin = !ADMIN_EMAILS.includes(u.email);
                
                return isAreaMec && isNotAdmin;
            });
            
            setUsuarios(usuariosFiltrados);
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
            alert('Erro ao carregar usuários. Tente novamente.');
            setUsuarios([]);
        }
    }, [navigate, ADMIN_EMAILS]);

    // Chamada inicial
    useEffect(() => {
        carregarUsuarios();
    }, [carregarUsuarios]); // Adicionei carregarUsuarios como dependência

    const filtrarPorTipo = (lista, tipo) => {
        if (tipo === 'Todos') return lista;
        return lista.filter(u => normalizeString(u.tipo) === normalizeString(tipo)); 
    };

    const usuariosFiltrados = useMemo(() => filtrarPorTipo(usuarios, filtroTipo), [usuarios, filtroTipo]);

    const getTipoLabel = (tipo) => {
        switch(tipo) {
            case 'Aluno': return 'Alunos';
            case 'Funcionário': return 'Funcionários';
            case 'Outro': return 'Outros';
            default: return 'Todos';
        }
    };
    
    const inspecionarUsuario = (usuario) => {
        setModalUsuario(usuario); 
    };
    
    const fecharModal = () => {
        setModalUsuario(null);
    };

    const excluirUsuario = (usuario) => {
        if (window.confirm(`Tem certeza que deseja excluir ${usuario.nome}?`)) {
            
            // Remove da lista exibida na tela
            const novosUsuariosMec = usuarios.filter(u => u.id !== usuario.id);
            setUsuarios(novosUsuariosMec);
            
            // Remove do localStorage (toda a lista)
            const todosUsuarios = CrudServiceSimulado.getAllUsers();
            const listaFinal = todosUsuarios.filter(u => u.id !== usuario.id);
            CrudServiceSimulado.persistUsers(listaFinal);

            console.log(`Usuário ${usuario.nome} excluído!`);
        }
    };

    // JSX para a Tabela
    const tabelaCorpo = usuariosFiltrados.length === 0
        ? (
            <tr>
                <td colSpan={5} className="empty-row-message">Nenhum usuário de Mecânica encontrado.</td>
            </tr>
        )
        : usuariosFiltrados.map(u => (
            <tr key={u.id}>
                <td>{u.tipo || 'N/A'}</td> 
                <td>{u.nome}</td>
                <td>{u.curso || 'N/A'}</td> 
                <td>{u.email}</td>
                <td className="table-actions">
                    <button className="btn-gerenciar" onClick={() => inspecionarUsuario(u)}>Inspecionar</button>
                    <button className="btn-excluir" onClick={() => excluirUsuario(u)}>Excluir</button>
                </td>
            </tr>
        ));
    
    const botoesFiltro = ['Todos', 'Aluno', 'Funcionário'].map(tipo => 
        <button
            key={tipo}
            className={filtroTipo === tipo ? 'btn-filter active-filter' : 'btn-filter'}
            onClick={() => setFiltroTipo(tipo)}
        >
            {getTipoLabel(tipo)}
        </button>
    );

    // JSX para o componente principal
    return (
        <div className="admin-container">
            <AdminHeader 
                logo={logoSenai} 
                usuarioNome={usuarioLogado?.nome || 'Admin'} 
                navigate={navigate} 
                activePage="usuarios" 
            />
            
            <div className="linha-vermelha" />

            <div className="admin-main-content-wrapper">
                <div className="usuarios-table-card">
                    
                    <div className="usuarios-header-content-inner">
                        <h3>Usuários Registrados (Mecânica)</h3>
                        <p>Gerencie os usuários da área de Mecânica</p>
                    </div>
                    
                    <div className="usuarios-filter-buttons"> 
                        <span className="filter-label">Filtrar por tipo:</span>
                        {botoesFiltro}
                    </div>

                    <div className="table-wrapper">
                        <table className="table-users">
                            <thead>
                                <tr>
                                    <th>Tipo</th>
                                    <th>Nome</th>
                                    <th>Área</th>
                                    <th>Email</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>{tabelaCorpo}</tbody>
                        </table>
                    </div>
                </div>
            </div>

            {modalUsuario && (
                <ModalInspecionarUsuario 
                    onClose={fecharModal} 
                    usuario={modalUsuario} 
                />
            )}

            <div className="footer-wrapper"> 
                <Footer />
            </div>
        </div>
    );
}

export default UsuariosMec;