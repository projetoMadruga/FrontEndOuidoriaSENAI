import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { manifestacoesService } from '../../services/manifestacoesService';
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
    if (!email) return "Outro";
    if (email.endsWith("@aluno.senai.br")) return "Aluno";
    if (email.endsWith("@senai.br") || email.endsWith("@docente.senai.br") || email.endsWith("@sp.senai.br")) return "Funcionário"; 
    return "Outro";
};

const getCursoFromEmail = (email) => {
    // Tenta extrair o curso do email se não tiver no cadastro
    if (!email) return 'N/A';
    // Exemplo: se o email for algo como ads@aluno.senai.br, retorna ADS
    const parte = email.split('@')[0];
    return parte || 'N/A';
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
                    e('p', { key: 'endereco' }, [e('strong', null, 'Endereço: '), usuario.endereco || 'N/A']),
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

    useEffect(() => {
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

        const ADMIN_EMAILS = ['chile@senai.br', 'chile@docente.senai.br', 'jsilva@sp.senai.br'];

        if (!usuario || !ADMIN_EMAILS.includes(usuario.email)) {
            alert('Você precisa estar logado como administrador de informática para acessar esta página.');
            navigate('/');
            return;
        }

        // Buscar usuários do backend
        const carregarUsuarios = async () => {
            try {
                const todosUsuarios = await manifestacoesService.listarUsuarios();
                
                console.log('╔════════════════════════════════════════╗');
                console.log('║  USUÁRIOS CARREGADOS - INFORMÁTICA     ║');
                console.log('╚════════════════════════════════════════╝');
                console.log('Total de usuários:', todosUsuarios?.length || 0);
                
                // Verifica se retornou array vazio ou null
                if (!todosUsuarios || todosUsuarios.length === 0) {
                    console.log('Nenhum usuário encontrado no backend');
                    setUsuarios([]);
                    return;
                }
                
                // Mapeia e filtra usuários
                const usuariosMapeados = todosUsuarios.map(u => ({
                    id: u.id,
                    nome: u.nome || 'Nome não informado',
                    email: u.emailEducacional,
                    tipo: getTipoUsuarioFromEmail(u.emailEducacional),
                    curso: u.curso || getCursoFromEmail(u.emailEducacional),
                    telefone: u.telefone || 'N/A',
                    cpf: u.cpf || 'N/A',
                    cargo: u.cargoUsuario || 'N/A'
                }));
                
                // Filtra apenas usuários da área de Informática (exceto admins)
                const usuariosFiltrados = usuariosMapeados.filter(u => {
                    const cursoNormalizado = normalizeString(u.curso);
                    const isAreaInfo = cursoNormalizado.includes('informatica') || 
                                      cursoNormalizado.includes('ti') || 
                                      cursoNormalizado.includes('ads') ||
                                      cursoNormalizado.includes('redes');
                    
                    const isNotAdmin = !ADMIN_EMAILS.includes(u.email);
                    
                    return isAreaInfo && isNotAdmin;
                });
                
                console.log('Usuários filtrados (Informática):', usuariosFiltrados.length);
                setUsuarios(usuariosFiltrados);
            } catch (error) {
                console.error('Erro ao carregar usuários:', error);
                console.error('Detalhes do erro:', error.message);
                setUsuarios([]);
            }
        };
        
        carregarUsuarios();
        
    }, [navigate]);

    const filtrarPorTipo = (lista, tipo) => {
        if (tipo === 'Todos') return lista;
        return lista.filter(u => normalizeString(u.tipo) === normalizeString(tipo)); 
    };

    const usuariosFiltrados = filtrarPorTipo(usuarios, filtroTipo);

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

    const excluirUsuario = async (usuario) => {
        if (window.confirm(`Tem certeza que deseja excluir ${usuario.nome}?`)) {
            try {
                // TODO: Implementar endpoint de exclusão no backend
                // await manifestacoesService.deletarUsuario(usuario.id);
                
                // Por enquanto, apenas remove da lista local
                const novosUsuariosInfo = usuarios.filter(u => u.id !== usuario.id);
                setUsuarios(novosUsuariosInfo);
                
                alert(`Usuário ${usuario.nome} excluído com sucesso!`);
                console.log(`Usuário ${usuario.nome} excluído!`);
            } catch (error) {
                console.error('Erro ao excluir usuário:', error);
                alert('Erro ao excluir usuário. Tente novamente.');
            }
        }
    };

    const tabelaCorpo = usuariosFiltrados.length === 0
        ? [e('tr', { key: 'empty' },
              e('td', { colSpan: 5, className: 'empty-row-message' }, 'Nenhum usuário de Informática encontrado.')
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
                    e('p', null, 'Gerencie os usuários da área de Informática')
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
