import { useEffect, useState } from "react";
import { supabase } from "../api/supabase";

function SupabaseTest() {
  const [players, setPlayers] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadPlayers() {
      const { data, error } = await supabase
        .from("players")
        .select("*")
        .order("id", { ascending: true });

      if (error) {
        console.error(error);
        setError(error.message);
        return;
      }

      setPlayers(data);
    }

    loadPlayers();
  }, []);

  return (
    <main>
      <h1>Teste Supabase</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {players.map((player) => (
        <p key={player.id}>
          {player.id} - {player.nickname}
        </p>
      ))}
    </main>
  );
}

export default SupabaseTest;