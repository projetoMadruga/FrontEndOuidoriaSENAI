import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// import CrudService from '../../services/CrudService'; // Assumindo que este serviço usa localStorage
import { listarTodasManifestacoes } from '../../services/adminApi';
import { api } from '../../services/api';
import Footer from '../../Components/Footer'; 
import SenaiLogo from '../../assets/imagens/logosenai.png'; 
import ModalGerenciar from '../../Components/ModalGerenciar'; 
import './AdmFac.css';

// Usando a convenção de desestruturação para createElement, como no código anterior
const { createElement: e } = React; 

// --- Mapeamento de Administradores ---
const ADMIN_MAPPING = {
    'diretor@senai.br': 'Geral', // Pode editar tudo
    'chile@senai.br': 'Informática', // Pode editar só Informática
    'pino@senai.br': 'Mecânica', // Pode editar só Mecânica
    'viera@senai.br': 'Faculdade' // Alias para o teste do usuário
};

const normalizeString = (str) => {
    return String(str || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
};

const NORMALIZED_MAPPING = Object.fromEntries(
    Object.entries(ADMIN_MAPPING).map(([email, area]) => [email, normalizeString(area)])
);

// --- Função central para verificar a permissão de edição/resposta ---
const canEditManifestacao = (manifestacao, currentAdminArea) => {
    const adminArea = normalizeString(currentAdminArea);
    const manifestacaoArea = normalizeString(manifestacao.setor);

    // 1. Admin Geral pode editar tudo
    if (adminArea === 'geral') {
        return true;
    }
    
    // 2. Admin de Faculdade tem regra especial: pode editar Faculdade E Geral
    if (adminArea === 'faculdade') {
        if (manifestacaoArea === 'faculdade' || manifestacaoArea === 'geral') {
            return true;
        }
    }

    // 3. Regra genérica para qualquer outro admin de área (Informática, Mecânica, etc.)
    // Um admin de área só pode editar a sua própria área.
    if (adminArea === manifestacaoArea) {
        return true;
    }

    // Nenhuma permissão de edição/resposta
    return false;
};

// --- Função de Serviço para simular CrudService.getAll() ---
const getAllManifestacoes = () => {
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
};

// =======================================================================
// AdminHeader (Mantido)
// =======================================================================
const AdminHeader = ({ navigate, SenaiLogo, adminAreaName, adminName }) => {
    
    // Texto de boas-vindas: Usa o nome (somente o primeiro nome) ou um fallback
    const welcomeText = adminName 
        ? `${adminName.split(' ')[0]}` 
        : `Admin de ${adminAreaName}`; 

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
                            // Título dinâmico
                            e('h1', null, `Painel Administrativo - ${adminAreaName}`),
                            // Exibe o nome do admin no 'Bem-vindo(a)'
                            e('span', null, `Bem-vindo(a), ${welcomeText}`)
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
                        onClick: () => navigate('/admin/usuarios-fac')
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
// =======================================================================
// FIM AdminHeader
// =======================================================================


function AdmFac() {
    const navigate = useNavigate();
    
    const [manifestacaoSelecionada, setManifestacaoSelecionada] = useState(null);
    const [manifestacoes, setManifestacoes] = useState([]); 
    const [filtro, setFiltro] = useState('Todos');
    
    const [currentAdminArea, setCurrentAdminArea] = useState(null); 
    const [currentAdminAreaName, setCurrentAdminAreaName] = useState('Carregando...');
    // Para armazenar o nome do usuário logado
    const [currentAdminName, setCurrentAdminName] = useState(null);


    useEffect(() => {
        let usuarioLogado = null;

        try {
            const stored = localStorage.getItem('usuarioLogado');
            if (stored) {
                usuarioLogado = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Erro ao fazer parse do localStorage (usuarioLogado):', error);
        }

        const userEmail = usuarioLogado?.email;
        // EXTRAÇÃO DO NOME AQUI:
        const userName = usuarioLogado?.nome; // ✅ Assume que o objeto tem a propriedade 'nome'
        
        const userNormalizedArea = NORMALIZED_MAPPING[userEmail];
        
        // Verifica se o usuário é um dos administradores mapeados
        if (!userNormalizedArea) {
            alert('Você precisa estar logado como administrador para acessar esta página.');
            navigate('/');
            return;
        }
        
        // Define o estado do admin logado
        setCurrentAdminArea(userNormalizedArea);
        setCurrentAdminName(userName); // ✅ Salva o nome no estado
        
        // Define o nome de exibição do admin
        const areaName = ADMIN_MAPPING[userEmail];
        setCurrentAdminAreaName(areaName);
            
        // Carrega do backend (token é adicionado por api.js)
        (async () => {
            try {
                const dados = await listarTodasManifestacoes();
                setManifestacoes(dados);
            } catch (err) {
                console.error('Erro ao carregar manifestações do backend:', err);
                alert('Não foi possível carregar as manifestações. Verifique seu login/permissões.');
            }
        })();

    }, [navigate]);
    
    if (!currentAdminArea) {
        return e('div', null, 'Carregando painel...');
    }

    // Função central de persistência
    const persistirManifestacoes = (manifestacaoEditada) => {
        setManifestacoes(prevManifestacoes => {
            const listaAtualizada = prevManifestacoes.map(m => 
                m.id === manifestacaoEditada.id ? manifestacaoEditada : m
            );

            // Filtra e prepara para salvar, removendo IDs e mantendo apenas a informação original
            const dataToSave = listaAtualizada.map(({ id, ...rest }) => rest);
            localStorage.setItem('manifestacoes', JSON.stringify(dataToSave));

            return listaAtualizada;
        });
    };

    const excluirManifestacao = (id) => {
        const item = manifestacoes.find(m => m.id === id);
        if (!item) { alert('Manifestação não encontrada.'); return; }
        if (!canEditManifestacao(item, currentAdminAreaName)) {
            alert(`Você só pode excluir manifestações da sua área (${currentAdminAreaName}) ou manifestações Gerais.`);
            return;
        }
        if (!window.confirm('Tem certeza que deseja excluir essa manifestação?')) return;

        const tipo = (String(item.tipo)||'').normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();
        let base = '';
        if (tipo === 'reclamacao') base = '/reclamacoes';
        else if (tipo === 'denuncia') base = '/denuncias';
        else if (tipo === 'elogio') base = '/elogios';
        else if (tipo === 'sugestao') base = '/sugestoes';
        else { alert('Tipo de manifestação desconhecido.'); return; }

        api.del(`${base}/${id}`)
            .then(() => {
                setManifestacoes(prev => prev.filter(m => m.id !== id));
                alert('Manifestação excluída com sucesso.');
            })
            .catch(async (err) => {
                try {
                    if (err && err.status === 401) { alert('Não autorizado. Faça login.'); return; }
                    if (err && err.status === 403) { alert('Acesso negado para exclusão.'); return; }
                    const body = await err.json();
                    alert(body?.message || 'Erro ao excluir a manifestação.');
                } catch { alert('Erro ao excluir a manifestação.'); }
            });
    };

    const gerenciarManifestacao = (id) => {
        const manifestacao = manifestacoes.find(m => m.id === id);
        if (manifestacao) {
            // Clona o objeto para garantir dados únicos no modal
            setManifestacaoSelecionada({ ...manifestacao });
        }
    };

    const fecharModal = () => {
        setManifestacaoSelecionada(null);
    };

    const salvarRespostaModal = (id, novoStatus, resposta) => {
        const item = manifestacoes.find(m => m.id === id);
        if (!item) { alert('Manifestação não encontrada.'); return; }
        if (!canEditManifestacao(item, currentAdminAreaName)) {
            alert(`Erro: Você não pode editar manifestações que não são da sua área (${currentAdminAreaName}) ou manifestações Gerais.`);
            return;
        }
        const tipo = (String(item.tipo)||'').normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();
        if (tipo === 'reclamacao') {
            api.put(`/reclamacoes/${id}`, { status: novoStatus, respostaAdmin: resposta })
                .then(() => {
                    setManifestacoes(prev => prev.map(m => m.id === id ? { ...m, status: novoStatus, respostaAdmin: resposta } : m));
                    fecharModal();
                    alert('Reclamação atualizada com sucesso.');
                })
                .catch(async (err) => {
                    try {
                        if (err && err.status === 401) { alert('Não autorizado. Faça login.'); return; }
                        if (err && err.status === 403) { alert('Acesso negado: sem permissão para atualizar.'); return; }
                        const body = await err.json();
                        alert(body?.message || 'Erro ao atualizar a reclamação.');
                    } catch { alert('Erro ao atualizar a reclamação.'); }
                });
            return;
        }
        alert('Atualização via API disponível apenas para Reclamação neste momento.');
        fecharModal();
    };
    
    // Retorna TODAS as manifestações (visualização completa), filtradas pelo tipo
    const manifestacoesFiltradas = filtro === 'Todos'
        ? manifestacoes
        : manifestacoes.filter(m => 
            normalizeString(m.tipo) === normalizeString(filtro)
        );

    // Manifestações que o admin PODE EDITAR para cálculo das métricas
    const manifestacoesParaMetricas = manifestacoes.filter(m => canEditManifestacao(m, currentAdminAreaName));
    
    const totalGeral = manifestacoes.length;
    const pendentes = manifestacoesParaMetricas.filter(m => m.status === 'Pendente').length;
    const resolvidas = manifestacoesParaMetricas.filter(m => m.status === 'Resolvida').length;
    
    // Determina o escopo das métricas
    const metricasLabel = currentAdminAreaName === 'Geral' ? 'Total' : `${currentAdminAreaName} e Gerais`; 

    const tiposFiltro = ['Todos', 'Denúncia', 'Sugestão', 'Elogio', 'Reclamação'];

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
            e('td', { colSpan: 6, className: 'empty-table-message' }, 'Nenhuma manifestação encontrada para o filtro selecionado.')
        )
        : manifestacoesFiltradas.map((m) => {
            const podeEditar = canEditManifestacao(m, currentAdminAreaName);
            const botaoGerenciarClasse = podeEditar ? 'btn-gerenciar' : 'btn-visualizar-only';
            const botaoGerenciarTexto = podeEditar ? 'Gerenciar' : 'Visualizar';
            const setorExibido = m.setor || 'N/A'; 
            
            // 🚀 MUDANÇA APLICADA AQUI: Formata a data e hora para o padrão local (ex: DD/MM/AAAA HH:MM:SS)
            const dataCriacaoFormatada = m.dataCriacao 
                ? new Date(m.dataCriacao).toLocaleString('pt-BR') 
                : 'N/A';

            return e(
                'tr',
                { 
                    key: m.id, 
                    // Classe visual para indicar que não é editável
                    className: podeEditar ? '' : 'manifestacao-outra-area' 
                }, 
                [
                    e('td', null, m.tipo),
                    // Coluna Setor (Adicionada)
                    e('td', null, setorExibido), 
                    e('td', null, m.contato),
                    e('td', null, dataCriacaoFormatada), // ✅ Usando a data formatada
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
                                    className: botaoGerenciarClasse,
                                    onClick: () => gerenciarManifestacao(m.id),
                                    key: `gerenciar-${m.id}` 
                                },
                                botaoGerenciarTexto
                            ),
                            // Botão Excluir só aparece se tiver permissão de edição
                            podeEditar && e(
                                'button',
                                {
                                    className: 'btn-excluir',
                                    onClick: () => excluirManifestacao(m.id),
                                    key: `excluir-${m.id}` 
                                },
                                'Excluir'
                            )
                        ].filter(Boolean) // Remove o false se podeEditar for falso
                    )
                ]
            );
        });

    // --- Renderização Final do Componente ---
    return e(
        'div',
        { className: 'admin-container' },
        [
            // Passa o nome do admin
            e(AdminHeader, { 
                key: 'header', 
                navigate: navigate, 
                SenaiLogo: SenaiLogo, 
                adminAreaName: currentAdminAreaName,
                adminName: currentAdminName // ✅ Nome do Admin
            }),

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
                            { label: 'Total de Manifestações (Geral)', value: totalGeral },
                            { label: `Pendentes (${metricasLabel})`, value: pendentes },
                            { label: `Resolvidas (${metricasLabel})`, value: resolvidas },
                        ].map((item, index) =>
                            e(
                                'div',
                                { key: index, className: 'card' },
                                [
                                    e('p', null, item.label),
                                    e('h3', null, item.value)
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
                                    e('h3', null, 'Manifestações Registradas'),
                                    e('small', null, `Visualização de todas as manifestações (Ações restritas a ${metricasLabel})`)
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
                                        e(
                                            'tbody',
                                            { key: 'tbody' },
                                            corpoTabela
                                        )
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
                adminSetor: currentAdminArea, 
                // Define readOnly baseado na permissão de edição
                readOnly: !canEditManifestacao(manifestacaoSelecionada, currentAdminAreaName)
            })
        ]
    );
}

export default AdmFac;