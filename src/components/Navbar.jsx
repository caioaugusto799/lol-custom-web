import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { supabase } from "../api/supabase";

function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/");
  }

  return (
    <nav
      style={{
        display: "flex",
        gap: "16px",
        marginBottom: "32px",
        padding: "16px",
        backgroundColor: "#111827",
        border: "1px solid #334155",
        borderRadius: "16px",
        flexWrap: "wrap",
        alignItems: "center",
      }}
    >
      <Link to="/">Dashboard</Link>
      <Link to="/rankings">Ranking</Link>
      <Link to="/players">Jogadores</Link>
      <Link to="/matches">Partidas</Link>
      <Link to="/champions">Campeões</Link>
      <Link to="/roles">Rotas</Link>
      <Link to="/new-match">Cadastrar Partida</Link>
      <Link to="/head-to-head">Confronto</Link>
      <Link to="/import-match">Importar Partida</Link>

      <span style={{ marginLeft: "auto" }}>
        {user ? (
          <>
            <span style={{ color: "#94a3b8", marginRight: "12px" }}>
              {user.email}
            </span>

            <button type="button" onClick={handleLogout}>
              Sair
            </button>
          </>
        ) : (
          <Link to="/login">Entrar</Link>
        )}
      </span>
    </nav>
  );
}

export default Navbar;