import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../../services/api";
import "./RedefinirSenha.css";
import logosenai from "../../assets/imagens/logosenai.png";

function RedefinirSenha() {
  const [searchParams] = useSearchParams();
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [tokenValido, setTokenValido] = useState(true);
  const navigate = useNavigate();

  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setErro("Token não fornecido. Link inválido.");
      setTokenValido(false);
    }
  }, [token]);

  const handleRedefinirSenha = async (e) => {
    e.preventDefault();
    setErro("");

    // Validações
    if (novaSenha.length < 8) {
      setErro("A senha deve ter pelo menos 8 caracteres.");
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/login/redefinir-senha", {
        token: token,
        novaSenha: novaSenha
      });

      console.log("Senha redefinida com sucesso:", response);
      setSucesso(true);

      // Redireciona para home após 3 segundos
      setTimeout(() => {
        navigate("/");
      }, 3000);
    } catch (error) {
      console.error("Erro ao redefinir senha:", error);

      if (error.status === 400) {
        const errorText = await error.text();
        setErro(errorText || "Token inválido ou expirado.");
      } else {
        setErro("Erro ao redefinir senha. Tente novamente mais tarde.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!tokenValido) {
    return (
      <div className="redefinir-senha-container">
        <div className="redefinir-senha-card">
          <img src={logosenai} alt="Logo SENAI" className="logo-senai" />
          <div className="linha-vermelha"></div>
          <h2>Link Inválido</h2>
          <p className="erro-mensagem">{erro}</p>
          <button onClick={() => navigate("/")} className="btn-voltar">
            Voltar para Home
          </button>
        </div>
      </div>
    );
  }

  if (sucesso) {
    return (
      <div className="redefinir-senha-container">
        <div className="redefinir-senha-card">
          <img src={logosenai} alt="Logo SENAI" className="logo-senai" />
          <div className="linha-vermelha"></div>
          <h2>Senha Redefinida!</h2>
          <p className="sucesso-mensagem">
            Sua senha foi redefinida com sucesso. Você será redirecionado para a página inicial...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="redefinir-senha-container">
      <div className="redefinir-senha-card">
        <img src={logosenai} alt="Logo SENAI" className="logo-senai" />
        <div className="linha-vermelha"></div>
        <h2>Redefinir Senha</h2>
        <p className="instrucoes">Digite sua nova senha abaixo.</p>

        <form onSubmit={handleRedefinirSenha}>
          <div className="input-group">
            <label htmlFor="novaSenha">Nova Senha</label>
            <input
              type="password"
              id="novaSenha"
              placeholder="Digite sua nova senha"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              required
              disabled={loading}
              minLength={8}
            />
          </div>

          <div className="input-group">
            <label htmlFor="confirmarSenha">Confirmar Senha</label>
            <input
              type="password"
              id="confirmarSenha"
              placeholder="Confirme sua nova senha"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              required
              disabled={loading}
              minLength={8}
            />
          </div>

          {erro && <p className="erro-mensagem">{erro}</p>}

          <button type="submit" className="btn-redefinir" disabled={loading}>
            {loading ? "Redefinindo..." : "Redefinir Senha"}
          </button>
        </form>

        <button onClick={() => navigate("/")} className="btn-voltar-link">
          Voltar para Home
        </button>
      </div>
    </div>
  );
}

export default RedefinirSenha;
