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
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState(""); 
  const [cpf, setCpf] = useState("");     
  const [curso, setCurso] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  if (!isOpen) return null;

  const redirecionarPorEmail = (email) => {
    const emailLower = email.toLowerCase();
    
    if (emailLower === "pino@docente.senai.br" || emailLower === "pino@senai.br") return navigate("/admin/adm-mec");
    if (emailLower === "chile@docente.senai.br" || emailLower === "chile@senai.br") return navigate("/admin/adm-info");
    if (emailLower === "diretor@docente.senai.br") return navigate("/admin");
    if (emailLower === "vieira@docente.senai.br" || emailLower === "vieira@senai.br") return navigate("/admin/adm-fac");
    
    if (emailLower.endsWith("@aluno.senai.br")) return navigate("/aluno");
    
    const isFuncionario = (
        emailLower.endsWith("@sp.senai.br") || 
        emailLower.endsWith("@sp.docente.senai.br") ||
        emailLower.endsWith("@senai.br") || 
        emailLower.endsWith("@docente.senai.br") 
    ) &&
    !emailLower.endsWith("@aluno.senai.br"); 

    if (isFuncionario) return navigate("/funcionario"); 

    alert("Acesso negado: E-mail não autorizado.");
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

      await api.post("/login/cadastrar", {
        emailEducacional: email,
        senha: senha,
        cargoUsuario: cargoUsuario,
        nome: nome,
        telefone: telefone,
        cpf: cpf,
        curso: curso
      });

      const loginResponse = await api.post("/login/autenticar", {
        emailEducacional: email,
        senha: senha
      });

      if (loginResponse.data && loginResponse.data.token) {
        localStorage.setItem("authToken", loginResponse.data.token);
      }
      if (loginResponse.data && loginResponse.data.refreshToken) {
        localStorage.setItem("refreshToken", loginResponse.data.refreshToken);
      }

      localStorage.setItem("usuarioLogado", JSON.stringify({ email, nome, curso }));

      alert("Cadastro realizado com sucesso!");
      
      setNome(""); 
      setEmail(""); 
      setSenha(""); 
      setTelefone(""); 
      setCpf(""); 
      setCurso("");
      onClose();
      
      redirecionarPorEmail(email);

    } catch (err) {
      console.error("Erro no cadastro:", err);
      
      if (err.response) {
        if (err.response.status === 400) {
          setError(err.response.data || "Dados inválidos. Verifique os campos.");
        } else if (err.response.status === 409) {
          setError("E-mail já cadastrado!");
        } else {
          setError("Erro no servidor. Tente novamente.");
        }
      } else {
        setError("Erro ao conectar com o servidor. Verifique sua conexão.");
      }
    } finally {
      setLoading(false);
    }
  };

  const shouldShowCourseField = 
    email.endsWith("@aluno.senai.br") || 
    email.endsWith("@senai.br") || 
    email.endsWith("@docente.senai.br") ||
    email.endsWith("@sp.senai.br") || // Incluindo SP específicos
    email.endsWith("@sp.docente.senai.br");
    
  const isAluno = email.endsWith("@aluno.senai.br");
  const showFuncionarioOptions = shouldShowCourseField && !isAluno;

  return React.createElement(
    "div",
    { className: "modal-overlay", onClick: onClose },
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
            placeholder: "E-mail (obrigatório: @senai.br ou @aluno.senai.br)",
            value: email,
            onChange: (e) => setEmail(e.target.value),
            required: true,
          })
        ),
        shouldShowCourseField && React.createElement(
            "div",
            { className: "input-icon-container" },
            React.createElement("img", { src: boneco, alt: "curso" }),
            React.createElement("select", {
                value: curso,
                onChange: (e) => setCurso(e.target.value),
                required: true,
                style: { width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }
            }, [
                React.createElement("option", { key: "default", value: "" }, 
                   isAluno ? "Selecione seu curso" : "Selecione seu Setor/Área"
                ),
                isAluno && [
                    React.createElement("option", { key: "ads", value: "ADS" }, "Análise e Desenvolvimento de Sistemas"),
                    React.createElement("option", { key: "redes", value: "Redes" }, "Redes de Computadores"),
                    React.createElement("option", { key: "mecanica", value: "Mecânica" }, "Mecânica"),
                    React.createElement("option", { key: "manufatura", value: "Manufatura" }, "Manufatura Digital"),
                    React.createElement("option", { key: "faculdade", value: "Faculdade" }, "Faculdade SENAI")
                ],
                showFuncionarioOptions && [
                    React.createElement("option", { key: "ads", value: "ADS" }, "Análise e Desenvolvimento de Sistemas"),
                    React.createElement("option", { key: "redes", value: "Redes" }, "Redes de Computadores"),
                    React.createElement("option", { key: "mecanica", value: "Mecânica" }, "Mecânica"),
                    React.createElement("option", { key: "manufatura", value: "Manufatura" }, "Manufatura Digital"),
                    React.createElement("option", { key: "faculdade", value: "Faculdade" }, "Faculdade SENAI"),
                    React.createElement("option", { key: "aqv", value: "AQV" }, "Analista de Qualidade de Vida")
                    
                ],
            ].flat())
        ),
        React.createElement(
          "div",
          { className: "input-icon-container" },
          React.createElement("img", { src: cadeado, alt: "senha" }),
          React.createElement("input", {
            type: "password",
            placeholder: "Senha (mínimo 8 caracteres)",
            value: senha,
            onChange: (e) => setSenha(e.target.value),
            required: true,
            minLength: 8
          })
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