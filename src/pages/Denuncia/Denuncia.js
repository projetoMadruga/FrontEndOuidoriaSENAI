import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { manifestacoesService } from '../../services/manifestacoesService';
import '../Denuncia/Denuncia.css';

import Footer from '../../Components/Footer';
import HeaderSimples from '../../Components/HeaderSimples';
import SetaVoltar from '../../Components/SetaVoltar';

function Denuncia() {
  const navigate = useNavigate();

  const getUsuarioLogado = () => {
    try {
      const usuarioLogado = localStorage.getItem('usuarioLogado');
      return usuarioLogado ? JSON.parse(usuarioLogado) : null;
    } catch (e) {
      return null;
    }
  };

  const usuarioLogado = getUsuarioLogado();

  const [formData, setFormData] = useState({
    nome: '',
    contato: '',
    setor: 'Geral',
    local: '',
    dataHora: '',
    descricao: '',
    anexo: null
  });

  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAnonimo, setIsAnonimo] = useState(false);

  useEffect(() => {
    if (usuarioLogado) {
      setFormData(prevState => ({
        ...prevState,
        nome: usuarioLogado.nome || '',
        contato: usuarioLogado.email || '',
      }));
    }
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setFormData(prevState => ({ ...prevState, anexo: null }));
      setPreviewUrl(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('O arquivo é muito grande. O tamanho máximo é 5MB.');
      e.target.value = '';
      setFormData(prevState => ({ ...prevState, anexo: null }));
      setPreviewUrl(null);
      return;
    }

    setFormData(prevState => ({
      ...prevState,
      anexo: file
    }));

    if (file.type.startsWith('image/')) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const validarCamposComuns = () => {
    if (!formData.descricao.trim()) {
      alert('Por favor, preencha a descrição detalhada da denúncia.');
      return false;
    }
    if (!formData.local.trim()) {
      alert('Por favor, preencha o local do incidente.');
      return false;
    }
    if (!formData.dataHora) {
      alert('Por favor, preencha a data e hora do incidente.');
      return false;
    }

    const dataIncidente = new Date(formData.dataHora);
    const dataAtual = new Date();

    if (dataIncidente > dataAtual) {
      alert('Erro: A data do incidente não pode ser futura.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e, isAnonimoSubmission = false) => {
    e.preventDefault();

    if (!validarCamposComuns()) return;

    if (!isAnonimoSubmission && !formData.contato) {
      alert('Para envio identificado, o E-mail ou Telefone é obrigatório.');
      return;
    }

    setIsAnonimo(isAnonimoSubmission);
    setLoading(true);
    setError('');

    try {
      const dadosDenuncia = {
        nome: isAnonimo ? '' : formData.nome,
        contato: isAnonimo ? '' : formData.contato,
        setor: manifestacoesService.mapearSetor(formData.setor),
        local: formData.local,
        dataHora: manifestacoesService.formatarDataHora(formData.dataHora),
        descricaoDetalhada: formData.descricao,
        anexo: formData.anexo
      };

      const formDataToSend = new FormData();

      Object.keys(dadosDenuncia).forEach(key => {
        if (key !== 'anexo') {
          formDataToSend.append(key, dadosDenuncia[key]);
        }
      });

      if (formData.anexo) {
        formDataToSend.append('anexo', formData.anexo, formData.anexo.name);
      }

      await manifestacoesService.criarDenuncia(formDataToSend);

      alert(`Denúncia ${isAnonimo ? 'anônima ' : ''}enviada com sucesso!`);
      navigate('/confirmacao');

    } catch (err) {
      console.error('Erro ao enviar denúncia:', err);
      setError('Erro ao enviar denúncia. Tente novamente.');
      alert('Erro ao enviar denúncia. Tente novamente.');
    } finally {
      setLoading(false);
      setIsAnonimo(false);
    }
  };

  return (
    <div className="denuncia-container">
      <HeaderSimples />
      <SetaVoltar />

      <div className="denuncia-content">
        <h2 className="titulo-pagina">Faça uma Denúncia</h2>

        <div className="instrucoes-preenchimento">
          <p><strong>* Campos Obrigatórios</strong></p>
          <p>* Tamanho máximo para Anexar arquivo: 5 Megabytes.</p>
        </div>

        <div className="form-box">
          <form className="formulario-denuncia" onSubmit={handleSubmit}>

            <label>Nome (opcional)</label>
            <input
              type="text"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              placeholder="Nome completo"
              disabled={isAnonimo}
            />

            <label>E-mail ou Telefone {!isAnonimo ? '*' : '(opcional)'}</label>
            <input
              type="text"
              name="contato"
              value={formData.contato}
              onChange={handleChange}
              placeholder="E-mail ou Telefone"
              disabled={isAnonimo}
              required={!isAnonimo}
            />

            <label>Setor de Destino *</label>
            <select name="setor" value={formData.setor} onChange={handleChange}>
              <option value="Geral">Outro / Geral</option>
              <option value="Informatica">Informática</option>
              <option value="Mecanica">Mecânica</option>
              <option value="Faculdade">Faculdade</option>
            </select>

            <label>Local do incidente *</label>
            <input
              type="text"
              name="local"
              value={formData.local}
              onChange={handleChange}
              placeholder="Local"
              required
            />

            <label>Data e Hora do incidente *</label>
            <input
              type="datetime-local"
              name="dataHora"
              value={formData.dataHora}
              onChange={handleChange}
              required
            />

            <label>Descrição detalhada *</label>
            <textarea
             type="text"
              name="descricao"
              value={formData.descricao}
              onChange={handleChange}
              placeholder="Escreva aqui detalhadamente o ocorrido..."
              rows={6}
              required
            />

            <label htmlFor="file-upload-denuncia" className="custom-file-upload">
              <img src={require('../../assets/imagens/icone-anexo.png')} alt="Anexar" className="icone-anexar" />
            </label>
            <input id="file-upload-denuncia" type="file" onChange={handleFileChange} hidden />

            {formData.anexo && <p>Arquivo selecionado: {formData.anexo.name}</p>}

            {previewUrl && (
              <img src={previewUrl} alt="preview" style={{ maxWidth: '100%', marginTop: '10px' }} />
            )}

            <div className="botoes-envio">
              <button type="submit" className="btn-confirmar" disabled={loading}>
                {loading && !isAnonimo ? 'Enviando...' : 'Confirmar'}
              </button>

              <button
                type="button"
                className="btn-confirmar"
                style={{ background: '#555' }}
                onClick={(e) => handleSubmit(e, true)}
              >
                {loading && isAnonimo ? 'Enviando...' : 'Enviar Anônimo'}
              </button>
            </div>

            {error && <p className="erro">{error}</p>}
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default Denuncia;
