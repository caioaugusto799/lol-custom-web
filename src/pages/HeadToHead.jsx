import { useEffect, useState } from "react";

import StatCard from "../components/StatCard";
import DataTable from "../components/DataTable";

import {
  loadAllData,
  calculateHeadToHead,
} from "../services/statsService";

function HeadToHead() {
  const [players, setPlayers] = useState([]);
  const [allParticipants, setAllParticipants] = useState([]);

  const [playerAId, setPlayerAId] = useState("");
  const [playerBId, setPlayerBId] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadInitialData() {
      try {
        const { players, participants } = await loadAllData();

        setPlayers(players);
        setAllParticipants(participants);
        setError(null);
      } catch (err) {
        console.error(err);
        setError(`Erro ao carregar jogadores: ${err.message}`);
      }
    }

    loadInitialData();
  }, []);

  function handleSubmit(e) {
    e.preventDefault();

    setError(null);
    setData(null);

    if (!playerAId || !playerBId) {
      setError("Selecione os dois jogadores.");
      return;
    }

    if (playerAId === playerBId) {
      setError("Escolha dois jogadores diferentes.");
      return;
    }

    try {
      const headToHeadData = calculateHeadToHead(
        Number(playerAId),
        Number(playerBId),
        players,
        allParticipants
      );

      setData(headToHeadData);
    } catch (err) {
      console.error(err);
      setError(`Erro ao calcular confronto direto: ${err.message}`);
    }
  }

  const matchesAgainstColumns = [
    { key: "match_id", label: "Partida" },
    {
      key: "game_date",
      label: "Data",
      render: (match) =>
        match.game_date
          ? new Date(match.game_date).toLocaleString("pt-BR")
          : "-",
    },
    { key: "winner", label: "Vencedor" },
    {
      key: "player_a",
      label: "Jogador A",
      render: (match) =>
        `${match.player_a.champion} (${match.player_a.kills}/${match.player_a.deaths}/${match.player_a.assists})`,
    },
    {
      key: "player_b",
      label: "Jogador B",
      render: (match) =>
        `${match.player_b.champion} (${match.player_b.kills}/${match.player_b.deaths}/${match.player_b.assists})`,
    },
  ];

  const matchesTogetherColumns = [
    { key: "match_id", label: "Partida" },
    {
      key: "game_date",
      label: "Data",
      render: (match) =>
        match.game_date
          ? new Date(match.game_date).toLocaleString("pt-BR")
          : "-",
    },
    { key: "team", label: "Time" },
    {
      key: "win",
      label: "Resultado",
      render: (match) => (match.win ? "Vitória" : "Derrota"),
    },
    {
      key: "player_a",
      label: "Jogador A",
      render: (match) =>
        `${match.player_a.champion} (${match.player_a.kills}/${match.player_a.deaths}/${match.player_a.assists})`,
    },
    {
      key: "player_b",
      label: "Jogador B",
      render: (match) =>
        `${match.player_b.champion} (${match.player_b.kills}/${match.player_b.deaths}/${match.player_b.assists})`,
    },
  ];

  return (
    <main>
      <h1>Confronto Direto</h1>

      <form onSubmit={handleSubmit}>
        <label>
          Jogador A:{" "}
          <select
            value={playerAId}
            onChange={(e) => setPlayerAId(e.target.value)}
          >
            <option value="">Selecione</option>

            {players.map((player) => (
              <option key={player.id} value={player.id}>
                {player.nickname}
              </option>
            ))}
          </select>
        </label>

        <label style={{ marginLeft: "16px" }}>
          Jogador B:{" "}
          <select
            value={playerBId}
            onChange={(e) => setPlayerBId(e.target.value)}
          >
            <option value="">Selecione</option>

            {players.map((player) => (
              <option key={player.id} value={player.id}>
                {player.nickname}
              </option>
            ))}
          </select>
        </label>

        <button type="submit" style={{ marginLeft: "16px" }}>
          Comparar
        </button>
      </form>

      {error && <p style={{ color: "#f87171" }}>{error}</p>}

      {data && (
        <>
          <section style={{ marginTop: "24px" }}>
            <h2>
              {data.players.player_a.nickname} vs{" "}
              {data.players.player_b.nickname}
            </h2>

            <div
              style={{
                display: "flex",
                gap: "16px",
                flexWrap: "wrap",
                marginTop: "16px",
              }}
            >
              <StatCard
                title="Jogos contra"
                value={data.against.games}
                subtitle="em times opostos"
              />

              <StatCard
                title={`${data.players.player_a.nickname} venceu`}
                value={data.against.player_a_wins}
                subtitle={`${data.against.player_a_win_rate}% win rate`}
              />

              <StatCard
                title={`${data.players.player_b.nickname} venceu`}
                value={data.against.player_b_wins}
                subtitle={`${data.against.player_b_win_rate}% win rate`}
              />

              <StatCard
                title={`KDA ${data.players.player_a.nickname}`}
                value={data.against.player_a_kda}
                subtitle="contra o outro jogador"
              />

              <StatCard
                title={`KDA ${data.players.player_b.nickname}`}
                value={data.against.player_b_kda}
                subtitle="contra o outro jogador"
              />

              <StatCard
                title="Jogos juntos"
                value={data.together.games}
                subtitle={`${data.together.win_rate}% win rate juntos`}
              />
            </div>
          </section>

          <section style={{ marginTop: "32px" }}>
            <h2>Partidas contra</h2>

            <DataTable
              columns={matchesAgainstColumns}
              data={data.matches_against}
              getRowKey={(match) => match.match_id}
            />
          </section>

          <section style={{ marginTop: "32px" }}>
            <h2>Partidas juntos</h2>

            <DataTable
              columns={matchesTogetherColumns}
              data={data.matches_together}
              getRowKey={(match) => match.match_id}
            />
          </section>
        </>
      )}
    </main>
  );
}

export default HeadToHead;