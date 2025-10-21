import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { manifestacoesService } from '../../services/manifestacoesService';
import '../Denuncia/Denuncia.css';
import Footer from '../../Components/Footer';
import HeaderSimples from '../../Components/HeaderSimples';
import SetaVoltar from '../../Components/SetaVoltar';

function Denuncia() {
  const navigate = useNavigate();

  const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));

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
  const [anexoBase64, setAnexoBase64] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (usuarioLogado) {
      setFormData(prevState => ({
        ...prevState,
        nome: usuarioLogado.nome || '',
        contato: usuarioLogado.email || '',
      }));
    }
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
      setAnexoBase64(null);
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
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        setAnexoBase64(reader.result);
      };
      reader.onerror = (error) => {
        console.error('Erro ao ler o arquivo:', error);
        setAnexoBase64(null);
      };
    } else {
      setPreviewUrl(null);
      setAnexoBase64(null);
    }
  };

  const validarCamposComuns = () => {
    if (!formData.descricao) {
      alert('Por favor, preencha a descrição detalhada da denúncia.');
      return false;
    }
    if (!formData.local) {
      alert('Por favor, preencha o local do incidente.');
      return false;
    }
    if (!formData.dataHora) {
      alert('Por favor, preencha a data e hora do incidente.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validarCamposComuns()) return;
    if (!formData.contato) {
      alert('Para envio identificado, o E-mail ou Telefone é obrigatório.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const denuncia = {
        local: formData.local,
        dataHora: manifestacoesService.formatarDataHora(formData.dataHora),
        descricaoDetalhada: formData.descricao,
        caminhoAnexo: formData.anexo ? formData.anexo.name : null
      };

      await manifestacoesService.criarDenuncia(denuncia);
      alert('Denúncia enviada com sucesso!');
      navigate('/confirmacao');
    } catch (err) {
      console.error('Erro ao enviar denúncia:', err);
      setError('Erro ao enviar denúncia. Tente novamente.');
      alert('Erro ao enviar denúncia. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnonimoSubmit = async (e) => {
    e.preventDefault();

    if (!validarCamposComuns()) return;

    setLoading(true);
    setError('');

    try {
      const denuncia = {
        local: formData.local,
        dataHora: manifestacoesService.formatarDataHora(formData.dataHora),
        descricaoDetalhada: formData.descricao,
        caminhoAnexo: formData.anexo ? formData.anexo.name : null
      };

      await manifestacoesService.criarDenuncia(denuncia);
      alert('Denúncia anônima enviada com sucesso!');
      navigate('/confirmacao');
    } catch (err) {
      console.error('Erro ao enviar denúncia anônima:', err);
      setError('Erro ao enviar denúncia. Tente novamente.');
      alert('Erro ao enviar denúncia. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return React.createElement(
    'div',
    { className: 'denuncia-container' },
    React.createElement(HeaderSimples, null),
    React.createElement(SetaVoltar, null),
    React.createElement(
      'div',
      { className: 'denuncia-content' },
      React.createElement('h2', { className: 'titulo-pagina' }, 'Faça uma denúncia'),
      React.createElement(
        'div',
        { className: 'instrucoes-preenchimento' },
        React.createElement('p', null, React.createElement('strong', null, '* Campos Obrigatórios')),
        React.createElement('p', null, '* Tamanho máximo para Anexar arquivo: 5 Megabytes.'),
        React.createElement('p', null, 'Explique em quais casos a denúncia pode ser feita e reforce a confidencialidade do processo.')
      ),
      React.createElement(
        'div',
        { className: 'form-box' },
        React.createElement(
          'form',
          { className: 'formulario-denuncia', onSubmit: handleSubmit },
          React.createElement('label', null, 'Nome (opcional)'),
          React.createElement('input', {
            type: 'text',
            name: 'nome',
            value: formData.nome,
            onChange: handleChange,
            placeholder: 'Nome completo (se logado, já estará preenchido)'
          }),
          React.createElement('label', null, 'E-mail ou Telefone *'),
          React.createElement('input', {
            type: 'text',
            name: 'contato',
            value: formData.contato,
            onChange: handleChange,
            placeholder: 'E-mail ou Telefone (obrigatório para envio identificado)',
            required: true
          }),
          React.createElement('label', null, 'Setor de Destino *'),
          React.createElement('select', {
            name: 'setor',
            value: formData.setor,
            onChange: handleChange,
            required: true
          },
            React.createElement('option', { key: 'geral', value: 'Geral' }, 'Outro / Geral'),
            React.createElement('option', { key: 'info', value: 'Informatica' }, 'Informática'),
            React.createElement('option', { key: 'mec', value: 'Mecanica' }, 'Mecânica'),
            React.createElement('option', { key: 'fac', value: 'Faculdade' }, 'Faculdade')
          ),
          React.createElement('label', null, 'Local do incidente *'),
          React.createElement('input', {
            type: 'text',
            name: 'local',
            value: formData.local,
            onChange: handleChange,
            placeholder: 'Ex: Sala B-10, Pátio, Oficina de Mecânica...',
            required: true
          }),
          React.createElement('label', null, 'Data e Hora do incidente *'),
          React.createElement('input', {
            type: 'datetime-local',
            name: 'dataHora',
            value: formData.dataHora,
            onChange: handleChange,
            required: true
          }),
          React.createElement('label', null, 'Descrição detalhada da denúncia *'),
          React.createElement(
            'div',
            { className: 'textarea-container' },
            React.createElement('textarea', {
              name: 'descricao',
              value: formData.descricao,
              onChange: handleChange,
              rows: 6,
              placeholder: 'Descreva detalhadamente o ocorrido...',
              required: true
            }),
            React.createElement(
              'label',
              { htmlFor: 'file-upload-denuncia', className: 'custom-file-upload' },
              React.createElement('img', {
                src: require('../../assets/imagens/icone-anexo.png'),
                alt: 'Anexar',
                className: 'icone-anexar'
              })
            ),
            React.createElement('input', {
              id: 'file-upload-denuncia',
              type: 'file',
              onChange: handleFileChange,
              style: { display: 'none' }
            }),
            formData.anexo &&
              React.createElement(
                'p',
                { className: 'arquivo-selecionado' },
                'Arquivo selecionado: ',
                formData.anexo.name
              ),
            previewUrl &&
              React.createElement('img', {
                src: previewUrl,
                alt: 'Preview do anexo',
                style: { marginTop: '10px', maxWidth: '100%', maxHeight: '300px', borderRadius: '4px' }
              })
          ),
          React.createElement('small', null, 'Atenção: Evite compartilhar imagens que possam comprometer sua segurança ou de outra pessoa.'),
          error && React.createElement('p', { style: { color: 'red', textAlign: 'center', marginTop: '10px' } }, error),
          React.createElement(
            'div',
            { style: { display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '15px' } },
            React.createElement(
              'button',
              { type: 'submit', className: 'btn-confirmar', disabled: loading },
              loading ? 'Enviando...' : 'Confirmar'
            ),
            React.createElement(
              'button',
              {
                type: 'button',
                className: 'btn-confirmar',
                style: { backgroundColor: '#666' },
                onClick: handleAnonimoSubmit,
                disabled: loading
              },
              loading ? 'Enviando...' : 'Enviar Anônimo'
            )
          )
        )
      )
    ),
    React.createElement(Footer, null)
  );
}

export default Denuncia;
