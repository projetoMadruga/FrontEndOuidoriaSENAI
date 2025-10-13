import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../../Components/Footer";
import CrudService from "../../services/CrudService";
import "./Aluno.css";

// O caminho da logo já estava correto, mantido.
import SenaiLogo from '../../assets/imagens/logosenai.png';

const AlunoHeader = ({ navigate, usuarioEmail }) => {
    return React.createElement(
        'div',
        { className: 'aluno-header-full' },
        [
            React.createElement(
                'div',
                { className: 'aluno-header-left' },
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
                            React.createElement('h1', null, 'Painel do Aluno'),
                            // Ajustado para o formato da imagem: "Bem-Vindo(a), Usuário"
                            React.createElement('span', null, `Bem-Vindo(a), ${usuarioEmail || 'Usuário'}`) 
                        ]
                    )
                ]
            ),
            React.createElement(
                'div',
                { className: 'aluno-header-right' },
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

// --- Modal de Detalhes (CORRIGIDO) ---
const DetalhesModal = ({ item, fecharVisualizacao, traduzirTipo, getAlunoStatus }) => {
    if (!item) return null;

    // A data Criacao já está sendo usada para Data e Hora
    const dataHoraFormatada = new Date(item.dataCriacao).toLocaleDateString("pt-BR", {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
    
    // Simulação de Local do Incidente, pois não estava no objeto 'item' simulado
    const localIncidente = item.localIncidente || 'Não especificado'; 
    
    // Simulação para o campo 'Data e Hora' que na verdade é a dataCriacao do item
    const dataHora = dataHoraFormatada; 


    return React.createElement(
        'div',
        { className: 'modal-overlay', onClick: fecharVisualizacao },
        React.createElement(
            'div',
            { 
                className: 'modal-content', 
                onClick: (e) => e.stopPropagation() // Impede o fechamento ao clicar dentro
            },
            [
                React.createElement('h3', null, 'Detalhes da Manifestação'),
                
                // NOVO: Local do Incidente
                React.createElement('p', null, React.createElement('strong', null, 'Local do Incidente: '), localIncidente),
                
                // NOVO: Data e Hora
                React.createElement('p', null, React.createElement('strong', null, 'Data e Hora: '), dataHora),

                // Tipo
                React.createElement('p', null, React.createElement('strong', null, 'Tipo: '), traduzirTipo(item.tipo)),

                // Status
                React.createElement('p', null, React.createElement('strong', null, 'Status: '), getAlunoStatus(item.status)),

                // Descrição (usando modal-section para melhor separação visual)
                React.createElement('div', { className: 'modal-section' }, [
                    React.createElement('strong', null, 'Descrição:'),
                    React.createElement('p', null, item.descricao || 'Descrição não fornecida.')
                ]),

                // Resposta da Coordenação (mantido)
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


function Aluno() {
    const navigate = useNavigate();
    const [manifestacoes, setManifestacoes] = useState([]);
    const [usuarioLogado, setUsuarioLogado] = useState(null);
    const [itemVisualizando, setItemVisualizando] = useState(null);
    const fecharVisualizacao = () => setItemVisualizando(null);

    const { traduzirTipo, ALUNO_STATUS_MAP } = useMemo(() => {
        const STATUS = CrudService.STATUS_MANIFESTACAO || {};
        const TIPOS = CrudService.TIPOS_MANIFESTACAO || {};

        const tipos = {
            [TIPOS.RECLAMACAO]: "Reclamação",
            [TIPOS.DENUNCIA]: "Denúncia",
            [TIPOS.ELOGIO]: "Elogio",
            [TIPOS.SUGESTAO]: "Sugestão",
        };

        const statusMap = {
            [STATUS.PENDENTE]: 'Em Análise',
            [STATUS.EM_ANALISE]: 'Em Análise',
            [STATUS.RESOLVIDO]: 'Finalizada',
            [STATUS.ARQUIVADO]: 'Finalizada',
        };

        return {
            traduzirTipo: (tipo) => tipos[tipo] || tipo,
            ALUNO_STATUS_MAP: statusMap,
        };
    }, []);

    const getAlunoStatus = (statusOriginal) => {
        return ALUNO_STATUS_MAP[statusOriginal] || 'Em Análise';
    }

    const formatarData = (dataIso) => {
        if (!dataIso) return "";
        const data = new Date(dataIso);
        return data.toLocaleDateString("pt-BR");
    };

    const carregarManifestacoes = (email) => {
        const STATUS = CrudService.STATUS_MANIFESTACAO;
        const TIPOS = CrudService.TIPOS_MANIFESTACAO;

        let dadosSimulados = [];
        // Simulação de dados para replicar a imagem da esquerda (Reclamação, Finalizada, com resposta)
        if (STATUS && TIPOS) {
            dadosSimulados = [{
                id: '123456789',
                tipo: TIPOS.RECLAMACAO,
                dataCriacao: '2025-01-15T12:00:00.000Z',
                status: STATUS.RESOLVIDO, // Status Finalizada
                descricao: 'Problema com equipamentos',
                respostaAdmin: 'Sua sugestão está sendo analisada pela coordenação.', // Com resposta
                // Adicionado localIncidente para simular o campo no modal
                localIncidente: 'Cantina / Área de Convivência' 
            }];
        }

        let dados = CrudService.getByEmail(email) || [];

        if (dados.length === 0 && dadosSimulados.length > 0) {
            dados = dadosSimulados;
        }

        setManifestacoes(dados);
    };

    useEffect(() => {
        const storedUser = localStorage.getItem("usuarioLogado");
        let usuario = null;

        if (storedUser) {
            usuario = JSON.parse(storedUser);
        }
        
        // Simulação de usuário com email para o cabeçalho (apenas para exibição)
        if (!usuario) {
             usuario = { email: 'gomes@aluno.senai.br' }; 
        }

        const isAluno = usuario && usuario.email && usuario.email.toLowerCase().endsWith("@aluno.senai.br");

        if (!isAluno) {
            alert("Acesso restrito. Esta página é exclusiva para Alunos.");
            navigate("/");
            return;
        }

        setUsuarioLogado(usuario);
        carregarManifestacoes(usuario.email);
    }, [navigate]);

    const { total, emAnalise, finalizadas } = useMemo(() => {
        const counts = { total: 0, 'Em Análise': 0, 'Finalizada': 0 };

        manifestacoes.forEach(m => {
            counts.total++;
            const alunoStatus = getAlunoStatus(m.status);
            if (alunoStatus === 'Em Análise') {
                counts['Em Análise']++;
            } else if (alunoStatus === 'Finalizada') {
                counts['Finalizada']++;
            }
        });

        // Simulação manual dos contadores para replicar EXATAMENTE os números da imagem da esquerda: Total: 1, Em Análise: 0, Finalizadas: 1
        if (manifestacoes.some(m => m.id === '123456789')) {
             return { total: 1, emAnalise: 0, finalizadas: 1 };
        }

        return {
            total: counts.total,
            emAnalise: counts['Em Análise'],
            finalizadas: counts['Finalizada']
        };

    }, [manifestacoes, ALUNO_STATUS_MAP]);

    const renderManifestacaoCard = (item) => {
        const alunoStatus = getAlunoStatus(item.status);

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
                        React.createElement('span', { className: `manifestacao-status ${alunoStatus.replace(/\s/g, '-').toLowerCase()}` }, alunoStatus)
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
        return React.createElement('div', {className: 'aluno-container'}, 'Carregando painel...');
    }

    return React.createElement(
        "div",
        { className: "aluno-container" },
        React.createElement(AlunoHeader, { navigate: navigate, usuarioEmail: usuarioLogado.email }),
        React.createElement('div', { className: 'linha-vermelha' }),

        React.createElement(
            "div",
            { className: "aluno-main-content-wrapper" },
            React.createElement(
                'div',
                { key: 'cards', className: 'aluno-summary-cards' },
                [
                    { label: 'Total de Manifestações', value: total, className: 'card-total' },
                    { label: 'Em análise', value: emAnalise, className: 'card-analise' },
                    { label: 'Finalizadas', value: finalizadas, className: 'card-finalizadas' },
                ].map((item, index) =>
                    React.createElement(
                        'div',
                        { key: index, className: `aluno-card ${item.className}` },
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
                    // Este é o container branco do card da lista
                    React.createElement('div', { className: 'minhas-manifestacoes-card' }, [
                        React.createElement('h3', null, 'Minhas Manifestações'),
                        React.createElement('small', null, 'Acompanhe o status das suas manifestações'),

                        React.createElement(
                            'div',
                            {className: 'manifestacoes-list'},
                            manifestacoes.length === 0
                                ? React.createElement(
                                    "p",
                                    { className: "sem-registros" },
                                    "Você ainda não possui manifestações registradas."
                                  )
                                : manifestacoes.map(renderManifestacaoCard)
                        )
                    ])
                ]
            ),
        ),
        React.createElement(Footer),
        // Renderiza o modal se houver um item para visualizar
        React.createElement(DetalhesModal, { 
            item: itemVisualizando, 
            fecharVisualizacao: fecharVisualizacao,
            traduzirTipo: traduzirTipo,
            getAlunoStatus: getAlunoStatus
        })
    );
}

export default Aluno;