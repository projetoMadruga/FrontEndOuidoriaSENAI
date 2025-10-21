import { api } from './api';

// Função para construir URL (copiada do api.js)
const buildUrl = (path) => {
  const API_BASE = process.env.REACT_APP_API_BASE || "";
  if (!API_BASE) return path; // fallback for local dev
  if (path.startsWith("http")) return path;
  const base = API_BASE.endsWith("/") ? API_BASE.slice(0, -1) : API_BASE;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
};

export const manifestacoesService = {
  /**
   * Busca todas as manifestações do usuário logado ou todas se for admin
   */
  async listarManifestacoes() {
    try {
      const response = await fetch(buildUrl("/manifestacoes"), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`
        }
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Erro ao buscar manifestações:", error);
      throw error;
    }
  },

  /**
   * Busca manifestações por tipo (apenas para admins)
   */
  async listarManifestacoesPorTipo(tipo) {
    try {
      const response = await fetch(buildUrl(`/manifestacoes/tipo/${tipo}`), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`
        }
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Erro ao buscar manifestações do tipo ${tipo}:`, error);
      throw error;
    }
  },

  /**
   * Busca uma manifestação específica por ID
   */
  async buscarManifestacaoPorId(id) {
    try {
      const response = await fetch(buildUrl(`/manifestacoes/${id}`), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`
        }
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Erro ao buscar manifestação ${id}:`, error);
      throw error;
    }
  },

  /**
   * Busca todos os usuários (apenas para admins)
   */
  async listarUsuarios() {
    try {
      const response = await fetch(buildUrl("/login/usuarios"), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`
        }
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      throw error;
    }
  },

  /**
   * Formata o status para exibição
   */
  formatarStatus(status) {
    const statusMap = {
      'PENDENTE': 'Em Análise',
      'EM_ANALISE': 'Em Análise',
      'RESOLVIDA': 'Finalizada',
      'FINALIZADA': 'Finalizada',
      'CANCELADA': 'Cancelada'
    };
    return statusMap[status] || status;
  },

  /**
   * Formata o tipo para exibição
   */
  formatarTipo(tipo) {
    const tipoMap = {
      'RECLAMACAO': 'Reclamação',
      'DENUNCIA': 'Denúncia',
      'ELOGIO': 'Elogio',
      'SUGESTAO': 'Sugestão'
    };
    return tipoMap[tipo] || tipo;
  },

  /**
   * Formata a data para exibição
   */
  formatarData(dataHora) {
    if (!dataHora) return 'Data não informada';
    
    try {
      const data = new Date(dataHora);
      return data.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dataHora;
    }
  },

  /**
   * Atualiza uma manifestação (apenas para admins)
   */
  async atualizarManifestacao(id, dadosAtualizados) {
    try {
      const response = await fetch(buildUrl(`/manifestacoes/${id}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`
        },
        body: JSON.stringify(dadosAtualizados)
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Erro ao atualizar manifestação ${id}:`, error);
      throw error;
    }
  },

  /**
   * Deleta uma manifestação (apenas para admins)
   */
  async deletarManifestacao(id) {
    try {
      const response = await fetch(buildUrl(`/manifestacoes/${id}`), {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`
        }
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      return true; // Sucesso
    } catch (error) {
      console.error(`Erro ao deletar manifestação ${id}:`, error);
      throw error;
    }
  }
};