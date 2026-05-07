import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import DataTable from "../components/DataTable";
import StatCard from "../components/StatCard";

import {
  loadAllData,
  calculatePlayerStats,
  calculatePlayerChampionStats,
  sortAndRank,
} from "../services/statsService";

function PlayerDetail() {
  const { id } = useParams();

  const [playerData, setPlayerData] = useState(null);
  const [champions, setChampions] = useState([]);
  const [sortBy, setSortBy] = useState("games");
  const [minGames, setMinGames] = useState(1);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadPlayer() {
      try {
        const { players, participants } = await loadAllData();

        const player = players.find(
          (currentPlayer) => Number(currentPlayer.id) === Number(id)
        );

        if (!player) {
          setError("Jogador não encontrado.");
          return;
        }

        const summary = calculatePlayerStats(player, participants);

        const championStats = calculatePlayerChampionStats(
          Number(id),
          participants,
          minGames
        );

        const rankedChampions = sortAndRank(championStats, sortBy);

        setPlayerData({
          player,
          summary,
        });

        setChampions(rankedChampions);
        setError(null);
      } catch (err) {
        console.error(err);
        setError(`Erro ao carregar dados do jogador: ${err.message}`);
      }
    }

    loadPlayer();
  }, [id, sortBy, minGames]);

  if (error) {
    return (
      <main>
        <p style={{ color: "#f87171" }}>{error}</p>
        <Link to="/players">Voltar para jogadores</Link>
      </main>
    );
  }

  if (!playerData) {
    return <p>Carregando...</p>;
  }

  const { player, summary } = playerData;

  const championColumns = [
    { key: "position", label: "Posição" },
    { key: "champion", label: "Campeão" },
    { key: "games", label: "Jogos" },
    { key: "wins", label: "Vitórias" },
    { key: "losses", label: "Derrotas" },
    {
      key: "win_rate",
      label: "Win Rate",
      render: (champion) => `${champion.win_rate}%`,
    },
    { key: "avg_kills", label: "Kills médios" },
    { key: "avg_deaths", label: "Deaths médios" },
    { key: "avg_assists", label: "Assists médios" },
    { key: "kda", label: "KDA" },
    { key: "cs_per_min", label: "CS/min" },
    { key: "gold_per_min", label: "Gold/min" },
    { key: "avg_damage", label: "Dano médio" },
    { key: "avg_vision_score", label: "Visão média" },
  ];

  return (
    <main>
      <Link to="/players">← Voltar para jogadores</Link>

      <h1>{player.nickname}</h1>

      <p>
        Riot ID: {player.riot_name || "-"}#{player.tag_line || "-"}
      </p>

      <section>
        <h2>Resumo geral</h2>

        <div
          style={{
            display: "flex",
            gap: "16px",
            flexWrap: "wrap",
            marginTop: "16px",
          }}
        >
          <StatCard title="Jogos" value={summary.games} />
          <StatCard title="Vitórias" value={summary.wins} />
          <StatCard title="Derrotas" value={summary.losses} />
          <StatCard title="Win Rate" value={`${summary.win_rate}%`} />
          <StatCard title="KDA" value={summary.kda} />
          <StatCard title="CS/min" value={summary.cs_per_min} />
          <StatCard title="Gold/min" value={summary.gold_per_min} />
          <StatCard title="Dano médio" value={summary.avg_damage} />
          <StatCard title="Visão média" value={summary.avg_vision_score} />
        </div>
      </section>

      <section style={{ marginTop: "24px" }}>
        <h2>Campeões jogados</h2>

        <div style={{ marginBottom: "16px" }}>
          <label>
            Ordenar por:{" "}
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="games">Jogos</option>
              <option value="win_rate">Win Rate</option>
              <option value="kda">KDA</option>
              <option value="cs_per_min">CS/min</option>
              <option value="gold_per_min">Gold/min</option>
              <option value="avg_damage">Dano médio</option>
              <option value="avg_vision_score">Vision score</option>
            </select>
          </label>

          <label style={{ marginLeft: "16px" }}>
            Mínimo de jogos:{" "}
            <input
              type="number"
              min="1"
              value={minGames}
              onChange={(e) => setMinGames(Number(e.target.value))}
            />
          </label>
        </div>

        <DataTable
          columns={championColumns}
          data={champions}
          getRowKey={(champion) => champion.champion}
        />
      </section>
    </main>
  );
}

export default PlayerDetail;