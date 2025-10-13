import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../../Components/Footer';
import SenaiLogo from '../../assets/imagens/logosenai.png';
import ModalGerenciar from '../../Components/ModalGerenciar';
import './Admin.css';

// Usando a convenção de desestruturação para createElement
const { createElement: e } = React;

// --- Função de Normalização (Utils) ---
const normalizeString = (str) => {
    return String(str || '')
        .normalize('NFD') 
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
};
// ------------------------------

// --- Serviço de Manifestações (Service) ---
const ManifestacaoService = {
    getAllManifestacoes: () => {
        try {
            const data = localStorage.getItem('manifestacoes');
            if (data) {
                let manifestacoes = JSON.parse(data) || [];
                
                // Mapeia para garantir que todos tenham um ID único, usando o índice como fallback
                return manifestacoes.map((m, index) => ({
                    id: m.id || index + 1,
                    ...m
                }));
            }
            return [];
        } catch (error) {
            console.error("Erro ao carregar manifestações do localStorage:", error);
            return [];
        }
    },
    updateManifestacoes: (manifestacoes) => {
        // Remove a propriedade 'id' antes de salvar
        const manifestacoesToSave = manifestacoes.map(({ id, ...rest }) => rest);
        localStorage.setItem('manifestacoes', JSON.stringify(manifestacoesToSave));
    }
};
// ------------------------------------------

// --- Componente AdminHeader em JS Puro (Mantido) ---
const AdminHeader = ({ navigate, SenaiLogo }) => {
    return e(
        'div',
        { className: 'admin-header-full' },
        [
            e(
                'div',
                { className: 'admin-header-left' },
                [
                    e('img', { key: 'logo', src: SenaiLogo, alt: 'SENAI Logo' }),
                    e(
                        'div',
                        { key: 'texts' },
                        [
                            e('h1', null, 'Painel Administrativo - Geral'),
                            e('span', null, 'Bem-vindo(a), Diretor')
                        ]
                    )
                ]
            ),
            e(
                'div',
                { className: 'admin-header-right' },
                [
                    e('button', { key: 'manifestacoes-btn', className: 'btn-manifestacoes active' }, 'Manifestações'),
                    e('button', {
                        key: 'usuarios-btn',
                        className: 'btn-usuarios',
                        onClick: () => navigate('/admin/usuarios-geral')
                    }, 'Usuários'),
                    e('button', {
                        key: 'sair-btn',
                        className: 'btn-sair',
                        onClick: () => {
                            localStorage.removeItem('usuarioLogado');
                            navigate('/');
                        }
                    }, 'Sair')
                ]
            )
        ]
    );
};
// ------------------------------------------


function Admin() {
    const navigate = useNavigate();

    const [manifestacoes, setManifestacoes] = useState([]);
    const [manifestacaoSelecionada, setManifestacaoSelecionada] = useState(null);
    const [filtro, setFiltro] = useState('Todos');

    useEffect(() => {
        let usuarioLogado = null;
        const ADMIN_EMAIL = 'diretor@senai.br';

        try {
            const stored = localStorage.getItem('usuarioLogado');
            if (stored) {
                usuarioLogado = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Erro ao fazer parse do localStorage:', error);
        }

        if (!usuarioLogado || usuarioLogado.email !== ADMIN_EMAIL) {
            alert('Você precisa estar logado como administrador geral para acessar esta página.');
            navigate('/');
            return;
        }

        const todasManifestacoes = ManifestacaoService.getAllManifestacoes();

        setManifestacoes(todasManifestacoes);

    }, [navigate]);

    const manifestacoesFiltradas = filtro === 'Todos'
        ? manifestacoes
        : manifestacoes.filter(m =>
            normalizeString(m.tipo) === normalizeString(filtro)
        );

    const excluirManifestacao = (id) => {
        if (window.confirm('Tem certeza que deseja excluir essa manifestação?')) {
            const listaAtualizada = manifestacoes.filter(m => m.id !== id);

            setManifestacoes(listaAtualizada);
            ManifestacaoService.updateManifestacoes(listaAtualizada);
        }
    };

    const gerenciarManifestacao = (id) => {
        const manifestacao = manifestacoes.find(m => m.id === id);
        // Garante uma nova referência para o Modal
        setManifestacaoSelecionada({...manifestacao});
    };

    const fecharModal = () => {
        setManifestacaoSelecionada(null);
    };

    const salvarRespostaModal = (id, novoStatus, resposta) => {
        const listaAtualizada = manifestacoes.map(m => {
            if (m.id === id) {
                return {
                    ...m,
                    status: novoStatus,
                    respostaAdmin: resposta,
                    dataResposta: new Date().toLocaleDateString('pt-BR')
                };
            }
            return m;
        });

        setManifestacoes(listaAtualizada);
        ManifestacaoService.updateManifestacoes(listaAtualizada);

        fecharModal();
    };

    const total = manifestacoes.length;
    const pendentes = manifestacoes.filter(m => m.status === 'Pendente').length;
    const resolvidas = manifestacoes.filter(m => m.status === 'Resolvida').length;

    const tiposFiltro = ['Todos', 'Denúncia', 'Sugestão', 'Elogio', 'Reclamação'];

    // --- Renderização dos Botões de Filtro ---
    const botoesFiltro = tiposFiltro.map((tipo) =>
        e(
            'button',
            {
                key: tipo,
                className: normalizeString(filtro) === normalizeString(tipo) ? 'active' : '',
                onClick: () => setFiltro(tipo)
            },
            tipo
        )
    );

    // --- Renderização do Corpo da Tabela ---
    const corpoTabela = manifestacoesFiltradas.length === 0
        ? e(
            'tr', 
            { key: 'empty' }, 
            e('td', { colSpan: 6, className: 'empty-table-message' }, 'Nenhuma manifestação cadastrada para este filtro.')
        )
        : manifestacoesFiltradas.map((m) =>
            e(
                'tr',
                { key: m.id },
                [
                    e('td', null, m.tipo),
                    e('td', null, m.setor || 'Geral'),
                    e('td', null, m.contato),
                    // 🚀 MUDANÇA AQUI: Formata a data e hora para o padrão local (ex: DD/MM/AAAA HH:MM:SS)
                    e('td', null, m.dataCriacao ? new Date(m.dataCriacao).toLocaleString('pt-BR') : 'N/A'),
                    e(
                        'td',
                        null,
                        e(
                            'span',
                            { className: `status-label ${m.status ? m.status.toLowerCase() : 'pendente'}` },
                            m.status || 'Pendente'
                        )
                    ),
                    e(
                        'td',
                        { className: 'acoes-coluna' },
                        [
                            e(
                                'button',
                                {
                                    key: `gerenciar-${m.id}`,
                                    className: 'btn-gerenciar',
                                    onClick: () => gerenciarManifestacao(m.id)
                                },
                                'Gerenciar'
                            ),
                            e(
                                'button',
                                {
                                    key: `excluir-${m.id}`,
                                    className: 'btn-excluir',
                                    onClick: () => excluirManifestacao(m.id)
                                },
                                'Excluir'
                            )
                        ]
                    )
                ]
            )
        );

    // --- Renderização Final do Componente ---
    return e(
        'div',
        { className: 'admin-container' },
        [
            e(AdminHeader, { key: 'header', navigate: navigate, SenaiLogo: SenaiLogo }),

            e('div', { key: 'linha-vermelha', className: 'linha-vermelha' }),

            e(
                'div',
                { key: 'main-content-wrapper', className: 'admin-main-content-wrapper' },
                [
                    // Cartões de Resumo (Métricas)
                    e(
                        'div',
                        { key: 'cards', className: 'summary-cards' },
                        [
                            { label: 'Total de Manifestações', value: total },
                            { label: 'Pendentes', value: pendentes },
                            { label: 'Resolvidas', value: resolvidas },
                        ].map((item, index) =>
                            e(
                                'div',
                                { key: index, className: 'card' },
                                [
                                    e('p', { key: 'p' + index }, item.label),
                                    e('h3', { key: 'h3' + index }, item.value)
                                ]
                            )
                        )
                    ),

                    // Tabela e Filtros
                    e(
                        'div',
                        { key: 'table-and-title-wrapper', className: 'table-and-title-wrapper' },
                        [
                            e(
                                'div',
                                { key: 'titulo', className: 'manifestacoes-title' },
                                [
                                    e('h3', { key: 'h3' }, 'Manifestações Registradas'),
                                    e('small', { key: 'small' }, 'Gerencie todas as manifestações do sistema')
                                ]
                            ),

                            e('div', { key: 'filtros', className: 'filter-buttons' }, botoesFiltro),

                            e(
                                'div',
                                { key: 'tabela-container', className: 'admin-table-container' },
                                e(
                                    'table',
                                    { className: 'manifestacoes-table' },
                                    [
                                        e(
                                            'thead',
                                            { key: 'thead' },
                                            e(
                                                'tr',
                                                null,
                                                ['Tipo', 'Setor', 'Contato', 'Data Criação', 'Status', 'Ações'].map((th, i) =>
                                                    e('th', { key: i }, th)
                                                )
                                            )
                                        ),
                                        e('tbody', { key: 'tbody' }, corpoTabela)
                                    ]
                                )
                            )
                        ]
                    )
                ]
            ),

            e(Footer, { key: 'footer' }),

            // Modal de Gerenciamento
            manifestacaoSelecionada && e(ModalGerenciar, {
                key: 'modal-gerenciar',
                manifestacao: manifestacaoSelecionada,
                onClose: fecharModal,
                onSaveResponse: salvarRespostaModal,
                adminSetor: 'geral', 
                readOnly: false 
            })
        ]
    );
}

export default Admin;