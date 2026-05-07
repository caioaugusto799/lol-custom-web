import { useEffect, useState } from "react";

import StatCard from "../components/StatCard";
import ShortcutCard from "../components/ShortcutCard";

import {
  loadAllData,
  calculateSummary,
  calculateHighlights,
} from "../services/statsService";

function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [highlights, setHighlights] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const { players, matches, participants } = await loadAllData();

        const summaryData = calculateSummary(players, matches, participants);
        const highlightsData = calculateHighlights(players, matches, participants);

        setSummary(summaryData);
        setHighlights(highlightsData);
      } catch (err) {
        console.error(err);
        setError(`Erro ao carregar dashboard: ${err.message}`);
      }
    }

    loadData();
  }, []);

  if (error) {
    return (
      <main>
        <h1>LoL Custom Dashboard</h1>
        <p style={{ color: "#f87171" }}>{error}</p>
      </main>
    );
  }

  if (!summary || !highlights) {
    return <p>Carregando...</p>;
  }

  return (
    <main>
      <h1>LoL Custom Dashboard</h1>

      <section>
        <h2>Atalhos rápidos</h2>

        <div
          style={{
            display: "flex",
            gap: "16px",
            flexWrap: "wrap",
            marginTop: "16px",
          }}
        >
          <ShortcutCard
            title="Cadastrar partida"
            description="Registre uma custom completa com os 10 jogadores."
            to="/new-match"
          />

          <ShortcutCard
            title="Ranking"
            description="Veja os melhores jogadores por KDA, win rate, farm e dano."
            to="/rankings"
          />

          <ShortcutCard
            title="Histórico"
            description="Consulte partidas antigas com filtros por jogador, campeão e vencedor."
            to="/matches"
          />

          <ShortcutCard
            title="Confronto direto"
            description="Compare dois jogadores em partidas juntos ou contra."
            to="/head-to-head"
          />
        </div>
      </section>

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
          <StatCard
            title="Jogadores"
            value={summary.totals.players}
            subtitle="jogadores cadastrados"
          />

          <StatCard
            title="Partidas"
            value={summary.totals.matches}
            subtitle="partidas registradas"
          />

          <StatCard
            title="Campeões usados"
            value={summary.totals.champions_used}
            subtitle="campeões diferentes"
          />

          <StatCard
            title="Duração média"
            value={`${summary.matches.avg_duration_minutes} min`}
            subtitle="por partida"
          />

          <StatCard
            title="Kills médias"
            value={summary.matches.avg_kills_per_match}
            subtitle="por partida"
          />
        </div>
      </section>

      <section style={{ marginTop: "32px" }}>
        <h2>Destaques</h2>

        <div
          style={{
            display: "flex",
            gap: "16px",
            flexWrap: "wrap",
            marginTop: "16px",
          }}
        >
          <StatCard
            title="Mais jogos"
            value={
              highlights.players.most_games
                ? highlights.players.most_games.nickname
                : "Sem dados"
            }
            subtitle={
              highlights.players.most_games
                ? `${highlights.players.most_games.games} jogos`
                : ""
            }
          />

          <StatCard
            title="Melhor KDA"
            value={
              highlights.players.best_kda
                ? highlights.players.best_kda.nickname
                : "Sem dados"
            }
            subtitle={
              highlights.players.best_kda
                ? `KDA ${highlights.players.best_kda.kda}`
                : ""
            }
          />

          <StatCard
            title="Melhor win rate"
            value={
              highlights.players.best_win_rate
                ? highlights.players.best_win_rate.nickname
                : "Sem dados"
            }
            subtitle={
              highlights.players.best_win_rate
                ? `${highlights.players.best_win_rate.win_rate}%`
                : ""
            }
          />

          <StatCard
            title="Maior dano médio"
            value={
              highlights.players.best_avg_damage
                ? highlights.players.best_avg_damage.nickname
                : "Sem dados"
            }
            subtitle={
              highlights.players.best_avg_damage
                ? `${highlights.players.best_avg_damage.avg_damage} de dano`
                : ""
            }
          />

          <StatCard
            title="Campeão mais jogado"
            value={
              highlights.champions.most_played
                ? highlights.champions.most_played.champion
                : "Sem dados"
            }
            subtitle={
              highlights.champions.most_played
                ? `${highlights.champions.most_played.games} jogos`
                : ""
            }
          />

          <StatCard
            title="Campeão com melhor KDA"
            value={
              highlights.champions.best_kda
                ? highlights.champions.best_kda.champion
                : "Sem dados"
            }
            subtitle={
              highlights.champions.best_kda
                ? `KDA ${highlights.champions.best_kda.kda}`
                : ""
            }
          />
        </div>
      </section>
    </main>
  );
}

export default Dashboard;