import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Modal.css";
import logosenai from "../assets/imagens/logosenai.png";
import boneco from "../assets/imagens/boneco.png";
import cadeado from "../assets/imagens/cadeado.png";
import { api } from "../services/api";

function ModalCadastro({ isOpen, onClose }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState(""); 
  const [cpf, setCpf] = useState("");     
  const [curso, setCurso] = useState("");
  const [setor, setSetor] = useState(""); // Mantendo o setor, mas será populado por 'curso'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mouseDownTarget, setMouseDownTarget] = useState(null);
  const navigate = useNavigate();

  if (!isOpen) return null;

  const redirecionarPorEmail = (email) => {
    if (email === "pino@docente.senai.br" || email === "pino@senai.br" || email === "carlos.pino@sp.senai.br") return navigate("/admin/adm-mec");
    if (email === "chile@docente.senai.br" || email === "chile@senai.br" || email === "jsilva@sp.senai.br") return navigate("/admin/adm-info");
    if (email === "diretor@senai.br") return navigate("/admin");
    if (email === "vieira@docente.senai.br" || email === "vieira@senai.br" || email === "alexandre.vieira@sp.senai.br") return navigate("/admin/adm-fac");
    
    if (email.endsWith("@aluno.senai.br")) return navigate("/aluno");
    
    if (email.endsWith("@senai.br") || email.endsWith("@docente.senai.br") || email.endsWith("@sp.senai.br") || email.endsWith("@portalsesisp.org.br")) return navigate("/funcionario");
    
    alert("E-mail não autorizado.");
  };

  const handleCadastro = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let cargoUsuario = "FUNCIONARIO";
      if (email.endsWith("@aluno.senai.br")) {
        cargoUsuario = "ALUNO";
      }
      
      // Valida apenas se for @aluno.senai.br, outros domínios são permitidos
      if (email.endsWith("@aluno.senai.br")) {
        // Email de aluno é válido
      } else if (!email.includes("@")) {
        setError("E-mail inválido");
        setLoading(false);
        return;
      }
      // Qualquer outro email com @ é permitido

      // Se for funcionário, o valor de 'curso' deve ser salvo em 'setor' para o backend (se ele exigir).
      // Se for aluno, o valor de 'curso' continua sendo 'curso'.
      // Aqui, enviamos apenas 'curso', se o backend precisar de 'setor' para FUNCIONARIO, precisamos renomear a variável.
      
      const dataToSend = {
          emailEducacional: email,
          senha: senha,
          cargoUsuario: cargoUsuario
      };
      
      // Se o backend exige campo extra, ele é adicionado aqui:
      if (cargoUsuario === "ALUNO") {
          dataToSend.curso = curso;
      } else {
          // Se o backend aceita 'setor' ou outra coisa para funcionário, ajuste a linha abaixo.
          // Por enquanto, vou remover qualquer envio extra para o backend para evitar o erro 400.
          // Se o 400 persistir, precisaremos saber o nome do campo que o backend espera.
      }


      await api.post("/login/cadastrar", dataToSend);

      const loginResponse = await api.post("/login/autenticar", {
        emailEducacional: email,
        senha: senha
      });

      if (loginResponse.token) {
        localStorage.setItem("authToken", loginResponse.token);
      }
      if (loginResponse.refreshToken) {
        localStorage.setItem("refreshToken", loginResponse.refreshToken);
      }

      // Salvamos o valor selecionado (curso/setor) em infoAdicional para referência futura
      localStorage.setItem("usuarioLogado", JSON.stringify({ 
          email, 
          nome, 
          infoAdicional: curso // O campo 'curso' armazena o valor selecionado para ambos
      }));

      alert("Cadastro realizado com sucesso!");
      redirecionarPorEmail(email);
      
      setNome(""); 
      setEmail(""); 
      setSenha(""); 
      setTelefone(""); 
      setCpf(""); 
      setCurso("");
      setSetor("");
      onClose();
    } catch (err) {
      console.error("Erro no cadastro:", err);
      
      if (err.status === 400) {
        try {
          const errorText = await err.text();
          setError(errorText);
        } catch {
          setError("Dados inválidos. Verifique os campos.");
        }
      } else if (err.status === 409) {
        setError("E-mail já cadastrado!");
      } else {
        setError("Erro ao conectar com o servidor. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayMouseDown = (e) => {
    setMouseDownTarget(e.target);
  };

  const handleOverlayClick = (e) => {
    if (e.target === mouseDownTarget && e.target.className === "modal-overlay") {
      onClose();
    }
  };

  return React.createElement(
    "div",
    { 
      className: "modal-overlay", 
      onMouseDown: handleOverlayMouseDown,
      onClick: handleOverlayClick 
    },
    React.createElement(
      "div",
      { className: "modal-container", onClick: (e) => e.stopPropagation() },
      React.createElement("button", { className: "close-btn", onClick: onClose }, "×"),
      React.createElement("img", { src: logosenai, alt: "Logo SENAI", className: "logo-senai-modal" }),
      React.createElement("div", { className: "linha-vermelha" }),
      React.createElement("h2", { className: "titulo-principal" }, "Cadastro"),
      error && React.createElement("div", { className: "error-message", style: { color: "red", marginBottom: "10px", textAlign: "center" } }, error),
      React.createElement(
        "form",
        { onSubmit: handleCadastro },
        React.createElement(
          "div",
          { className: "input-icon-container" },
          React.createElement("img", { src: boneco, alt: "nome" }),
          React.createElement("input", {
            type: "text",
            placeholder: "Nome Completo",
            value: nome,
            onChange: (e) => setNome(e.target.value),
            required: true,
          })
        ),
        React.createElement(
          "div",
          { className: "input-icon-container" },
          React.createElement("img", { src: boneco, alt: "cpf" }),
          React.createElement("input", {
            type: "text",
            placeholder: "CPF (Somente números)",
            value: cpf,
            onChange: (e) => setCpf(e.target.value.replace(/\D/g, '').substring(0, 11)),
            required: true,
            maxLength: 11
          })
        ),
        React.createElement(
          "div",
          { className: "input-icon-container" },
          React.createElement("img", { src: boneco, alt: "telefone" }),
          React.createElement("input", {
            type: "tel",
            placeholder: "Telefone (ex: 11987654321)",
            value: telefone,
            onChange: (e) => setTelefone(e.target.value.replace(/\D/g, '').substring(0, 11)),
            required: true,
            maxLength: 11
          })
        ),
        React.createElement(
          "div",
          { className: "input-icon-container" },
          React.createElement("img", { src: boneco, alt: "email" }),
          React.createElement("input", {
            type: "email",
            placeholder: "E-mail institucional SENAI",
            value: email,
            onChange: (e) => setEmail(e.target.value),
            required: true,
          })
        ),
        email.length > 0 && React.createElement(
          "div",
          { className: "input-icon-container" },
          React.createElement("img", { src: boneco, alt: "curso/setor" }),
          React.createElement("select", {
            value: curso,
            onChange: (e) => setCurso(e.target.value),
            required: true,
            style: { width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }
          }, [
            React.createElement("option", { key: "default", value: "" }, email.endsWith("@aluno.senai.br") ? "Selecione seu curso" : "Selecione seu Setor"),
            React.createElement("option", { key: "ads", value: "ADS" }, "Análise e Desenvolvimento de Sistemas"),
            React.createElement("option", { key: "redes", value: "Redes" }, "Redes de Computadores"),
            React.createElement("option", { key: "mecanica", value: "Mecânica" }, "Mecânica"),
            React.createElement("option", { key: "manufatura", value: "Manufatura Digital" }, "Manufatura Digital"),
            React.createElement("option", { key: "faculdade", value: "Faculdade" }, "Faculdade SENAI"),
            React.createElement("option", { key: "outros", value: "Outros" }, "Outros Setores"),
          ])
        ),
        React.createElement(
          "div",
          { className: "input-icon-container password-container" },
          React.createElement("img", { src: cadeado, alt: "senha" }),
          React.createElement("input", {
            type: mostrarSenha ? "text" : "password",
            placeholder: "Senha (mínimo 8 caracteres)",
            value: senha,
            onChange: (e) => setSenha(e.target.value),
            required: true,
            minLength: 8
          }),
          React.createElement("button", {
            type: "button",
            className: "toggle-password-btn",
            onClick: () => setMostrarSenha(!mostrarSenha),
            "aria-label": mostrarSenha ? "Ocultar senha" : "Mostrar senha"
          }, "👁️‍🗨️")
        ),
        React.createElement(
          "button",
          { type: "submit", className: "submit-btn", disabled: loading },
          loading ? "Cadastrando..." : "Cadastrar"
        )
      )
    )
  );
}

export default ModalCadastro;