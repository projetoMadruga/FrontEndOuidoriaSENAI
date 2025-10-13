import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listarTodasManifestacoes } from '../../services/adminApi';
import { api } from '../../services/api';
import Footer from '../../Components/Footer';
import SenaiLogo from '../../assets/imagens/logosenai.png';
import ModalGerenciar from '../../Components/ModalGerenciar';
import './AdmMec.css';

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

// LÓGICA DE PERMISSÃO (Mantida)
const canEditManifestacao = (manifestacao, currentAdminArea) => {
    const adminArea = normalizeString(currentAdminArea);
    const manifestacaoArea = normalizeString(manifestacao.setor);
    const manifestacaoTipo = normalizeString(manifestacao.tipo); 

    if (adminArea === 'geral') {
        return true;
    }

    if (adminArea === 'mecanica') {
        const isReclamacao = manifestacaoTipo === 'reclamacao' || manifestacaoTipo === 'reclamação';

        // Pode editar Mecânica, Geral, ou qualquer Reclamação
        if (manifestacaoArea === 'mecanica' || manifestacaoArea === 'geral' || isReclamacao) {
            return true;
        }
    }

    // Regra padrão: Se a manifestação foi direcionada ao setor do admin
    return adminArea === manifestacaoArea;
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
                    e('img', { src: SenaiLogo, alt: 'SENAI Logo' }),
                    e(
                        'div',
                        null,
                        [
                            e('h1', null, `Painel Administrativo - ${adminAreaName}`),
                            e('span', null, `Bem-vindo(a), ${welcomeText}`)
                        ]
                    )
                ]
            ),
            e(
                'div',
                { className: 'admin-header-right' },
                [
                    e('button', { className: 'btn-manifestacoes active' }, 'Manifestações'),
                    e('button', {
                        className: 'btn-usuarios',
                        onClick: () => navigate('/admin/usuarios-mec')
                    }, 'Usuários'),
                    e('button', {
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


function AdmMec() {
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
            
        // Carrega a lista do backend usando adminApi (token já é anexado por api.js)
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
    
    const excluirManifestacao = (id) => {
        const item = manifestacoes.find(m => m.id === id);
        if (!item) {
            alert('Manifestação não encontrada.');
            return;
        }
        if (!canEditManifestacao(item, currentAdminArea)) {
            alert(`Você só pode excluir manifestações da sua área (${currentAdminAreaName}), manifestações Gerais ou Reclamações.`);
            return;
        }
        if (!window.confirm('Tem certeza que deseja excluir essa manifestação?')) return;

        const tipo = normalizeString(item.tipo);
        let base = '';
        if (tipo === 'reclamacao' || tipo === 'reclamação') base = '/reclamacoes';
        else if (tipo === 'denuncia' || tipo === 'denúncia') base = '/denuncias';
        else if (tipo === 'elogio') base = '/elogios';
        else if (tipo === 'sugestao' || tipo === 'sugestão') base = '/sugestoes';
        else {
            alert('Tipo de manifestação desconhecido para exclusão.');
            return;
        }

        api.del(`${base}/${id}`)
            .then(() => {
                setManifestacoes(prev => prev.filter(m => m.id !== id));
                alert('Manifestação excluída com sucesso.');
            })
            .catch(async (err) => {
                try {
                    if (err && err.status === 401) {
                        alert('Não autorizado. Faça login novamente.');
                        return;
                    }
                    if (err && err.status === 403) {
                        alert('Acesso negado: seu perfil não permite excluir esta manifestação.');
                        return;
                    }
                    const body = await err.json();
                    alert(body?.message || 'Erro ao excluir a manifestação.');
                } catch {
                    alert('Erro ao excluir a manifestação.');
                }
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
        const m = manifestacoes.find(x => x.id === id);
        if (!m) {
            alert('Manifestação não encontrada.');
            return;
        }
        const tipoNorm = normalizeString(m.tipo);
        // Pelo SecurityConfig, apenas PUT em /reclamacoes/** está liberado (ADMIN, MANUTENCAO, ALUNO, FUNCIONARIO)
        if (tipoNorm === 'reclamacao' || tipoNorm === 'reclamação') {
            api.put(`/reclamacoes/${id}`, { status: novoStatus, respostaAdmin: resposta })
                .then(() => {
                    // Atualiza localmente para refletir no UI
                    setManifestacoes(prev => prev.map(item => item.id === id ? { ...item, status: novoStatus, respostaAdmin: resposta } : item));
                    fecharModal();
                    alert('Reclamação atualizada com sucesso.');
                })
                .catch(async (err) => {
                    try {
                        if (err && err.status === 401) {
                            alert('Não autorizado. Faça login novamente.');
                            return;
                        }
                        if (err && err.status === 403) {
                            alert('Acesso negado: seu perfil não permite atualizar reclamações.');
                            return;
                        }
                        const body = await err.json();
                        alert(body?.message || 'Erro ao atualizar a reclamação.');
                    } catch {
                        alert('Erro ao atualizar a reclamação.');
                    }
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

    // Métrica: Manifestações Editáveis (Mecânica/Geral + Reclamações) para os cards
    const manifestacoesParaMetricas = manifestacoes.filter(m => canEditManifestacao(m, currentAdminArea));
    
    const totalGeral = manifestacoes.length; 
    const pendentes = manifestacoesParaMetricas.filter(m => m.status === 'Pendente').length;
    const resolvidas = manifestacoesParaMetricas.filter(m => m.status === 'Resolvida').length;
    
    const metricasLabel = 'Mecânica/Geral/Reclamações';

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
            null, 
            e('td', { colSpan: 6, className: 'empty-table-message' }, 'Nenhuma manifestação encontrada para o filtro selecionado.')
        )
        : manifestacoesFiltradas.map((m) => {
            const podeEditar = canEditManifestacao(m, currentAdminArea); 
            // A classe 'btn-visualizar-only' será estilizada como 'btn-gerenciar' no CSS
            const botaoGerenciarClasse = podeEditar ? 'btn-gerenciar' : 'btn-visualizar-only';
            const botaoGerenciarTexto = podeEditar ? 'Gerenciar' : 'Visualizar';
            const setorExibido = m.setor || 'N/A'; 
            
            // Formata a data e hora para o padrão local (ex: DD/MM/AAAA HH:MM:SS)
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
                    e('td', null, dataCriacaoFormatada),
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
                            // Botão Excluir só aparece se PODE EDITAR
                            podeEditar && e(
                                'button',
                                {
                                    className: 'btn-excluir',
                                    onClick: () => excluirManifestacao(m.id),
                                    key: `excluir-${m.id}`
                                },
                                'Excluir'
                            )
                        ]
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
                    e(
                        'div',
                        { key: 'cards', className: 'summary-cards' },
                        [
                            { label: 'Total de Manifestações (Sistema)', value: totalGeral },
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

                    e(
                        'div',
                        { key: 'table-and-title-wrapper', className: 'table-and-title-wrapper' },
                        [
                            e(
                                'div',
                                { key: 'titulo', className: 'manifestacoes-title' },
                                [
                                    e('h3', null, 'Todas as Manifestações Registradas'),
                                    e('small', null, `Visualização total (Ações restritas a Mecânica, Geral e Reclamação)`)
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

            manifestacaoSelecionada && e(ModalGerenciar, {
                key: 'modal-gerenciar',
                manifestacao: manifestacaoSelecionada,
                onClose: fecharModal,
                onSaveResponse: salvarRespostaModal,
                adminSetor: currentAdminArea, 
                // A prop readOnly é crucial: se canEditManifestacao for FALSE, o modal abre como SOMENTE LEITURA.
                readOnly: !canEditManifestacao(manifestacaoSelecionada, currentAdminArea)
            })
        ]
    );
}

export default AdmMec;