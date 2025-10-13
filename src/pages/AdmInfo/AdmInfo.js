import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listarTodasManifestacoes } from '../../services/adminApi';
import { api } from '../../services/api';
import Footer from '../../Components/Footer';
import SenaiLogo from '../../assets/imagens/logosenai.png';
import ModalGerenciar from '../../Components/ModalGerenciar';
import './AdmInfo.css';

const { createElement: e } = React;

const ADMIN_MAPPING = {
    'diretor@senai.br': 'Geral',
    'chile@senai.br': 'Informática',
    'pino@senai.br': 'Mecânica',
    'viera@senai.br': 'Faculdade'
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

const canEditManifestacao = (manifestacao, currentAdminArea) => {
    const adminArea = normalizeString(currentAdminArea);
    const manifestacaoArea = normalizeString(manifestacao.setor);

    // 1. Admin Geral pode editar tudo
    if (adminArea === 'geral') {
        return true;
    }

    // 2. Admin de Informática pode editar Informática E Geral
    if (adminArea === 'informatica') {
        if (manifestacaoArea === 'informatica' || manifestacaoArea === 'geral') {
            return true;
        }
    }
    
    // 3. Regra genérica para outros admins (Mecânica, Faculdade, etc.)
    return adminArea === manifestacaoArea; 
};

// =======================================================================
// AdminHeader (Mantido - já inclui o adminName)
// =======================================================================
const AdminHeader = ({ navigate, SenaiLogo, adminAreaName, adminName }) => {
    
    // Texto de boas-vindas: Usa apenas o primeiro nome
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
                            e('h1', null, `Painel Administrativo - ${adminAreaName}`),
                            e('span', null, `Bem-vindo(a), ${welcomeText}`)
                        ]
                    )
                ]
            )
            ,
            e(
                'div',
                { className: 'admin-header-right' },
                [
                    e('button', { key: 'manifestacoes-btn', className: 'btn-manifestacoes active' }, 'Manifestações'),
                    e('button', {
                        key: 'usuarios-btn',
                        className: 'btn-usuarios',
                        onClick: () => navigate('/admin/usuarios-info')
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


function AdmInfo() {
    const navigate = useNavigate();
    
    const [manifestacaoSelecionada, setManifestacaoSelecionada] = useState(null);
    const [manifestacoes, setManifestacoes] = useState([]); 
    const [filtro, setFiltro] = useState('Todos');
    
    const [currentAdminArea, setCurrentAdminArea] = useState(null); 
    const [currentAdminAreaName, setCurrentAdminAreaName] = useState('Carregando...');
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
        const userName = usuarioLogado?.nome;
        
        const userNormalizedArea = NORMALIZED_MAPPING[userEmail];
        
        if (!userNormalizedArea) {
            alert('Você precisa estar logado como administrador para acessar esta página.');
            navigate('/');
            return;
        }
        
        setCurrentAdminArea(userNormalizedArea);
        setCurrentAdminName(userName);
        
        const areaName = ADMIN_MAPPING[userEmail];
        setCurrentAdminAreaName(areaName);
            
        // Carrega do backend (token via api.js)
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

    const excluirManifestacao = (id) => {
        const item = manifestacoes.find(m => m.id === id);
        if (!item) {
            alert('Manifestação não encontrada.');
            return;
        }
        if (!canEditManifestacao(item, currentAdminArea)) {
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
            setManifestacaoSelecionada({ ...manifestacao }); 
        }
    };

    const fecharModal = () => {
        setManifestacaoSelecionada(null);
    };

    const salvarRespostaModal = (id, novoStatus, resposta) => {
        const item = manifestacoes.find(m => m.id === id);
        if (!item) { alert('Manifestação não encontrada.'); return; }
        if (!canEditManifestacao(item, currentAdminArea)) {
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

    const manifestacoesFiltradas = filtro === 'Todos'
        ? manifestacoes
        : manifestacoes.filter(m => 
            normalizeString(m.tipo) === normalizeString(filtro)
        );

    // Manifestações que o admin PODE EDITAR para cálculo das métricas
    const manifestacoesParaMetricas = manifestacoes.filter(m => canEditManifestacao(m, currentAdminArea));
        
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

    const corpoTabela = manifestacoesFiltradas.length === 0
        ? e(
            'tr', 
            { key: 'empty' }, 
            e('td', { colSpan: 6, className: 'empty-table-message' }, 'Nenhuma manifestação encontrada para o filtro selecionado.')
        )
        : manifestacoesFiltradas.map((m) => {
            // ✅ Corrigido: Usando a área normalizada para a verificação correta
            const podeEditar = canEditManifestacao(m, currentAdminArea); 
            const botaoGerenciarClasse = podeEditar ? 'btn-gerenciar' : 'btn-visualizar-only';
            const botaoGerenciarTexto = podeEditar ? 'Gerenciar' : 'Visualizar';
            const setorExibido = m.setor || 'N/A'; 
            
            // 🚀 MUDANÇA APLICADA AQUI: Formata a data e hora para o padrão local
            const dataCriacaoFormatada = m.dataCriacao 
                ? new Date(m.dataCriacao).toLocaleString('pt-BR') 
                : 'N/A';

            return e(
                'tr',
                { 
                    key: m.id, 
                    className: podeEditar ? '' : 'manifestacao-outra-area' 
                }, 
                [
                    e('td', null, m.tipo),
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
                            podeEditar && e(
                                'button',
                                {
                                    className: 'btn-excluir',
                                    onClick: () => excluirManifestacao(m.id),
                                    key: `excluir-${m.id}`
                                },
                                'Excluir'
                            )
                        ].filter(Boolean)
                    )
                ]
            );
        });
    
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
                adminName: currentAdminName 
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
                                    // ✅ Corrigido: Rótulo de visualização
                                    e('small', null, `Visualização de todas as manifestações (Ações restritas a ${metricasLabel})`) 
                                ]
                            ),

                            e(
                                'div',
                                { key: 'filtros', className: 'filter-buttons' },
                                botoesFiltro
                            ),

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
                // ✅ Corrigido: Usando a área normalizada para a verificação de readOnly
                readOnly: !canEditManifestacao(manifestacaoSelecionada, currentAdminArea) 
            })
        ]
    );
}

export default AdmInfo;