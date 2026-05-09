import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { supabase } from "../api/supabase";
import DataTable from "../components/DataTable";

const exampleCsv = `team,player,champion,role,kills,deaths,assists,cs,gold,damage,vision_score
blue,2d al madri,,support,3,7,20,26,10963,0,0
blue,KN XUNDA,,adc,4,7,1,284,12921,0,0
blue,STIRL MANO SHACO,Shaco,jungle,5,8,11,186,12739,0,0
blue,Shark is back,,mid,5,9,10,222,13025,0,0
blue,Elice VVAR,,top,15,8,6,292,18675,0,0
red,CBT Teitans,,top,9,3,11,203,15002,0,0
red,CBT NATHGOL,,jungle,6,8,7,241,14996,0,0
red,MP10,,mid,19,8,8,288,19938,0,0
red,GOD STC,,adc,3,5,9,162,11884,0,0
red,mariidao,,support,2,8,17,24,9876,0,0`;

function ImportMatch() {
  const [user, setUser] = useState(null);
  const [players, setPlayers] = useState([]);

  const [durationMinutes, setDurationMinutes] = useState(33.42);
  const [patch, setPatch] = useState("");
  const [winner, setWinner] = useState("red");
  const [csvText, setCsvText] = useState(exampleCsv);

  const [previewRows, setPreviewRows] = useState([]);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const isLoggedIn = Boolean(user);

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
        setError(`Erro ao carregar jogadores: ${err.message}`);
      }
    }

    loadPlayers();
  }, []);

  function parseTableText(text) {
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length < 2) {
      throw new Error("O texto precisa ter cabeçalho e pelo menos uma linha.");
    }

    const separator = lines[0].includes("\t") ? "\t" : ",";

    const header = lines[0]
      .split(separator)
      .map((item) => item.trim().toLowerCase());

    const requiredColumns = [
      "team",
      "player",
      "kills",
      "deaths",
      "assists",
      "cs",
      "gold",
    ];

    const optionalColumns = ["champion", "role", "damage", "vision_score"];

    const missingColumns = requiredColumns.filter(
      (column) => !header.includes(column)
    );

    if (missingColumns.length > 0) {
      throw new Error(`Colunas obrigatórias faltando: ${missingColumns.join(", ")}`);
    }

    return lines.slice(1).map((line, index) => {
      const values = line.split(separator).map((item) => item.trim());

      if (values.length !== header.length) {
        throw new Error(
          `Linha ${index + 2} tem número de colunas diferente do cabeçalho.`
        );
      }

      const row = {};

      header.forEach((column, columnIndex) => {
        row[column] = values[columnIndex];
      });

      optionalColumns.forEach((column) => {
        if (!(column in row)) {
          row[column] = "";
        }
      });

      return {
        team: String(row.team || "").toLowerCase(),
        player: row.player || "",
        champion: row.champion || "REVISAR",
        role: row.role ? String(row.role).toLowerCase() : null,
        kills: Number(row.kills),
        deaths: Number(row.deaths),
        assists: Number(row.assists),
        cs: Number(row.cs),
        gold: Number(row.gold),
        damage: row.damage === "" ? 0 : Number(row.damage),
        vision_score: row.vision_score === "" ? 0 : Number(row.vision_score),
      };
    });
  }

  function validateRows(rows) {
    if (rows.length !== 10) {
      return "A partida precisa ter exatamente 10 jogadores.";
    }

    const blueCount = rows.filter((row) => row.team === "blue").length;
    const redCount = rows.filter((row) => row.team === "red").length;

    if (blueCount !== 5 || redCount !== 5) {
      return "A partida precisa ter 5 jogadores no blue e 5 jogadores no red.";
    }

    const validTeams = ["blue", "red"];
    const validRoles = ["top", "jungle", "mid", "adc", "support", null];

    for (const row of rows) {
      if (!validTeams.includes(row.team)) {
        return `Time inválido para ${row.player}: use blue ou red.`;
      }

      if (!validRoles.includes(row.role)) {
        return `Rota inválida para ${row.player}: use top, jungle, mid, adc ou support.`;
      }

      if (!row.player) {
        return "Todos os jogadores precisam ter player preenchido.";
      }

      const numericFields = [
        "kills",
        "deaths",
        "assists",
        "cs",
        "gold",
        "damage",
        "vision_score",
      ];

      for (const field of numericFields) {
        if (Number.isNaN(row[field]) || row[field] < 0) {
          return `Valor inválido em ${field} para ${row.player}.`;
        }
      }
    }

    const repeatedPlayers = rows
      .map((row) => row.player.toLowerCase())
      .filter((player, index, array) => array.indexOf(player) !== index);

    if (repeatedPlayers.length > 0) {
      return `Jogador repetido na partida: ${repeatedPlayers[0]}`;
    }

    return null;
  }

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function findPlayerByIdentifier(identifier) {
  const search = normalizeText(identifier);

  return players.find((player) => {
    const nickname = normalizeText(player.nickname);
    const riotName = normalizeText(player.riot_name);
    const tagLine = normalizeText(player.tag_line);

    const fullRiotId = tagLine ? `${riotName}#${tagLine}` : riotName;

    return (
      search === nickname ||
      search === riotName ||
      search === fullRiotId
    );
  });
}

 function buildRowsWithPlayers(rows) {
  return rows.map((row) => {
    const player = findPlayerByIdentifier(row.player);

    return {
      ...row,
      player_id: player?.id || null,
      player_found: Boolean(player),
      matched_player: player || null,
    };
  });
}

  function handlePreview() {
    setError(null);
    setMessage(null);

    try {
      const rows = parseTableText(csvText);
      const validationError = validateRows(rows);

      if (validationError) {
        setError(validationError);
        setPreviewRows([]);
        return;
      }

      const rowsWithPlayers = buildRowsWithPlayers(rows);
      const missingPlayers = rowsWithPlayers.filter((row) => !row.player_found);

      if (missingPlayers.length > 0) {
        setError(
          `Jogadores não cadastrados: ${missingPlayers
            .map((row) => row.player)
            .join(", ")}`
        );
      }

      setPreviewRows(rowsWithPlayers);
    } catch (err) {
      console.error(err);
      setError(err.message);
      setPreviewRows([]);
    }
  }

  async function handleImport() {
    setError(null);
    setMessage(null);

    if (!isLoggedIn) {
      setError("Você precisa estar logado para importar partidas.");
      return;
    }

    try {
      const rows = parseTableText(csvText);
      const validationError = validateRows(rows);

      if (validationError) {
        setError(validationError);
        return;
      }

      const rowsWithPlayers = buildRowsWithPlayers(rows);
      const missingPlayers = rowsWithPlayers.filter((row) => !row.player_found);

      if (missingPlayers.length > 0) {
        setError(
          `Cadastre primeiro estes jogadores: ${missingPlayers
            .map((row) => row.player)
            .join(", ")}`
        );
        return;
      }

      const blueTeamWin = winner === "blue";

      const { data: matchData, error: matchError } = await supabase
        .from("matches")
        .insert({
          duration_seconds: Math.round(Number(durationMinutes) * 60),
          patch: patch.trim() || null,
          blue_team_win: blueTeamWin,
        })
        .select()
        .single();

      if (matchError) {
        throw matchError;
      }

      const participantsToInsert = rowsWithPlayers.map((row) => ({
        match_id: matchData.id,
        player_id: row.player_id,
        champion: row.champion || "REVISAR",
        team: row.team,
        role: row.role || null,
        kills: row.kills,
        deaths: row.deaths,
        assists: row.assists,
        cs: row.cs,
        gold: row.gold,
        damage: row.damage,
        vision_score: row.vision_score,
        win:
          (blueTeamWin && row.team === "blue") ||
          (!blueTeamWin && row.team === "red"),
      }));

      const { error: participantsError } = await supabase
        .from("match_participants")
        .insert(participantsToInsert);

      if (participantsError) {
        throw participantsError;
      }

      setMessage(`Partida #${matchData.id} importada com sucesso!`);
      setPreviewRows([]);
    } catch (err) {
      console.error(err);
      setError(`Erro ao importar partida: ${err.message}`);
    }
  }

  const previewColumns = [
  {
    key: "status",
    label: "Status",
    render: (row) => (row.player_found ? "OK" : "Não cadastrado"),
  },
  {
    key: "matched_player",
    label: "Jogador encontrado",
    render: (row) =>
      row.matched_player
        ? `${row.matched_player.nickname} ${
            row.matched_player.riot_name
              ? `(${row.matched_player.riot_name}#${row.matched_player.tag_line || "-"})`
              : ""
          }`
        : "-",
  },
    { key: "team", label: "Time" },
    { key: "player", label: "Jogador" },
    { key: "champion", label: "Campeão" },
    {
      key: "role",
      label: "Rota",
      render: (row) => row.role || "-",
    },
    {
      key: "kda",
      label: "K/D/A",
      render: (row) => `${row.kills}/${row.deaths}/${row.assists}`,
    },
    { key: "cs", label: "CS" },
    { key: "gold", label: "Gold" },
    { key: "damage", label: "Dano" },
    { key: "vision_score", label: "Visão" },
  ];

  return (
    <main>
      <h1>Importar Partida por CSV</h1>

      {!isLoggedIn ? (
        <section>
          <p>Você precisa entrar na conta para importar partidas.</p>
          <Link to="/login">Entrar</Link>
        </section>
      ) : (
        <>
          <section>
            <label>
              Duração em minutos:{" "}
              <input
                type="number"
                min="1"
                step="0.01"
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
                placeholder="ex: 14.10"
              />
            </label>

            <label style={{ marginLeft: "16px" }}>
              Vencedor:{" "}
              <select value={winner} onChange={(e) => setWinner(e.target.value)}>
                <option value="blue">Blue</option>
                <option value="red">Red</option>
              </select>
            </label>
          </section>

          <section>
            <h2>CSV ou tabela copiada</h2>

            <p style={{ color: "#94a3b8" }}>
              Os nomes na coluna <strong>player</strong> precisam bater com os
              nicknames cadastrados. Campos opcionais: champion, role, damage e
              vision_score.
            </p>

            <textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              rows={14}
              style={{
                width: "100%",
                fontFamily: "monospace",
                padding: "12px",
                borderRadius: "8px",
              }}
            />
          </section>

          <button type="button" onClick={handlePreview}>
            Pré-visualizar
          </button>

          <button
            type="button"
            onClick={handleImport}
            style={{ marginLeft: "8px" }}
          >
            Importar partida
          </button>

          {error && <p style={{ color: "#f87171" }}>{error}</p>}
          {message && <p style={{ color: "#4ade80" }}>{message}</p>}

          {previewRows.length > 0 && (
            <section>
              <h2>Pré-visualização</h2>

              <DataTable
                columns={previewColumns}
                data={previewRows}
                getRowKey={(row) => `${row.team}-${row.player}`}
              />
            </section>
          )}
        </>
      )}
    </main>
  );
}

export default ImportMatch;