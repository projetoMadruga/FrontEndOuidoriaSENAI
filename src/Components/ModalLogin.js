import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Modal.css";
import logosenai from "../assets/imagens/logosenai.png";
import boneco from "../assets/imagens/boneco.png";
import cadeado from "../assets/imagens/cadeado.png";
import { api } from "../services/api";

function ModalLogin({ isOpen, onClose, onCadastro, onEsqueciSenha }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mouseDownTarget, setMouseDownTarget] = useState(null);
  const navigate = useNavigate();

  if (!isOpen) return null;

  const redirecionarPorEmail = (email) => {
    console.log("Tentativa de redirecionamento para:", email);
    if (email === "pino@docente.senai.br" || email === "pino@senai.br" || email === "carlos.pino@sp.senai.br") return navigate("/admin/adm-mec");
    if (email === "chile@docente.senai.br" || email === "chile@senai.br" || email === "jsilva@sp.senai.br") return navigate("/admin/adm-info");
    if (email === "diretor@senai.br") return navigate("/admin");
    if (email === "vieira@docente.senai.br" || email === "vieira@senai.br" || email === "alexandre.vieira@sp.senai.br") return navigate("/admin/adm-fac");
    
    if (email.endsWith("@aluno.senai.br")) {
        console.log("Redirecionando para /aluno");
        return navigate("/aluno");
    }
    
    if (email.endsWith("@senai.br") || email.endsWith("@docente.senai.br") || email.endsWith("@sp.senai.br") || email.endsWith("@portalsesisp.org.br")) {
        console.log("Redirecionando para /funcionario");
        return navigate("/funcionario");
    }
    
    console.error("Redirecionamento falhou: E-mail não autorizado.");
    alert("E-mail não autorizado.");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.post("/login/autenticar", {
        emailEducacional: email,
        senha: senha
      });

      if (response.token) {
        localStorage.setItem("authToken", response.token);
      }
      if (response.refreshToken) {
        localStorage.setItem("refreshToken", response.refreshToken);
      }

      localStorage.setItem("usuarioLogado", JSON.stringify({ email }));

      redirecionarPorEmail(email);
      
      setEmail("");
      setSenha("");
      onClose();
    } catch (err) {
      console.error("Erro na autenticação:", err);
      
      if (err.status === 401) {
        setError("Email ou senha inválidos.");
      } else if (err.status === 400) {
        setError("Dados inválidos. Verifique os campos.");
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
      React.createElement("h2", { className: "titulo-principal" }, "Login"),
      error && React.createElement("div", { className: "error-message", style: { color: "red", marginBottom: "10px", textAlign: "center" } }, error),
      React.createElement(
        "form",
        { onSubmit: handleSubmit },
        React.createElement(
          "div",
          { className: "input-icon-container" },
          React.createElement("img", { src: boneco, alt: "usuário" }),
          React.createElement("input", {
            type: "email",
            placeholder: "E-mail institucional",
            value: email,
            onChange: (e) => setEmail(e.target.value),
            required: true,
          })
        ),
        React.createElement(
          "div",
          { className: "input-icon-container password-container" },
          React.createElement("img", { src: cadeado, alt: "senha" }),
          React.createElement("input", {
            type: mostrarSenha ? "text" : "password",
            placeholder: "Senha",
            value: senha,
            onChange: (e) => setSenha(e.target.value),
            required: true,
          }),
          React.createElement("button", {
            type: "button",
            className: "toggle-password-btn",
            onClick: () => setMostrarSenha(!mostrarSenha),
            "aria-label": mostrarSenha ? "Ocultar senha" : "Mostrar senha"
          }, "👁️‍🗨️")
        ),
        React.createElement("button", { type: "submit", className: "submit-btn", disabled: loading }, loading ? "Entrando..." : "Entrar")
      ),
      React.createElement(
        "div",
        { className: "actions-links" },
        React.createElement("button", { onClick: onEsqueciSenha }, "Esqueceu sua senha?"),
        React.createElement("button", { onClick: onCadastro }, "Primeiro acesso?")
      )
    )
  );
}

export default ModalLogin;