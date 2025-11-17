import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../../Components/Footer'; 
import logoSenai from '../../assets/imagens/logosenai.png'; 
import './UsuariosInfo.css';

const { createElement: e } = React;

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

// --- CRUD SERVICE SIMULADO ---
const CrudServiceSimulado = {
    getAllUsers: () => {
        try {
            // Lendo a lista completa de usuários do localStorage (chave 'usuarios')
            const data = localStorage.getItem('usuarios'); 
            if (data) {
                const users = JSON.parse(data);
                // Mapeia adicionando o ID (fallback index) e o Tipo
                return users.map((user, index) => ({
                    id: user.id || index + 1,
                    tipo: getTipoUsuarioFromEmail(user.email), 
                    ...user
                }));
            }
            // Retorna array vazio se não houver dados
            return [];
        } catch (e) {
            console.error("Erro ao carregar usuários do localStorage:", e);
            return [];
        }
    },
    persistUsers: (users) => {
        // Salva a lista de usuários de volta no localStorage
        const usersToSave = users.map(({ id, tipo, ...rest }) => rest);
        localStorage.setItem('usuarios', JSON.stringify(usersToSave));
    }
};
// -----------------------------

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

    return e('div', { className: 'admin-header-full' }, 
        e('div', { className: 'admin-header-left' },
            e('img', { src: logo, alt: 'SENAI Logo' }),
            e('div', null,
                e('h1', null, 'Painel Administrativo - Informática'),
                e('span', null, `Bem-vindo(a), ${usuarioNome || 'Admin'}`) 
            )
        ),
        e('div', { className: 'admin-header-right' },
            e('button', {
                className: getNavClass('manifestacoes'),
                onClick: () => navigate('/admin/adm-info')
            }, 'Manifestações'),
            
            e('button', {
                className: getNavClass('usuarios'),
                onClick: () => navigate('/admin/usuarios-info') 
            }, 'Usuários'),
            
            e('button', {
                className: getNavClass('sair'),
                onClick: handleLogout
            }, 'Sair')
        )
    );
};

const ModalInspecionarUsuario = ({ onClose, usuario }) => {
    if (!usuario) return null;

    return e(
        'div',
        { className: 'modal-overlay', onClick: onClose }, 
        e(
            'div',
            { 
                className: 'modal-content modal-inspecionar', 
                onClick: (e) => e.stopPropagation() 
            },
            [
                e('div', { key: 'header', className: 'modal-header' }, [
                    e('h2', { key: 'title' }, `Inspeção de Usuário: ${usuario.nome}`),
                    e('button', { key: 'close', className: 'close-button', onClick: onClose }, '×')
                ]),

                e('div', { key: 'body', className: 'modal-body' }, [
                    e('p', { key: 'nome' }, [e('strong', null, 'Nome Completo: '), usuario.nome]),
                    e('p', { key: 'tipo' }, [e('strong', null, 'Tipo de Usuário: '), usuario.tipo || 'N/A']),
                    e('p', { key: 'email' }, [e('strong', null, 'Email: '), usuario.email]),
                    e('p', { key: 'area' }, [e('strong', null, 'Curso/Área: '), usuario.curso || 'N/A']),
                    e('p', { key: 'telefone' }, [e('strong', null, 'Telefone: '), usuario.telefone || 'N/A']),
                    e('p', { key: 'cpf' }, [e('strong', null, 'CPF: '), usuario.cpf || 'N/A']),
                ]),
                
                e('div', { key: 'footer', className: 'modal-actions' }, [
                    e('button', { 
                        key: 'btn-fechar', 
                        className: 'btn-primary', 
                        onClick: onClose 
                    }, 'Fechar')
                ])
            ]
        )
    );
}


function UsuariosInfo() {
    const navigate = useNavigate();
    const [usuarios, setUsuarios] = useState([]);
    const [usuarioLogado, setUsuarioLogado] = useState(null);
    const [filtroTipo, setFiltroTipo] = useState('Todos');
    const [modalUsuario, setModalUsuario] = useState(null); 

    // Lista de termos para cursos de Informática (ADS, Redes, TI, etc.)
    const AREA_INFO_TERMS = useMemo(() => ['ads', 'analise', 'sistemas', 'redes', 'informatica', 'ti'], []);
    const ADMIN_EMAILS = useMemo(() => ['chile@senai.br', 'chile@docente.senai.br'], []);


    const carregarUsuarios = useCallback(() => {
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
            alert('Você precisa estar logado como administrador de informática para acessar esta página.');
            navigate('/');
            return;
        }

        const todosUsuarios = CrudServiceSimulado.getAllUsers();

        const usuariosFiltrados = todosUsuarios.filter(u => {
            
            const cursoNormalizado = normalizeString(u.curso);
            
            // 💡 LÓGICA DE FILTRO: Verifica se o curso contém algum dos termos relacionados à área de Informática
            const isAreaInfo = AREA_INFO_TERMS.some(term => cursoNormalizado.includes(term));
            
            // Não exibe os próprios administradores na lista de usuários
            const isNotAdmin = !ADMIN_EMAILS.includes(u.email);

            return isAreaInfo && isNotAdmin;
        });
        
        setUsuarios(usuariosFiltrados);
        
    }, [navigate, ADMIN_EMAILS, AREA_INFO_TERMS]);

    useEffect(() => {
        carregarUsuarios();
    }, [carregarUsuarios]);

    const filtrarPorTipo = (lista, tipo) => {
        if (tipo === 'Todos') return lista;
        return lista.filter(u => normalizeString(u.tipo) === normalizeString(tipo)); 
    };

    const usuariosFiltrados = useMemo(
        () => filtrarPorTipo(usuarios, filtroTipo),
        [usuarios, filtroTipo]
    );

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
            
            // 1. Remove da lista local (exibida)
            const novosUsuariosInfo = usuarios.filter(u => u.id !== usuario.id);
            setUsuarios(novosUsuariosInfo);
            
            // 2. Remove da lista completa e persiste no localStorage
            const todosUsuarios = CrudServiceSimulado.getAllUsers();
            const listaFinal = todosUsuarios.filter(u => u.id !== usuario.id);
            CrudServiceSimulado.persistUsers(listaFinal);

            console.log(`Usuário ${usuario.nome} excluído!`);
        }
    };

    const tabelaCorpo = usuariosFiltrados.length === 0
        ? [e('tr', { key: 'empty' },
              e('td', { colSpan: 5, className: 'empty-row-message' }, 'Nenhum usuário de Informática (ADS/Redes/TI) encontrado.')
          )]
        : usuariosFiltrados.map(u => e('tr', { key: u.id },
              e('td', null, u.tipo || 'N/A'), 
              e('td', null, u.nome),
              e('td', null, u.curso || 'N/A'), 
              e('td', null, u.email),
              e('td', { className: 'table-actions' },
                  e('button', { className: 'btn-gerenciar', onClick: () => inspecionarUsuario(u) }, 'Inspecionar'), 
                  e('button', { className: 'btn-excluir', onClick: () => excluirUsuario(u) }, 'Excluir')
              )
          ));
    
    const botoesFiltro = ['Todos', 'Aluno', 'Funcionário'].map(tipo => 
        e('button', {
            key: tipo,
            className: filtroTipo === tipo ? 'btn-filter active-filter' : 'btn-filter',
            onClick: () => setFiltroTipo(tipo)
        }, getTipoLabel(tipo))
    );

    return e('div', { className: 'admin-container' },
        e('button', {
            key: 'back-to-home',
            className: 'btn-back-home',
            onClick: () => navigate('/admin/adm-info'),
            title: 'Voltar para a Home'
        }, '‹'),
        e(AdminHeader, { 
            logo: logoSenai, 
            usuarioNome: usuarioLogado?.nome || 'Admin', 
            navigate: navigate, 
            activePage: "usuarios" 
        }),
        
        e('div', { className: 'linha-vermelha' }),

        e('div', { className: 'admin-main-content-wrapper' },
            e('div', { className: 'usuarios-table-card' },
                
                e('div', { className: 'usuarios-header-content-inner' },
                    e('h3', null, 'Usuários Registrados (Informática)'),
                    e('p', null, 'Gerencie os usuários das áreas de ADS, Redes e TI.')
                ),
                
                e('div', { className: 'usuarios-filter-buttons' }, 
                    e('span', { className: 'filter-label' }, 'Filtrar por tipo:'),
                    ...botoesFiltro
                ),

                e('div', { className: 'table-wrapper' },
                    e('table', { className: 'table-users' },
                        e('thead', null,
                            e('tr', null,
                                e('th', null, 'Tipo'),
                                e('th', null, 'Nome'),
                                e('th', null, 'Área'),
                                e('th', null, 'Email'),
                                e('th', null, 'Ações')
                            )
                        ),
                        e('tbody', null, ...tabelaCorpo)
                    )
                )
            )
        ),

        modalUsuario && e(ModalInspecionarUsuario, { 
            onClose: fecharModal, 
            usuario: modalUsuario 
        }),

        e('div', { className: 'footer-wrapper' }, 
            e(Footer, null)
        )
    );
}

export default UsuariosInfo;