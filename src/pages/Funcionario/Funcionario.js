import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../../Components/Footer";
import CrudService from "../../services/CrudService";
import { manifestacoesService } from "../../services/manifestacoesService";
import "./Funcionario.css"; 

import SenaiLogo from '../../assets/imagens/logosenai.png';

const FuncionarioHeader = ({ navigate, usuarioEmail }) => {
    
    const headerTitle = 'Painel do Funcionário';
    const emailDisplay = usuarioEmail || '@senai.br';

    return React.createElement(
        'div',
        { className: 'funcionario-header-full' },
        [
            React.createElement(
                'div',
                { className: 'funcionario-header-left' },
                [
                    React.createElement('img', {
                        src: SenaiLogo,
                        alt: 'Logo SENAI',
                        className: 'senai-logo-img'
                    }),
                    React.createElement(
                        'div',
                        null,
                        [
                            React.createElement('h1', null, headerTitle),
                            React.createElement('span', null, `Bem-Vindo(a), ${emailDisplay}`) 
                        ]
                    )
                ]
            ),
            React.createElement(
                'div',
                { className: 'funcionario-header-right' },
                [
                    React.createElement('button', {
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

const DetalhesModal = ({ item, fecharVisualizacao, traduzirTipo, getFuncionarioStatus }) => {
   
    if (!item) return null;

    const dataHoraFormatada = new Date(item.dataCriacao).toLocaleDateString("pt-BR", {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
    
    const localIncidente = item.localIncidente || item.local || 'Não especificado'; 
    const dataHora = dataHoraFormatada; 


    return React.createElement(
        'div',
        { className: 'modal-overlay', onClick: fecharVisualizacao },
        React.createElement(
            'div',
            { 
                className: 'modal-content', 
                onClick: (e) => e.stopPropagation() 
            },
            [
                React.createElement('h3', null, 'Detalhes da Manifestação'),
                
                React.createElement('p', null, React.createElement('strong', null, 'Local do Incidente: '), localIncidente),
                
                React.createElement('p', null, React.createElement('strong', null, 'Data e Hora: '), dataHora),

                React.createElement('p', null, React.createElement('strong', null, 'Tipo: '), traduzirTipo(item.tipo)),

                React.createElement('p', null, React.createElement('strong', null, 'Status: '), getFuncionarioStatus(item.status)),

                React.createElement('div', { className: 'modal-section' }, [
                    React.createElement('strong', null, 'Descrição:'),
                    React.createElement('p', null, item.descricao || 'Descrição não fornecida.')
                ]),

                item.respostaAdmin && React.createElement('div', { className: 'modal-section resposta-admin' }, [
                    React.createElement('strong', null, 'Resposta da Coordenação:'),
                    React.createElement('p', null, item.respostaAdmin)
                ]),

                React.createElement(
                    "button",
                    { className: "btn-fechar-modal", onClick: fecharVisualizacao },
                    "Fechar"
                )
            ]
        )
    );
};


function Funcionario() {
    const navigate = useNavigate();
    const [manifestacoes, setManifestacoes] = useState([]);
    const [usuarioLogado, setUsuarioLogado] = useState(null);
    const [itemVisualizando, setItemVisualizando] = useState(null);
    const fecharVisualizacao = () => setItemVisualizando(null);

    const { traduzirTipo, FUNCIONARIO_STATUS_MAP } = useMemo(() => {
       
        const STATUS = CrudService.STATUS_MANIFESTACAO || {};
        const TIPOS = CrudService.TIPOS_MANIFESTACAO || {};

        const tipos = {
            [TIPOS.RECLAMACAO]: "Reclamação",
            [TIPOS.DENUNCIA]: "Denúncia",
            [TIPOS.ELOGIO]: "Elogio",
            [TIPOS.SUGESTAO]: "Sugestão",
        };

        const statusMap = {
            [STATUS.PENDENTE]: 'Pendente',
            [STATUS.EM_ANALISE]: 'Em Análise',
            [STATUS.RESOLVIDO]: 'Resolvido',
            [STATUS.ARQUIVADO]: 'Arquivado',
        };

        return {
            traduzirTipo: (tipo) => tipos[tipo] || tipo,
            FUNCIONARIO_STATUS_MAP: statusMap,
        };
    }, []);

    const getFuncionarioStatus = (statusOriginal) => {
      
        return FUNCIONARIO_STATUS_MAP[statusOriginal] || 'Pendente';
    }

    const formatarData = (dataIso) => {
        if (!dataIso) return "";
        const data = new Date(dataIso);
        return data.toLocaleDateString("pt-BR");
    };

   
    const carregarManifestacoes = async (usuario) => {
        if (!usuario || !usuario.email) {
            setManifestacoes([]);
            return;
        }

        try {
            // Tenta buscar do backend primeiro
            const manifestacoesBackend = await manifestacoesService.listarManifestacoes();
            
            // Converte para o formato esperado pelo frontend
            const manifestacoesFormatadas = manifestacoesBackend.map(m => ({
                id: m.id.toString(),
                tipo: manifestacoesService.formatarTipo(m.tipo),
                dataCriacao: m.dataHora,
                status: manifestacoesService.formatarStatus(m.status),
                descricao: m.descricaoDetalhada,
                respostaAdmin: m.observacao || '',
                localIncidente: m.local,
                usuarioEmail: m.emailUsuario,
                contacto: m.emailUsuario
            }));

            // Ordena por data de criação (mais recente primeiro)
            const manifestacoesOrdenadas = manifestacoesFormatadas.sort((a, b) => 
                new Date(b.dataCriacao) - new Date(a.dataCriacao)
            );

            setManifestacoes(manifestacoesOrdenadas);
        } catch (error) {
            console.error("Erro ao carregar manifestações do backend:", error);
            
            // Fallback para localStorage se o backend falhar
            const STATUS = CrudService.STATUS_MANIFESTACAO;
            const TIPOS = CrudService.TIPOS_MANIFESTACAO;
            
            let dados = CrudService.getByEmail(usuario.email) || [];

            if (STATUS && TIPOS && dados.length === 0) { 
                if (usuario.email === 'funcionario@senai.br') {
                    dados = [
                        {
                            id: '2024001',
                            tipo: TIPOS.SUGESTAO,
                            dataCriacao: '2025-10-01T14:30:00.000Z',
                            status: STATUS.PENDENTE, 
                            descricao: 'Sugestão de melhoria para o refeitório.', 
                            respostaAdmin: null,
                            localIncidente: 'Refeitório Principal', 
                            usuarioEmail: 'funcionario@senai.br', 
                            visibilidade: 'admin',
                            contato: 'funcionario@senai.br'
                        },
                    {
                        id: '2024002',
                        tipo: TIPOS.ELOGIO,
                        dataCriacao: '2025-09-20T09:00:00.000Z',
                        status: STATUS.RESOLVIDO, 
                        descricao: 'Elogio ao instrutor de robótica.', 
                        respostaAdmin: 'Obrigado pelo feedback!',
                        localIncidente: 'Laboratório de Robótica', 
                        usuarioEmail: 'funcionario@senai.br', 
                        visibilidade: 'admin',
                        contato: 'funcionario@senai.br'
                    }
                ];
            }
        }

        const manifestacoesOrdenadas = dados.sort((a, b) => new Date(b.dataCriacao) - new Date(a.dataCriacao));
        setManifestacoes(manifestacoesOrdenadas);
        }
    };

    useEffect(() => {
        const storedUser = localStorage.getItem("usuarioLogado");
        let usuario = null;

        if (storedUser) {
            usuario = JSON.parse(storedUser);
        }
        
        if (!usuario) {
            alert("Você precisa estar logado para acessar esta página.");
            navigate("/");
            return;
        }

        
        const isFuncionario = usuario.email && 
                              usuario.email.toLowerCase().endsWith("@senai.br") &&
                              !usuario.email.toLowerCase().endsWith("@aluno.senai.br");

        if (!isFuncionario) {
            alert("Acesso restrito. Esta página é exclusiva para Funcionários.");
            navigate("/");
            return;
        }

        setUsuarioLogado(usuario);
       
        carregarManifestacoes(usuario); 
    }, [navigate]);

    const { total, pendente, emAnalise, resolvido, arquivado } = useMemo(() => {
        const counts = { total: 0, 'Pendente': 0, 'Em Análise': 0, 'Resolvido': 0, 'Arquivado': 0 };

        manifestacoes.forEach(m => {
            counts.total++;
            const statusReal = FUNCIONARIO_STATUS_MAP[m.status] || 'Pendente';
            counts[statusReal]++;
        });
        
        return {
            total: counts.total,
            pendente: counts['Pendente'],
            emAnalise: counts['Em Análise'],
            resolvido: counts['Resolvido'],
            arquivado: counts['Arquivado']
        };

    }, [manifestacoes, FUNCIONARIO_STATUS_MAP]);

    const renderManifestacaoCard = (item) => {
        const funcionarioStatus = getFuncionarioStatus(item.status);

        const statusClass = funcionarioStatus.replace(/\s/g, '-').toLowerCase();

        return React.createElement(
            'div',
            { key: item.id, className: 'manifestacao-card-item' },
            [
                React.createElement(
                    'div',
                    { className: 'manifestacao-card-info' },
                    [
                        React.createElement(
                            'div',
                            { className: 'tipo-e-data' },
                            [
                                React.createElement('span', { className: 'manifestacao-tipo' }, traduzirTipo(item.tipo)),
                                React.createElement('span', { className: 'manifestacao-data' }, formatarData(item.dataCriacao)),
                            ]
                        ),
                        React.createElement('span', { className: `manifestacao-status ${statusClass}` }, funcionarioStatus)
                    ]
                ),

                React.createElement('p', { className: 'manifestacao-problema' }, item.descricao || 'Descrição não fornecida.'),

                item.respostaAdmin && React.createElement(
                    'div',
                    { className: 'manifestacao-resposta' },
                    [
                        React.createElement('strong', null, 'Resposta:'),
                        React.createElement('p', null, item.respostaAdmin)
                    ]
                ),

                React.createElement('button', {
                    className: 'btn-ver-detalhes',
                    onClick: () => setItemVisualizando(item)
                }, 'Ver detalhes')
            ]
        );
    };


    if (!usuarioLogado) {
        
        return React.createElement('div', {className: 'funcionario-container'}, 'Carregando painel...');
    }

    return React.createElement(
        "div",
       
        { className: "funcionario-container" },
        React.createElement(FuncionarioHeader, { navigate: navigate, usuarioEmail: usuarioLogado.email }), 
        React.createElement('div', { className: 'linha-vermelha' }), 

        React.createElement(
            "div",
            
            { className: "funcionario-main-content-wrapper" },
            React.createElement(
                'div',
               
                { key: 'cards', className: 'funcionario-summary-cards' },
                [
                    { label: 'Total de Manifestações', value: total, className: 'card-total' },
                    { label: 'Em Análise', value: emAnalise, className: 'card-analise' },
                    { label: 'Resolvidas', value: resolvido, className: 'card-resolvidas' },
                ].map((item, index) =>
                    React.createElement(
                        'div',
                       
                        { key: index, className: `funcionario-card ${item.className}` },
                        [
                            React.createElement('p', null, item.label),
                            React.createElement('h3', null, item.value)
                        ]
                    )
                )
            ),

            React.createElement(
                'div',
                { key: 'manifestacoes-section', className: 'minhas-manifestacoes-section-wrapper' },
                [
                    React.createElement('div', { className: 'minhas-manifestacoes-card' }, [
                      
                        React.createElement('h3', null, 'Minhas Manifestações Registradas'), 
                        React.createElement('small', null, 'Visualize e acompanhe o status das manifestações que você registrou.'),

                        React.createElement(
                            'div',
                            {className: 'manifestacoes-list'},
                            manifestacoes.length === 0
                                ? React.createElement(
                                    "p",
                                    { className: "sem-registros" },
                                    "Você não tem manifestações registradas neste momento."
                                  )
                                : manifestacoes.map(renderManifestacaoCard)
                        )
                    ])
                ]
            ),
        ),
        React.createElement(Footer),
        React.createElement(DetalhesModal, { 
            item: itemVisualizando, 
            fecharVisualizacao: fecharVisualizacao,
            traduzirTipo: traduzirTipo,
            getFuncionarioStatus: getFuncionarioStatus 
        })
    );
}

export default Funcionario;
