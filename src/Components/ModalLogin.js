import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Modal.css";
import logosenai from "../assets/imagens/logosenai.png";
import boneco from "../assets/imagens/boneco.png";
import cadeado from "../assets/imagens/cadeado.png";
import { api } from "../services/api";

function ModalLogin({ isOpen, onClose, onCadastro, onEsqueciSenha, onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  if (!isOpen) return null;

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
      
      const usuarioData = { email: email, tipo: response.tipo }; 
      localStorage.setItem("usuarioLogado", JSON.stringify(usuarioData));

      // Chama a função do componente pai (Home.js) para decidir a rota
      if (onLoginSuccess) {
        onLoginSuccess(usuarioData); 
      }

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

  return React.createElement(
    "div",
    { className: "modal-overlay", onClick: onClose },
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
          { className: "input-icon-container" },
          React.createElement("img", { src: cadeado, alt: "senha" }),
          React.createElement("input", {
            type: "password",
            placeholder: "Senha",
            value: senha,
            onChange: (e) => setSenha(e.target.value),
            required: true,
          })
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