import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { supabase } from "../api/supabase";
import DataTable from "../components/DataTable";

function Matches() {
  const [matches, setMatches] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [error, setError] = useState(null);

  const [user, setUser] = useState(null);
  const [players, setPlayers] = useState([]);

  const [winner, setWinner] = useState("");
  const [champion, setChampion] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);

  const [editingMatch, setEditingMatch] = useState(null);
  const [editDurationMinutes, setEditDurationMinutes] = useState("");
  const [editPatch, setEditPatch] = useState("");
  const [editWinner, setEditWinner] = useState("blue");

  const isLoggedIn = Boolean(user);

  async function loadPlayers() {
    try {
      const { data, error } = await supabase
        .from("players")
        .select("*")
        .order("nickname", { ascending: true });

      if (error) {
        throw error;
      }

      setPlayers(data || []);
    } catch (err) {
      console.error(err);
      setError("Erro ao carregar jogadores.");
    }
  }

  async function loadMatches() {
    try {
      const { data, error } = await supabase
        .from("matches")
        .select(`
          *,
          match_participants (
            *,
            players (
              id,
              nickname,
              riot_name,
              tag_line
            )
          )
        `)
        .order("game_date", { ascending: false });

      if (error) {
        throw error;
      }

      let formattedMatches = (data || []).map((match) => {
        const participants = match.match_participants || [];

        const blueKills = participants
          .filter((participant) => participant.team === "blue")
          .reduce((sum, participant) => sum + Number(participant.kills || 0), 0);

        const redKills = participants
          .filter((participant) => participant.team === "red")
          .reduce((sum, participant) => sum + Number(participant.kills || 0), 0);

        return {
          id: match.id,
          game_date: match.game_date,
          duration_seconds: match.duration_seconds,
          duration_minutes:
            Math.round((match.duration_seconds / 60) * 100) / 100,
          patch: match.patch,
          blue_team_win: match.blue_team_win,
          winner: match.blue_team_win ? "blue" : "red",
          participants_count: participants.length,
          blue_kills: blueKills,
          red_kills: redKills,
          participants,
        };
      });

      if (winner) {
        formattedMatches = formattedMatches.filter(
          (match) => match.winner === winner
        );
      }

      if (champion.trim()) {
        const championLower = champion.toLowerCase();

        formattedMatches = formattedMatches.filter((match) =>
          match.participants.some((participant) =>
            participant.champion?.toLowerCase().includes(championLower)
          )
        );
      }

      if (playerId) {
        formattedMatches = formattedMatches.filter((match) =>
          match.participants.some(
            (participant) => Number(participant.player_id) === Number(playerId)
          )
        );
      }

      const total = formattedMatches.length;
      const paginatedMatches = formattedMatches.slice(offset, offset + limit);

      setMatches(paginatedMatches);

      setPagination({
        total,
        limit,
        offset,
        returned: paginatedMatches.length,
        has_next: offset + limit < total,
        has_previous: offset > 0,
      });

      setError(null);
    } catch (err) {
      console.error(err);
      setError(`Erro ao carregar partidas: ${err.message}`);
    }
  }

  useEffect(() => {
    loadPlayers();
  }, []);

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

  useEffect(() => {
    loadMatches();
  }, [winner, champion, playerId, limit, offset]);

  function handleSearch(e) {
    e.preventDefault();
    setOffset(0);
  }

  function startEditingMatch(match) {
    setEditingMatch(match);
    setEditDurationMinutes(match.duration_minutes);
    setEditPatch(match.patch || "");
    setEditWinner(match.winner);
    setError(null);
  }

  function cancelEditingMatch() {
    setEditingMatch(null);
    setEditDurationMinutes("");
    setEditPatch("");
    setEditWinner("blue");
  }

  async function handleUpdateMatch(e) {
    e.preventDefault();

    if (!isLoggedIn) {
      setError("Você precisa estar logado para editar uma partida.");
      return;
    }

    if (!editingMatch) {
      return;
    }

    try {
      const { error: matchError } = await supabase
        .from("matches")
        .update({
          duration_seconds: Number(editDurationMinutes) * 60,
          patch: editPatch || null,
          blue_team_win: editWinner === "blue",
        })
        .eq("id", editingMatch.id);

      if (matchError) {
        throw matchError;
      }

      const { data: participants, error: participantsLoadError } =
        await supabase
          .from("match_participants")
          .select("*")
          .eq("match_id", editingMatch.id);

      if (participantsLoadError) {
        throw participantsLoadError;
      }

      for (const participant of participants || []) {
        const participantWin =
          (editWinner === "blue" && participant.team === "blue") ||
          (editWinner === "red" && participant.team === "red");

        const { error: participantUpdateError } = await supabase
          .from("match_participants")
          .update({
            win: participantWin,
          })
          .eq("id", participant.id);

        if (participantUpdateError) {
          throw participantUpdateError;
        }
      }

      setError(null);
      cancelEditingMatch();
      await loadMatches();
    } catch (err) {
      console.error(err);
      setError(`Erro ao atualizar partida: ${err.message}`);
    }
  }

  async function handleDeleteMatch(match) {
    if (!isLoggedIn) {
      setError("Você precisa estar logado para deletar uma partida.");
      return;
    }

    const confirmDelete = window.confirm(
      `Tem certeza que deseja deletar a partida #${match.id}?`
    );

    if (!confirmDelete) {
      return;
    }

    try {
      const { error } = await supabase
        .from("matches")
        .delete()
        .eq("id", match.id);

      if (error) {
        throw error;
      }

      setError(null);
      await loadMatches();
    } catch (err) {
      console.error(err);
      setError(`Erro ao deletar partida: ${err.message}`);
    }
  }

  const columns = [
    { key: "id", label: "ID" },
    {
      key: "game_date",
      label: "Data",
      render: (match) => new Date(match.game_date).toLocaleString("pt-BR"),
    },
    {
      key: "duration_minutes",
      label: "Duração",
      render: (match) => `${match.duration_minutes} min`,
    },
    {
      key: "patch",
      label: "Patch",
      render: (match) => match.patch || "-",
    },
    { key: "winner", label: "Vencedor" },
    { key: "blue_kills", label: "Kills Blue" },
    { key: "red_kills", label: "Kills Red" },
    { key: "participants_count", label: "Participantes" },
    {
      key: "details",
      label: "Detalhes",
      render: (match) => <Link to={`/matches/${match.id}`}>Ver partida</Link>,
    },
    ...(isLoggedIn
      ? [
          {
            key: "edit",
            label: "Editar",
            render: (match) => (
              <button type="button" onClick={() => startEditingMatch(match)}>
                Editar
              </button>
            ),
          },
          {
            key: "delete",
            label: "Deletar",
            render: (match) => (
              <button type="button" onClick={() => handleDeleteMatch(match)}>
                Deletar
              </button>
            ),
          },
        ]
      : []),
  ];

  return (
    <main>
      <h1>Histórico de Partidas</h1>

      <form onSubmit={handleSearch} style={{ marginBottom: "20px" }}>
        <label>
          Vencedor:{" "}
          <select value={winner} onChange={(e) => setWinner(e.target.value)}>
            <option value="">Todos</option>
            <option value="blue">Blue</option>
            <option value="red">Red</option>
          </select>
        </label>

        <label style={{ marginLeft: "16px" }}>
          Campeão:{" "}
          <input
            type="text"
            value={champion}
            onChange={(e) => setChampion(e.target.value)}
            placeholder="Yasuo"
          />
        </label>

        <label style={{ marginLeft: "16px" }}>
          Jogador:{" "}
          <select value={playerId} onChange={(e) => setPlayerId(e.target.value)}>
            <option value="">Todos</option>

            {players.map((player) => (
              <option key={player.id} value={player.id}>
                {player.nickname}
              </option>
            ))}
          </select>
        </label>

        <label style={{ marginLeft: "16px" }}>
          Limite:{" "}
          <input
            type="number"
            min="1"
            max="100"
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
          />
        </label>

        <button type="submit" style={{ marginLeft: "16px" }}>
          Filtrar
        </button>
      </form>

      {!isLoggedIn && (
        <p style={{ color: "#94a3b8" }}>
          Você pode visualizar as partidas, mas precisa entrar na conta para
          editar ou deletar.
        </p>
      )}

      {isLoggedIn && editingMatch && (
        <section>
          <h2>Editar partida #{editingMatch.id}</h2>

          <form onSubmit={handleUpdateMatch}>
            <label>
              Duração em minutos:{" "}
              <input
                type="number"
                min="1"
                value={editDurationMinutes}
                onChange={(e) => setEditDurationMinutes(e.target.value)}
              />
            </label>

            <label style={{ marginLeft: "16px" }}>
              Patch:{" "}
              <input
                type="text"
                value={editPatch}
                onChange={(e) => setEditPatch(e.target.value)}
              />
            </label>

            <label style={{ marginLeft: "16px" }}>
              Vencedor:{" "}
              <select
                value={editWinner}
                onChange={(e) => setEditWinner(e.target.value)}
              >
                <option value="blue">Blue</option>
                <option value="red">Red</option>
              </select>
            </label>

            <button type="submit" style={{ marginLeft: "16px" }}>
              Salvar
            </button>

            <button
              type="button"
              onClick={cancelEditingMatch}
              style={{ marginLeft: "8px" }}
            >
              Cancelar
            </button>
          </form>
        </section>
      )}

      {error && <p style={{ color: "#f87171" }}>{error}</p>}

      {pagination && (
        <p>
          Mostrando {pagination.returned} de {pagination.total} partidas
        </p>
      )}

      <DataTable
        columns={columns}
        data={matches}
        getRowKey={(match) => match.id}
      />

      {pagination && (
        <div style={{ marginTop: "20px" }}>
          <button
            disabled={!pagination.has_previous}
            onClick={() => setOffset(Math.max(0, offset - limit))}
          >
            Anterior
          </button>

          <button
            disabled={!pagination.has_next}
            onClick={() => setOffset(offset + limit)}
            style={{ marginLeft: "8px" }}
          >
            Próxima
          </button>
        </div>
      )}
    </main>
  );
}

export default Matches;