const TIPOS_MANIFESTACAO = {
  // Corrigido para consistência
  RECLAMACAO: 'Reclamação',
  DENUNCIA: 'Denúncia',
  ELOGIO: 'Elogio', 
  SUGESTAO: 'Sugestão' 
};

const STORAGE_KEY = 'manifestacoes';

const gerarId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
};

const getAll = () => {
  const manifestacoes = localStorage.getItem(STORAGE_KEY);
  // Garante que os itens retornados tenham um ID, para componentes que dependem dele
  const lista = manifestacoes ? JSON.parse(manifestacoes) : [];
  
  return lista.map((m, index) => ({
      id: m.id || index + 1, // Adiciona ID se estiver faltando (para compatibilidade)
      ...m
  }));
};

const getByEmail = (email) => {
  const manifestacoes = getAll();
  return manifestacoes.filter(item => item.contato === email);
};

const getByTipo = (tipo) => {
  const manifestacoes = getAll();
  return manifestacoes.filter(item => item.tipo === tipo);
};

const getById = (id) => {
  const manifestacoes = getAll();
  // Busca estritamente pelo ID
  return manifestacoes.find(item => String(item.id) === String(id));
};

const create = (manifestacao) => {
  const manifestacoes = getAll();
  
  const novaManifestacao = {
    ...manifestacao,
    id: gerarId(),
    dataCriacao: new Date().toLocaleDateString('pt-BR'), // Usando formato pt-BR para exibição
    status: 'Pendente', // Corrigido para "Pendente" (com P maiúsculo)
    visibilidade: 'admin'
  };
  
  // Para salvar, removemos os IDs que foram adicionados pelo getAll, mantendo apenas a informação original
  // Mas como estamos no 'create', salvamos o item novo e a lista antiga sem a necessidade de re-filtrar
  manifestacoes.push(novaManifestacao);

  // Antes de salvar, removemos o ID temporário do novo objeto para manter o storage limpo
  const manifestacoesToSave = manifestacoes.map(({ id, ...rest }) => rest);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(manifestacoesToSave));
  
  // Retornamos o objeto COM ID para o React poder atualizar o estado
  return novaManifestacao;
};

// RENOMEADA para clareza (updateManifestacao)
const updateManifestacao = (id, dadosAtualizados) => {
  const manifestacoes = getAll();
  
  // Para atualizar, precisamos buscar pelo ID
  const index = manifestacoes.findIndex(item => String(item.id) === String(id)); 
  
  if (index === -1) return null;
  
  const manifestacaoAtualizada = {
    ...manifestacoes[index],
    ...dadosAtualizados,
    dataAtualizacao: new Date().toLocaleDateString('pt-BR')
  };
  
  manifestacoes[index] = manifestacaoAtualizada;
  
  // Prepara para salvar: remove IDs temporários antes de salvar no Storage
  const manifestacoesToSave = manifestacoes.map(({ id: itemID, ...rest }) => rest);
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(manifestacoesToSave));
  
  // Retorna o objeto COM ID
  return manifestacaoAtualizada;
};

// NOVA FUNÇÃO: Recebe a lista inteira de manifestações (após atualização em tela) e salva no Storage.
// É um método de "salvar tudo" esperado pelo seu painel Admin.
const updateManifestacoes = (listaManifestacoesAtualizada) => {
    // 1. Remove os IDs temporários (que o React usa)
    const manifestacoesToSave = listaManifestacoesAtualizada.map(({ id, ...rest }) => rest);
    
    // 2. Salva a lista limpa no localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(manifestacoesToSave));
};


const remove = (id) => {
  const manifestacoes = getAll();
  const novaLista = manifestacoes.filter(item => String(item.id) !== String(id)); 
  
  if (novaLista.length === manifestacoes.length) return false;
  
  // Prepara para salvar: remove IDs temporários antes de salvar no Storage
  const manifestacoesToSave = novaLista.map(({ id: itemID, ...rest }) => rest);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(manifestacoesToSave));
  return true;
};

// ... Funções de Visibilidade (MANTIDAS) ...
const getVisibleForUser = (userType) => {
  const manifestacoes = getAll();
  
  if (userType === 'Administrador') {
    return manifestacoes;
  }
  
  return manifestacoes.filter(item => 
    item.visibilidade === 'todos' || 
    item.visibilidade === userType.toLowerCase()
  );
};

const changeVisibility = (id, visibilidade) => {
  const manifestacoes = getAll();
  const index = manifestacoes.findIndex(item => String(item.id) === String(id)); 
  
  if (index === -1) return false;
  
  manifestacoes[index].visibilidade = visibilidade;
  
  const manifestacoesToSave = manifestacoes.map(({ id: itemID, ...rest }) => rest);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(manifestacoesToSave));
  
  return true;
};


const CrudService = {
  TIPOS_MANIFESTACAO,
  getAll,
  getByTipo,
  getById,
  getByEmail,
  getVisibleForUser,
  changeVisibility,
  create,
  update: updateManifestacao, // Nome original do método (para update singular)
  updateManifestacoes,      // <<-- NOVO MÉTODO (PARA O ADMIN)
  remove
};

export default CrudService;