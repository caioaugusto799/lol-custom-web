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
      setError("Erro ao fazer login. Confira e-mail e senha.");
    }
  }

  async function handleSignUp(e) {
    e.preventDefault();

    setError(null);
    setMessage(null);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      setMessage(
        "Conta criada. Se o Supabase pedir confirmação, verifique seu e-mail antes de entrar."
      );
    } catch (err) {
      console.error(err);
      setError("Erro ao criar conta.");
    }
  }

  return (
    <main>
      <h1>Entrar</h1>

      <form>
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

        <button type="submit" onClick={handleLogin} style={{ marginLeft: "16px" }}>
          Entrar
        </button>

        <button type="button" onClick={handleSignUp} style={{ marginLeft: "8px" }}>
          Criar conta
        </button>
      </form>

      {error && <p style={{ color: "#f87171" }}>{error}</p>}
      {message && <p style={{ color: "#4ade80" }}>{message}</p>}
    </main>
  );
}

export default Login;