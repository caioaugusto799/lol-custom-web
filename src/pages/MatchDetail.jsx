import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { supabase } from "../api/supabase";
import DataTable from "../components/DataTable";

function MatchDetail() {
  const { id } = useParams();

  const [matchData, setMatchData] = useState(null);
  const [user, setUser] = useState(null);

  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const [editingParticipant, setEditingParticipant] = useState(null);
  const [editChampion, setEditChampion] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editKills, setEditKills] = useState(0);
  const [editDeaths, setEditDeaths] = useState(0);
  const [editAssists, setEditAssists] = useState(0);
  const [editCs, setEditCs] = useState(0);
  const [editGold, setEditGold] = useState(0);
  const [editDamage, setEditDamage] = useState(0);
  const [editVisionScore, setEditVisionScore] = useState(0);

  const [swapParticipantAId, setSwapParticipantAId] = useState("");
  const [swapParticipantBId, setSwapParticipantBId] = useState("");

  async function loadMatch() {
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
        .eq("id", id)
        .single();

      if (error) {
        throw error;
      }

      const participants = data.match_participants || [];

      const formattedParticipants = participants.map((participant) => ({
        participant_id: participant.id,
        player_id: participant.player_id,
        nickname: participant.players?.nickname || "Jogador desconhecido",
        champion: participant.champion,
        team: participant.team,
        role: participant.role,
        kills: participant.kills,
        deaths: participant.deaths,
        assists: participant.assists,
        kda:
          participant.deaths > 0
            ? Math.round(
                ((participant.kills + participant.assists) /
                  participant.deaths) *
                  100
              ) / 100
            : participant.kills + participant.assists,
        cs: participant.cs,
        gold: participant.gold,
        damage: participant.damage,
        vision_score: participant.vision_score,
        win: participant.win,
      }));

      const blueTeam = formattedParticipants.filter(
        (participant) => participant.team === "blue"
      );

      const redTeam = formattedParticipants.filter(
        (participant) => participant.team === "red"
      );

      setMatchData({
        match: {
          id: data.id,
          game_date: data.game_date,
          duration_seconds: data.duration_seconds,
          duration_minutes:
            Math.round((data.duration_seconds / 60) * 100) / 100,
          patch: data.patch,
          blue_team_win: data.blue_team_win,
          winner: data.blue_team_win ? "blue" : "red",
        },
        blue_team: blueTeam,
        red_team: redTeam,
      });

      setError(null);
    } catch (err) {
      console.error(err);
      setError(`Erro ao carregar detalhes da partida: ${err.message}`);
    }
  }

  useEffect(() => {
    loadMatch();
  }, [id]);

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

  function startEditingParticipant(participant) {
    setEditingParticipant(participant);
    setEditChampion(participant.champion || "");
    setEditRole(participant.role || "");
    setEditKills(participant.kills);
    setEditDeaths(participant.deaths);
    setEditAssists(participant.assists);
    setEditCs(participant.cs);
    setEditGold(participant.gold);
    setEditDamage(participant.damage);
    setEditVisionScore(participant.vision_score);
    setError(null);
    setMessage(null);
  }

  function cancelEditingParticipant() {
    setEditingParticipant(null);
    setEditChampion("");
    setEditRole("");
    setEditKills(0);
    setEditDeaths(0);
    setEditAssists(0);
    setEditCs(0);
    setEditGold(0);
    setEditDamage(0);
    setEditVisionScore(0);
  }

  async function handleUpdateParticipant(e) {
    e.preventDefault();

    if (!user) {
      setError("Você precisa estar logado para editar participante.");
      return;
    }

    if (!editingParticipant) {
      return;
    }

    if (!editChampion.trim()) {
      setError("O campeão é obrigatório.");
      return;
    }

    try {
      const { error } = await supabase
        .from("match_participants")
        .update({
          champion: editChampion,
          role: editRole || null,
          kills: Number(editKills),
          deaths: Number(editDeaths),
          assists: Number(editAssists),
          cs: Number(editCs),
          gold: Number(editGold),
          damage: Number(editDamage),
          vision_score: Number(editVisionScore),
        })
        .eq("id", editingParticipant.participant_id);

      if (error) {
        throw error;
      }

      setMessage("Participante atualizado com sucesso!");
      setError(null);
      cancelEditingParticipant();

      await loadMatch();
    } catch (err) {
      console.error(err);
      setError(`Erro ao atualizar participante: ${err.message}`);
    }
  }

  async function handleSwapPlayers(e) {
    e.preventDefault();

    setError(null);
    setMessage(null);

    if (!user) {
      setError("Você precisa estar logado para trocar jogadores de time.");
      return;
    }

    if (!swapParticipantAId || !swapParticipantBId) {
      setError("Selecione os dois participantes para trocar.");
      return;
    }

    if (swapParticipantAId === swapParticipantBId) {
      setError("Selecione dois participantes diferentes.");
      return;
    }

    const allParticipants = [...matchData.blue_team, ...matchData.red_team];

    const participantA = allParticipants.find(
      (participant) =>
        Number(participant.participant_id) === Number(swapParticipantAId)
    );

    const participantB = allParticipants.find(
      (participant) =>
        Number(participant.participant_id) === Number(swapParticipantBId)
    );

    if (!participantA || !participantB) {
      setError("Participantes não encontrados.");
      return;
    }

    if (participantA.team === participantB.team) {
      setError("Os jogadores precisam estar em times diferentes para trocar.");
      return;
    }

    try {
      const { error: errorA } = await supabase
        .from("match_participants")
        .update({
          team: participantB.team,
          win:
            (matchData.match.blue_team_win && participantB.team === "blue") ||
            (!matchData.match.blue_team_win && participantB.team === "red"),
        })
        .eq("id", participantA.participant_id);

      if (errorA) {
        throw errorA;
      }

      const { error: errorB } = await supabase
        .from("match_participants")
        .update({
          team: participantA.team,
          win:
            (matchData.match.blue_team_win && participantA.team === "blue") ||
            (!matchData.match.blue_team_win && participantA.team === "red"),
        })
        .eq("id", participantB.participant_id);

      if (errorB) {
        throw errorB;
      }

      setMessage("Jogadores trocados de time com sucesso!");
      setSwapParticipantAId("");
      setSwapParticipantBId("");

      await loadMatch();
    } catch (err) {
      console.error(err);
      setError(`Erro ao trocar jogadores de time: ${err.message}`);
    }
  }

  if (error && !matchData) {
    return (
      <main>
        <p style={{ color: "#f87171" }}>{error}</p>
        <Link to="/matches">Voltar para partidas</Link>
      </main>
    );
  }

  if (!matchData) {
    return <p>Carregando...</p>;
  }

  const { match, blue_team, red_team } = matchData;
  const allParticipants = [...blue_team, ...red_team];
  const isLoggedIn = Boolean(user);

  return (
    <main>
      <Link to="/matches">← Voltar para partidas</Link>

      <h1>Partida #{match.id}</h1>

      <section>
        <p>Data: {new Date(match.game_date).toLocaleString("pt-BR")}</p>
        <p>Duração: {match.duration_minutes} min</p>
        <p>Patch: {match.patch || "-"}</p>
        <p>Vencedor: {match.winner}</p>
      </section>

      {isLoggedIn ? (
        <section>
          <h2>Trocar jogadores de time</h2>

          <form onSubmit={handleSwapPlayers}>
            <label>
              Participante A:{" "}
              <select
                value={swapParticipantAId}
                onChange={(e) => setSwapParticipantAId(e.target.value)}
              >
                <option value="">Selecione</option>

                {allParticipants.map((participant) => (
                  <option
                    key={participant.participant_id}
                    value={participant.participant_id}
                  >
                    {participant.nickname} - {participant.team} -{" "}
                    {participant.champion}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ marginLeft: "16px" }}>
              Participante B:{" "}
              <select
                value={swapParticipantBId}
                onChange={(e) => setSwapParticipantBId(e.target.value)}
              >
                <option value="">Selecione</option>

                {allParticipants.map((participant) => (
                  <option
                    key={participant.participant_id}
                    value={participant.participant_id}
                  >
                    {participant.nickname} - {participant.team} -{" "}
                    {participant.champion}
                  </option>
                ))}
              </select>
            </label>

            <button type="submit" style={{ marginLeft: "16px" }}>
              Trocar
            </button>
          </form>
        </section>
      ) : (
        <section>
          <p style={{ color: "#94a3b8" }}>
            Você pode visualizar a partida, mas precisa entrar na conta para
            editar participantes ou trocar jogadores de time.
          </p>
        </section>
      )}

      {isLoggedIn && editingParticipant && (
        <section>
          <h2>
            Editar participante #{editingParticipant.participant_id} -{" "}
            {editingParticipant.nickname}
          </h2>

          <form onSubmit={handleUpdateParticipant}>
            <label>
              Campeão:{" "}
              <input
                type="text"
                value={editChampion}
                onChange={(e) => setEditChampion(e.target.value)}
              />
            </label>

            <label style={{ marginLeft: "16px" }}>
              Rota:{" "}
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
              >
                <option value="">-</option>
                <option value="top">top</option>
                <option value="jungle">jungle</option>
                <option value="mid">mid</option>
                <option value="adc">adc</option>
                <option value="support">support</option>
              </select>
            </label>

            <label style={{ marginLeft: "16px" }}>
              K:{" "}
              <input
                type="number"
                value={editKills}
                onChange={(e) => setEditKills(e.target.value)}
              />
            </label>

            <label style={{ marginLeft: "16px" }}>
              D:{" "}
              <input
                type="number"
                value={editDeaths}
                onChange={(e) => setEditDeaths(e.target.value)}
              />
            </label>

            <label style={{ marginLeft: "16px" }}>
              A:{" "}
              <input
                type="number"
                value={editAssists}
                onChange={(e) => setEditAssists(e.target.value)}
              />
            </label>

            <label style={{ marginLeft: "16px" }}>
              CS:{" "}
              <input
                type="number"
                value={editCs}
                onChange={(e) => setEditCs(e.target.value)}
              />
            </label>

            <label style={{ marginLeft: "16px" }}>
              Gold:{" "}
              <input
                type="number"
                value={editGold}
                onChange={(e) => setEditGold(e.target.value)}
              />
            </label>

            <label style={{ marginLeft: "16px" }}>
              Dano:{" "}
              <input
                type="number"
                value={editDamage}
                onChange={(e) => setEditDamage(e.target.value)}
              />
            </label>

            <label style={{ marginLeft: "16px" }}>
              Visão:{" "}
              <input
                type="number"
                value={editVisionScore}
                onChange={(e) => setEditVisionScore(e.target.value)}
              />
            </label>

            <button type="submit" style={{ marginLeft: "16px" }}>
              Salvar
            </button>

            <button
              type="button"
              onClick={cancelEditingParticipant}
              style={{ marginLeft: "8px" }}
            >
              Cancelar
            </button>
          </form>
        </section>
      )}

      {error && <p style={{ color: "#f87171" }}>{error}</p>}
      {message && <p style={{ color: "#4ade80" }}>{message}</p>}

      <section style={{ marginTop: "24px" }}>
        <h2>Blue Team {match.winner === "blue" ? "🏆" : ""}</h2>

        <TeamTable
          players={blue_team}
          isLoggedIn={isLoggedIn}
          onEditParticipant={startEditingParticipant}
        />
      </section>

      <section style={{ marginTop: "24px" }}>
        <h2>Red Team {match.winner === "red" ? "🏆" : ""}</h2>

        <TeamTable
          players={red_team}
          isLoggedIn={isLoggedIn}
          onEditParticipant={startEditingParticipant}
        />
      </section>
    </main>
  );
}

function TeamTable({ players, isLoggedIn, onEditParticipant }) {
  const columns = [
    {
      key: "nickname",
      label: "Jogador",
      render: (player) => (
        <Link to={`/players/${player.player_id}`}>{player.nickname}</Link>
      ),
    },
    { key: "champion", label: "Campeão" },
    {
      key: "role",
      label: "Rota",
      render: (player) => player.role || "-",
    },
    {
      key: "score",
      label: "K/D/A",
      render: (player) => `${player.kills}/${player.deaths}/${player.assists}`,
    },
    { key: "kda", label: "KDA" },
    { key: "cs", label: "CS" },
    { key: "gold", label: "Gold" },
    { key: "damage", label: "Dano" },
    { key: "vision_score", label: "Visão" },
    ...(isLoggedIn
      ? [
          {
            key: "edit",
            label: "Editar",
            render: (player) => (
              <button type="button" onClick={() => onEditParticipant(player)}>
                Editar
              </button>
            ),
          },
        ]
      : []),
  ];

  return (
    <DataTable
      columns={columns}
      data={players}
      getRowKey={(player) => player.participant_id}
    />
  );
}

export default MatchDetail;