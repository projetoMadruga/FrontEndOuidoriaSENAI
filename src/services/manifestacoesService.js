import { api } from "./api";

/**
 * Serviço para gerenciar manifestações (Reclamações, Denúncias, Elogios, Sugestões)
 * Integrado com o back-end Azure
 */

const manifestacoesService = {
  // ==================== RECLAMAÇÕES ====================
  
  async criarReclamacao(dados) {
    const payload = {
      dataHora: dados.dataHora,
      local: dados.local,
      descricaoDetalhada: dados.descricaoDetalhada,
      tipoReclamacao: dados.tipoReclamacao || "GERAL", // GERAL, INFORMATICA, MECANICA, FACULDADE
      caminhoAnexo: dados.caminhoAnexo || null
    };
    
    return await api.post("/reclamacoes", payload);
  },

  async listarReclamacoes() {
    return await api.get("/reclamacoes");
  },

  async buscarReclamacao(id) {
    return await api.get(`/reclamacoes/${id}`);
  },

  async atualizarReclamacao(id, dados) {
    return await api.put(`/reclamacoes/${id}`, dados);
  },

  async deletarReclamacao(id) {
    return await api.del(`/reclamacoes/${id}`);
  },

  async atualizarStatusReclamacao(id, status, observacao) {
    return await api.patch(`/reclamacoes/${id}/status`, null, {
      params: { status, observacao }
    });
  },

  // ==================== DENÚNCIAS ====================
  
  async criarDenuncia(dados) {
    const payload = {
      local: dados.local,
      dataHora: dados.dataHora,
      descricaoDetalhada: dados.descricaoDetalhada,
      caminhoAnexo: dados.caminhoAnexo || null
    };
    
    return await api.post("/denuncias", payload);
  },

  async listarDenuncias() {
    return await api.get("/denuncias");
  },

  async buscarDenuncia(id) {
    return await api.get(`/denuncias/${id}`);
  },

  async atualizarDenuncia(id, dados) {
    return await api.put(`/denuncias/${id}`, dados);
  },

  async deletarDenuncia(id) {
    return await api.del(`/denuncias/${id}`);
  },

  // ==================== ELOGIOS ====================
  
  async criarElogio(dados) {
    const payload = {
      local: dados.local,
      dataHora: dados.dataHora,
      descricaoDetalhada: dados.descricaoDetalhada,
      caminhoAnexo: dados.caminhoAnexo || null
    };
    
    return await api.post("/elogios", payload);
  },

  async listarElogios() {
    return await api.get("/elogios");
  },

  async buscarElogio(id) {
    return await api.get(`/elogios/${id}`);
  },

  async atualizarElogio(id, dados) {
    return await api.put(`/elogios/${id}`, dados);
  },

  async deletarElogio(id) {
    return await api.del(`/elogios/${id}`);
  },

  // ==================== SUGESTÕES ====================
  
  async criarSugestao(dados) {
    const payload = {
      local: dados.local,
      dataHora: dados.dataHora,
      descricaoDetalhada: dados.descricaoDetalhada,
      caminhoAnexo: dados.caminhoAnexo || null
    };
    
    return await api.post("/sugestoes", payload);
  },

  async listarSugestoes() {
    return await api.get("/sugestoes");
  },

  async buscarSugestao(id) {
    return await api.get(`/sugestoes/${id}`);
  },

  async atualizarSugestao(id, dados) {
    return await api.put(`/sugestoes/${id}`, dados);
  },

  async deletarSugestao(id) {
    return await api.del(`/sugestoes/${id}`);
  },

  // ==================== HELPERS ====================
  
  /**
   * Mapeia o setor do front-end para o enum do back-end
   * Enum aceito: MANUTENCAO, ADMINISTRACAO
   */
  mapearSetor(setor) {
    const mapeamento = {
      "Geral": "ADMINISTRACAO",
      "Informatica": "MANUTENCAO",
      "Mecanica": "MANUTENCAO",
      "Faculdade": "ADMINISTRACAO"
    };
    return mapeamento[setor] || "ADMINISTRACAO";
  },

  /**
   * Formata data e hora para o formato esperado pelo back-end
   */
  formatarDataHora(dataHoraLocal) {
    // Converte de datetime-local (YYYY-MM-DDTHH:mm) para o formato do back-end
    if (!dataHoraLocal) return new Date().toISOString();
    return new Date(dataHoraLocal).toISOString();
  }
};

export default manifestacoesService;
