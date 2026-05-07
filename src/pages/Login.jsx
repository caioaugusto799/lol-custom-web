import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { supabase } from "../api/supabase";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  async function handleLogin(e) {
    e.preventDefault();

    setError(null);
    setMessage(null);

    if (!email.trim() || !password.trim()) {
      setError("Preencha e-mail e senha.");
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      navigate("/");
    } catch (err) {
      console.error(err);
      setError(`Erro ao fazer login: ${err.message}`);
    }
  }

  return (
    <main>
      <h1>Entrar</h1>

      <p style={{ color: "#94a3b8" }}>
        Acesso liberado apenas para usuários autorizados pelo administrador.
      </p>

      <form onSubmit={handleLogin}>
        <label>
          E-mail:{" "}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seuemail@email.com"
          />
        </label>

        <label style={{ marginLeft: "16px" }}>
          Senha:{" "}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha"
          />
        </label>

        <button type="submit" style={{ marginLeft: "16px" }}>
          Entrar
        </button>
      </form>

      {error && <p style={{ color: "#f87171" }}>{error}</p>}
      {message && <p style={{ color: "#4ade80" }}>{message}</p>}
    </main>
  );
}

export default Login;