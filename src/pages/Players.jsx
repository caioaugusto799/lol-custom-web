import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { supabase } from "../api/supabase";
import DataTable from "../components/DataTable";

function Players() {
  const [players, setPlayers] = useState([]);
  const [user, setUser] = useState(null);

  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const [nickname, setNickname] = useState("");
  const [riotName, setRiotName] = useState("");
  const [tagLine, setTagLine] = useState("");

  const [editingPlayer, setEditingPlayer] = useState(null);
  const [editNickname, setEditNickname] = useState("");
  const [editRiotName, setEditRiotName] = useState("");
  const [editTagLine, setEditTagLine] = useState("");

  const [search, setSearch] = useState("");

  const isLoggedIn = Boolean(user);

  async function loadPlayers() {
    try {
      const { data, error } = await supabase
        .from("players")
        .select("*")
        .order("id", { ascending: true });

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

  async function handleSubmit(e) {
    e.preventDefault();

    setError(null);
    setMessage(null);

    if (!isLoggedIn) {
      setError("Você precisa estar logado para cadastrar jogador.");
      return;
    }

    if (!nickname.trim()) {
      setError("O nickname é obrigatório.");
      return;
    }

    try {
      const { error } = await supabase.from("players").insert({
        nickname,
        riot_name: riotName || null,
        tag_line: tagLine || null,
      });

      if (error) {
        throw error;
      }

      setNickname("");
      setRiotName("");
      setTagLine("");

      setMessage("Jogador cadastrado com sucesso!");
      await loadPlayers();
    } catch (err) {
      console.error(err);
      setError(`Erro ao cadastrar jogador: ${err.message}`);
    }
  }

  function startEditing(player) {
    setEditingPlayer(player);
    setEditNickname(player.nickname || "");
    setEditRiotName(player.riot_name || "");
    setEditTagLine(player.tag_line || "");
    setError(null);
    setMessage(null);
  }

  function cancelEditing() {
    setEditingPlayer(null);
    setEditNickname("");
    setEditRiotName("");
    setEditTagLine("");
  }

  async function handleUpdatePlayer(e) {
    e.preventDefault();

    if (!isLoggedIn) {
      setError("Você precisa estar logado para editar jogador.");
      return;
    }

    if (!editingPlayer) {
      return;
    }

    if (!editNickname.trim()) {
      setError("O nickname é obrigatório.");
      return;
    }

    try {
      const { error } = await supabase
        .from("players")
        .update({
          nickname: editNickname,
          riot_name: editRiotName || null,
          tag_line: editTagLine || null,
        })
        .eq("id", editingPlayer.id);

      if (error) {
        throw error;
      }

      setMessage("Jogador atualizado com sucesso!");
      setError(null);
      cancelEditing();

      await loadPlayers();
    } catch (err) {
      console.error(err);
      setError(`Erro ao atualizar jogador: ${err.message}`);
    }
  }

  async function handleDeletePlayer(player) {
    if (!isLoggedIn) {
      setError("Você precisa estar logado para deletar jogador.");
      return;
    }

    const confirmDelete = window.confirm(
      `Tem certeza que deseja deletar o jogador ${player.nickname}?`
    );

    if (!confirmDelete) {
      return;
    }

    try {
      const { error } = await supabase
        .from("players")
        .delete()
        .eq("id", player.id);

      if (error) {
        throw error;
      }

      setMessage("Jogador deletado com sucesso!");
      setError(null);

      await loadPlayers();
    } catch (err) {
      console.error(err);
      setError(
        `Erro ao deletar jogador: ${err.message}. Talvez ele já tenha partidas cadastradas.`
      );
    }
  }

  const filteredPlayers = players.filter((player) => {
    const searchLower = search.toLowerCase();

    return (
      player.nickname?.toLowerCase().includes(searchLower) ||
      player.riot_name?.toLowerCase().includes(searchLower) ||
      player.tag_line?.toLowerCase().includes(searchLower)
    );
  });

  const columns = [
    { key: "id", label: "ID" },
    { key: "nickname", label: "Nickname" },
    {
      key: "riot_name",
      label: "Riot Name",
      render: (player) => player.riot_name || "-",
    },
    {
      key: "tag_line",
      label: "Tag",
      render: (player) => player.tag_line || "-",
    },
    {
      key: "profile",
      label: "Perfil",
      render: (player) => <Link to={`/players/${player.id}`}>Ver perfil</Link>,
    },
    ...(isLoggedIn
      ? [
          {
            key: "edit",
            label: "Editar",
            render: (player) => (
              <button type="button" onClick={() => startEditing(player)}>
                Editar
              </button>
            ),
          },
          {
            key: "delete",
            label: "Deletar",
            render: (player) => (
              <button type="button" onClick={() => handleDeletePlayer(player)}>
                Deletar
              </button>
            ),
          },
        ]
      : []),
  ];

  return (
    <main>
      <h1>Jogadores</h1>

      {isLoggedIn ? (
        <section>
          <h2>Cadastrar jogador</h2>

          <form onSubmit={handleSubmit}>
            <label>
              Nickname:{" "}
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Caio"
              />
            </label>

            <label style={{ marginLeft: "16px" }}>
              Riot Name:{" "}
              <input
                type="text"
                value={riotName}
                onChange={(e) => setRiotName(e.target.value)}
                placeholder="CaioDantas"
              />
            </label>

            <label style={{ marginLeft: "16px" }}>
              Tag:{" "}
              <input
                type="text"
                value={tagLine}
                onChange={(e) => setTagLine(e.target.value)}
                placeholder="BR1"
              />
            </label>

            <button type="submit" style={{ marginLeft: "16px" }}>
              Cadastrar
            </button>
          </form>
        </section>
      ) : (
        <section>
          <p>
            Você pode visualizar os jogadores, mas precisa entrar na conta para
            cadastrar, editar ou deletar.
          </p>

          <Link to="/login">Entrar</Link>
        </section>
      )}

      {isLoggedIn && editingPlayer && (
        <section>
          <h2>Editar jogador #{editingPlayer.id}</h2>

          <form onSubmit={handleUpdatePlayer}>
            <label>
              Nickname:{" "}
              <input
                type="text"
                value={editNickname}
                onChange={(e) => setEditNickname(e.target.value)}
              />
            </label>

            <label style={{ marginLeft: "16px" }}>
              Riot Name:{" "}
              <input
                type="text"
                value={editRiotName}
                onChange={(e) => setEditRiotName(e.target.value)}
              />
            </label>

            <label style={{ marginLeft: "16px" }}>
              Tag:{" "}
              <input
                type="text"
                value={editTagLine}
                onChange={(e) => setEditTagLine(e.target.value)}
              />
            </label>

            <button type="submit" style={{ marginLeft: "16px" }}>
              Salvar
            </button>

            <button
              type="button"
              onClick={cancelEditing}
              style={{ marginLeft: "8px" }}
            >
              Cancelar
            </button>
          </form>
        </section>
      )}

      {error && <p style={{ color: "#f87171" }}>{error}</p>}
      {message && <p style={{ color: "#4ade80" }}>{message}</p>}

      <section>
        <h2>Buscar jogador</h2>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nickname, Riot Name ou Tag"
          style={{ width: "100%", maxWidth: "400px" }}
        />
      </section>

      <section style={{ marginTop: "24px" }}>
        <h2>Lista de jogadores</h2>

        <DataTable
          columns={columns}
          data={filteredPlayers}
          getRowKey={(player) => player.id}
        />
      </section>
    </main>
  );
}

export default Players;