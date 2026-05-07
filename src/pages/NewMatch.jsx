import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { supabase } from "../api/supabase";

const roles = ["top", "jungle", "mid", "adc", "support"];

function createEmptyParticipant(team, role) {
  return {
    player_id: "",
    champion: "",
    team,
    role,
    kills: 0,
    deaths: 0,
    assists: 0,
    cs: 0,
    gold: 0,
    damage: 0,
    vision_score: 0,
  };
}

function NewMatch() {
  const [players, setPlayers] = useState([]);
  const [user, setUser] = useState(null);

  const [durationMinutes, setDurationMinutes] = useState(30);
  const [patch, setPatch] = useState("14.10");
  const [blueTeamWin, setBlueTeamWin] = useState(true);

  const [participants, setParticipants] = useState([
    ...roles.map((role) => createEmptyParticipant("blue", role)),
    ...roles.map((role) => createEmptyParticipant("red", role)),
  ]);

  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

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

  function updateParticipant(index, field, value) {
    const updated = [...participants];

    updated[index] = {
      ...updated[index],
      [field]: value,
    };

    setParticipants(updated);
  }

  function validateParticipants(parsedParticipants) {
    if (parsedParticipants.length !== 10) {
      return "A partida precisa ter exatamente 10 participantes.";
    }

    const playerIds = parsedParticipants.map((p) => p.player_id);
    const uniquePlayerIds = new Set(playerIds);

    if (uniquePlayerIds.size !== playerIds.length) {
      return "Não é permitido repetir o mesmo jogador na mesma partida.";
    }

    const hasEmptyPlayer = parsedParticipants.some((p) => !p.player_id);

    if (hasEmptyPlayer) {
      return "Todos os participantes precisam ter um jogador selecionado.";
    }

    const hasEmptyChampion = parsedParticipants.some(
      (p) => !p.champion.trim()
    );

    if (hasEmptyChampion) {
      return "Todos os participantes precisam ter campeão preenchido.";
    }

    const blueCount = parsedParticipants.filter((p) => p.team === "blue").length;
    const redCount = parsedParticipants.filter((p) => p.team === "red").length;

    if (blueCount !== 5 || redCount !== 5) {
      return "A partida precisa ter 5 jogadores no blue e 5 jogadores no red.";
    }

    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setError(null);
    setMessage(null);

    if (!isLoggedIn) {
      setError("Você precisa estar logado para cadastrar uma partida.");
      return;
    }

    const parsedParticipants = participants.map((p) => ({
      player_id: Number(p.player_id),
      champion: p.champion.trim(),
      team: p.team,
      role: p.role,
      kills: Number(p.kills),
      deaths: Number(p.deaths),
      assists: Number(p.assists),
      cs: Number(p.cs),
      gold: Number(p.gold),
      damage: Number(p.damage),
      vision_score: Number(p.vision_score),
      win:
        (blueTeamWin && p.team === "blue") ||
        (!blueTeamWin && p.team === "red"),
    }));

    const validationError = validateParticipants(parsedParticipants);

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const { data: matchData, error: matchError } = await supabase
        .from("matches")
        .insert({
          duration_seconds: Number(durationMinutes) * 60,
          patch: patch || null,
          blue_team_win: blueTeamWin,
        })
        .select()
        .single();

      if (matchError) {
        throw matchError;
      }

      const participantsWithMatchId = parsedParticipants.map((participant) => ({
        ...participant,
        match_id: matchData.id,
      }));

      const { error: participantsError } = await supabase
        .from("match_participants")
        .insert(participantsWithMatchId);

      if (participantsError) {
        throw participantsError;
      }

      setMessage(`Partida #${matchData.id} cadastrada com sucesso!`);

      setParticipants([
        ...roles.map((role) => createEmptyParticipant("blue", role)),
        ...roles.map((role) => createEmptyParticipant("red", role)),
      ]);
    } catch (err) {
      console.error(err);
      setError(`Erro ao cadastrar partida: ${err.message}`);
    }
  }

  return (
    <main>
      <h1>Cadastrar Partida</h1>

      {!isLoggedIn ? (
        <section>
          <p>Você precisa entrar na conta para cadastrar partidas.</p>
          <Link to="/login">Entrar</Link>
        </section>
      ) : (
        <form onSubmit={handleSubmit}>
          <section>
            <label>
              Duração em minutos:{" "}
              <input
                type="number"
                min="1"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
              />
            </label>

            <label style={{ marginLeft: "16px" }}>
              Patch:{" "}
              <input
                type="text"
                value={patch}
                onChange={(e) => setPatch(e.target.value)}
              />
            </label>

            <label style={{ marginLeft: "16px" }}>
              Vencedor:{" "}
              <select
                value={blueTeamWin ? "blue" : "red"}
                onChange={(e) => setBlueTeamWin(e.target.value === "blue")}
              >
                <option value="blue">Blue</option>
                <option value="red">Red</option>
              </select>
            </label>
          </section>

          <section style={{ marginTop: "24px" }}>
            <h2>Blue Team</h2>

            <ParticipantsTable
              participants={participants}
              players={players}
              team="blue"
              startIndex={0}
              updateParticipant={updateParticipant}
            />
          </section>

          <section style={{ marginTop: "24px" }}>
            <h2>Red Team</h2>

            <ParticipantsTable
              participants={participants}
              players={players}
              team="red"
              startIndex={5}
              updateParticipant={updateParticipant}
            />
          </section>

          {error && <p style={{ color: "#f87171" }}>{error}</p>}
          {message && <p style={{ color: "#4ade80" }}>{message}</p>}

          <button type="submit" style={{ marginTop: "24px" }}>
            Cadastrar partida
          </button>
        </form>
      )}
    </main>
  );
}

function ParticipantsTable({
  participants,
  players,
  team,
  startIndex,
  updateParticipant,
}) {
  const teamParticipants = participants.filter((p) => p.team === team);

  return (
    <div style={{ overflowX: "auto" }}>
      <table>
        <thead>
          <tr>
            <th>Rota</th>
            <th>Jogador</th>
            <th>Campeão</th>
            <th>K</th>
            <th>D</th>
            <th>A</th>
            <th>CS</th>
            <th>Gold</th>
            <th>Dano</th>
            <th>Visão</th>
          </tr>
        </thead>

        <tbody>
          {teamParticipants.map((participant, localIndex) => {
            const index = startIndex + localIndex;

            return (
              <tr key={`${team}-${participant.role}`}>
                <td>{participant.role}</td>

                <td>
                  <select
                    value={participant.player_id}
                    onChange={(e) =>
                      updateParticipant(index, "player_id", e.target.value)
                    }
                  >
                    <option value="">Selecione</option>

                    {players.map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.nickname}
                      </option>
                    ))}
                  </select>
                </td>

                <td>
                  <input
                    type="text"
                    value={participant.champion}
                    onChange={(e) =>
                      updateParticipant(index, "champion", e.target.value)
                    }
                    placeholder="Yasuo"
                  />
                </td>

                <td>
                  <input
                    type="number"
                    value={participant.kills}
                    onChange={(e) =>
                      updateParticipant(index, "kills", e.target.value)
                    }
                  />
                </td>

                <td>
                  <input
                    type="number"
                    value={participant.deaths}
                    onChange={(e) =>
                      updateParticipant(index, "deaths", e.target.value)
                    }
                  />
                </td>

                <td>
                  <input
                    type="number"
                    value={participant.assists}
                    onChange={(e) =>
                      updateParticipant(index, "assists", e.target.value)
                    }
                  />
                </td>

                <td>
                  <input
                    type="number"
                    value={participant.cs}
                    onChange={(e) =>
                      updateParticipant(index, "cs", e.target.value)
                    }
                  />
                </td>

                <td>
                  <input
                    type="number"
                    value={participant.gold}
                    onChange={(e) =>
                      updateParticipant(index, "gold", e.target.value)
                    }
                  />
                </td>

                <td>
                  <input
                    type="number"
                    value={participant.damage}
                    onChange={(e) =>
                      updateParticipant(index, "damage", e.target.value)
                    }
                  />
                </td>

                <td>
                  <input
                    type="number"
                    value={participant.vision_score}
                    onChange={(e) =>
                      updateParticipant(index, "vision_score", e.target.value)
                    }
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default NewMatch;