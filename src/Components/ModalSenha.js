import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Modal.css";
import logosenai from "../assets/imagens/logosenai.png";
import boneco from "../assets/imagens/boneco.png";

function ModalSenha({ isOpen, onClose }) {
  const [email, setEmail] = useState("");
  const [mensagemEnviada, setMensagemEnviada] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setMensagemEnviada(false);
      setEmail(""); 
    }
  }, [isOpen]);


  if (!isOpen) return null;

  const handleSolicitacaoSenha = (e) => {
    e.preventDefault();
    
    const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
    const usuarioExiste = usuarios.some((u) => u.email === email);

    if (!usuarioExiste) {
      alert("E-mail não cadastrado.");
      return;
    }

    console.log(`Simulando envio de e-mail de redefinição para: ${email}`);
    
    setEmail("");
    setMensagemEnviada(true);
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
      
      React.createElement("h2", { className: "titulo-principal" }, "Redefinir Senha"),

      mensagemEnviada 
        ? 
          React.createElement(
            "div", 
            { className: "submit-btn mensagem-sucesso" }, 
           
            React.createElement("p", null, "Um e-mail foi enviado para você com instruções para redefinir sua senha. Verifique sua caixa de entrada e spam.")
          )
        : 
          React.createElement(
            "form",
            { onSubmit: handleSolicitacaoSenha },
            
            React.createElement(
              "div",
              { className: "input-icon-container" },
              React.createElement("img", { src: boneco, alt: "usuário" }),
              React.createElement("input", {
                type: "email",
                placeholder: "Digite seu e-mail institucional",
                value: email,
                onChange: (e) => setEmail(e.target.value),
                required: true,
              })
            ),
            
            React.createElement("button", { type: "submit", className: "submit-btn" }, "Enviar Solicitação")
          )
    )
  );
}

export default ModalSenha;
