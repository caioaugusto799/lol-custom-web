import { useEffect, useState } from "react";

import DataTable from "../components/DataTable";

import {
  loadAllData,
  calculateRoleStats,
  sortAndRank,
} from "../services/statsService";

function Roles() {
  const [roles, setRoles] = useState([]);
  const [sortBy, setSortBy] = useState("games");
  const [minGames, setMinGames] = useState(1);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadRoles() {
      try {
        const { participants } = await loadAllData();

        const roleStats = calculateRoleStats(participants, minGames);
        const rankedRoles = sortAndRank(roleStats, sortBy);

        setRoles(rankedRoles);
        setError(null);
      } catch (err) {
        console.error(err);
        setError(`Erro ao carregar estatísticas por rota: ${err.message}`);
      }
    }

    loadRoles();
  }, [sortBy, minGames]);

  const columns = [
    { key: "position", label: "Posição" },
    { key: "role", label: "Rota" },
    { key: "games", label: "Jogos" },
    { key: "wins", label: "Vitórias" },
    { key: "losses", label: "Derrotas" },
    {
      key: "win_rate",
      label: "Win Rate",
      render: (role) => `${role.win_rate}%`,
    },
    { key: "avg_kills", label: "Kills médios" },
    { key: "avg_deaths", label: "Deaths médios" },
    { key: "avg_assists", label: "Assists médios" },
    { key: "kda", label: "KDA" },
    { key: "cs_per_min", label: "CS/min" },
    { key: "gold_per_min", label: "Gold/min" },
    { key: "avg_damage", label: "Dano médio" },
    { key: "avg_vision_score", label: "Visão" },
  ];

  return (
    <main>
      <h1>Estatísticas por Rota</h1>

      <section>
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
      </section>

      {error && <p style={{ color: "#f87171" }}>{error}</p>}

      <DataTable
        columns={columns}
        data={roles}
        getRowKey={(role) => role.role}
      />
    </main>
  );
}

export default Roles;