import { supabase } from "../api/supabase";

export async function loadAllData() {
  const { data: players, error: playersError } = await supabase
    .from("players")
    .select("*")
    .order("id", { ascending: true });

  if (playersError) {
    throw playersError;
  }

  const { data: matches, error: matchesError } = await supabase
    .from("matches")
    .select("*")
    .order("game_date", { ascending: false });

  if (matchesError) {
    throw matchesError;
  }

  const { data: participants, error: participantsError } = await supabase
    .from("match_participants")
    .select(`
      *,
      players (
        id,
        nickname,
        riot_name,
        tag_line
      ),
      matches (
        id,
        game_date,
        duration_seconds,
        patch,
        blue_team_win
      )
    `);

  if (participantsError) {
    throw participantsError;
  }

  return {
    players: players || [],
    matches: matches || [],
    participants: participants || [],
  };
}

export function calculatePlayerStats(player, participants) {
  const playerParticipants = participants.filter(
    (participant) => Number(participant.player_id) === Number(player.id)
  );

  const games = playerParticipants.length;

  if (games === 0) {
    return {
      player_id: player.id,
      nickname: player.nickname,
      riot_name: player.riot_name,
      tag_line: player.tag_line,
      games: 0,
      wins: 0,
      losses: 0,
      win_rate: 0,
      avg_kills: 0,
      avg_deaths: 0,
      avg_assists: 0,
      kda: 0,
      cs_per_min: 0,
      gold_per_min: 0,
      avg_damage: 0,
      avg_vision_score: 0,
    };
  }

  const wins = playerParticipants.filter((p) => p.win).length;
  const losses = games - wins;

  const kills = playerParticipants.reduce((sum, p) => sum + Number(p.kills || 0), 0);
  const deaths = playerParticipants.reduce((sum, p) => sum + Number(p.deaths || 0), 0);
  const assists = playerParticipants.reduce((sum, p) => sum + Number(p.assists || 0), 0);
  const cs = playerParticipants.reduce((sum, p) => sum + Number(p.cs || 0), 0);
  const gold = playerParticipants.reduce((sum, p) => sum + Number(p.gold || 0), 0);
  const damage = playerParticipants.reduce((sum, p) => sum + Number(p.damage || 0), 0);
  const visionScore = playerParticipants.reduce(
    (sum, p) => sum + Number(p.vision_score || 0),
    0
  );

  const totalMinutes = playerParticipants.reduce((sum, p) => {
    const durationSeconds = p.matches?.duration_seconds || 0;
    return sum + durationSeconds / 60;
  }, 0);

  const kda = deaths === 0 ? kills + assists : (kills + assists) / deaths;

  return {
    player_id: player.id,
    nickname: player.nickname,
    riot_name: player.riot_name,
    tag_line: player.tag_line,
    games,
    wins,
    losses,
    win_rate: round((wins / games) * 100),
    avg_kills: round(kills / games),
    avg_deaths: round(deaths / games),
    avg_assists: round(assists / games),
    kda: round(kda),
    cs_per_min: totalMinutes > 0 ? round(cs / totalMinutes) : 0,
    gold_per_min: totalMinutes > 0 ? round(gold / totalMinutes) : 0,
    avg_damage: round(damage / games),
    avg_vision_score: round(visionScore / games),
  };
}

export function calculateAllPlayerStats(players, participants, minGames = 1) {
  return players
    .map((player) => calculatePlayerStats(player, participants))
    .filter((stats) => stats.games >= minGames);
}

export function calculateSummary(players, matches, participants) {
  const championsUsed = new Set();
  const patches = new Set();

  let totalDurationSeconds = 0;
  let totalKills = 0;
  let blueWins = 0;
  let redWins = 0;

  matches.forEach((match) => {
    totalDurationSeconds += Number(match.duration_seconds || 0);

    if (match.patch) {
      patches.add(match.patch);
    }

    if (match.blue_team_win) {
      blueWins += 1;
    } else {
      redWins += 1;
    }
  });

  participants.forEach((participant) => {
    if (participant.champion) {
      championsUsed.add(participant.champion);
    }

    totalKills += Number(participant.kills || 0);
  });

  const totalMatches = matches.length;

  return {
    totals: {
      players: players.length,
      matches: matches.length,
      participations: participants.length,
      champions_used: championsUsed.size,
      patches: patches.size,
    },
    matches: {
      avg_duration_minutes:
        totalMatches > 0 ? round((totalDurationSeconds / totalMatches) / 60) : 0,
      avg_kills_per_match:
        totalMatches > 0 ? round(totalKills / totalMatches) : 0,
      blue_wins: blueWins,
      red_wins: redWins,
      blue_win_rate:
        totalMatches > 0 ? round((blueWins / totalMatches) * 100) : 0,
      red_win_rate:
        totalMatches > 0 ? round((redWins / totalMatches) * 100) : 0,
    },
    champions: {
      used: Array.from(championsUsed).sort(),
    },
    patches: Array.from(patches).sort(),
  };
}

export function calculateChampionStats(participants, minGames = 1) {
  const champions = {};

  participants.forEach((participant) => {
    const championName = participant.champion;

    if (!championName) {
      return;
    }

    if (!champions[championName]) {
      champions[championName] = {
        champion: championName,
        games: 0,
        wins: 0,
        losses: 0,
        kills: 0,
        deaths: 0,
        assists: 0,
        cs: 0,
        gold: 0,
        damage: 0,
        vision_score: 0,
        minutes: 0,
      };
    }

    const champion = champions[championName];

    champion.games += 1;
    champion.wins += participant.win ? 1 : 0;
    champion.losses += participant.win ? 0 : 1;
    champion.kills += Number(participant.kills || 0);
    champion.deaths += Number(participant.deaths || 0);
    champion.assists += Number(participant.assists || 0);
    champion.cs += Number(participant.cs || 0);
    champion.gold += Number(participant.gold || 0);
    champion.damage += Number(participant.damage || 0);
    champion.vision_score += Number(participant.vision_score || 0);
    champion.minutes += Number(participant.matches?.duration_seconds || 0) / 60;
  });

  return Object.values(champions)
    .filter((champion) => champion.games >= minGames)
    .map((champion) => {
      const kda =
        champion.deaths === 0
          ? champion.kills + champion.assists
          : (champion.kills + champion.assists) / champion.deaths;

      return {
        champion: champion.champion,
        games: champion.games,
        wins: champion.wins,
        losses: champion.losses,
        win_rate: round((champion.wins / champion.games) * 100),
        avg_kills: round(champion.kills / champion.games),
        avg_deaths: round(champion.deaths / champion.games),
        avg_assists: round(champion.assists / champion.games),
        kda: round(kda),
        cs_per_min: champion.minutes > 0 ? round(champion.cs / champion.minutes) : 0,
        gold_per_min:
          champion.minutes > 0 ? round(champion.gold / champion.minutes) : 0,
        avg_damage: round(champion.damage / champion.games),
        avg_vision_score: round(champion.vision_score / champion.games),
      };
    });
}

export function calculateHighlights(players, matches, participants) {
  const playerStats = calculateAllPlayerStats(players, participants, 1);
  const championStats = calculateChampionStats(participants, 1);

  return {
    players: {
      most_games: bestBy(playerStats, "games"),
      best_win_rate: bestBy(playerStats, "win_rate"),
      best_kda: bestBy(playerStats, "kda"),
      best_cs_per_min: bestBy(playerStats, "cs_per_min"),
      best_gold_per_min: bestBy(playerStats, "gold_per_min"),
      best_avg_damage: bestBy(playerStats, "avg_damage"),
      best_avg_vision_score: bestBy(playerStats, "avg_vision_score"),
    },
    champions: {
      most_played: bestBy(championStats, "games"),
      best_win_rate: bestBy(championStats, "win_rate"),
      best_kda: bestBy(championStats, "kda"),
      best_cs_per_min: bestBy(championStats, "cs_per_min"),
      best_gold_per_min: bestBy(championStats, "gold_per_min"),
      best_avg_damage: bestBy(championStats, "avg_damage"),
    },
  };
}

export function sortAndRank(items, sortBy) {
  return [...items]
    .sort((a, b) => Number(b[sortBy] || 0) - Number(a[sortBy] || 0))
    .map((item, index) => ({
      ...item,
      position: index + 1,
    }));
}

function bestBy(items, field) {
  if (!items || items.length === 0) {
    return null;
  }

  return [...items].sort(
    (a, b) => Number(b[field] || 0) - Number(a[field] || 0)
  )[0];
}

function round(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

export function calculateRoleStats(participants, minGames = 1) {
  const roles = {};

  participants.forEach((participant) => {
    const roleName = participant.role || "unknown";

    if (!roles[roleName]) {
      roles[roleName] = {
        role: roleName,
        games: 0,
        wins: 0,
        losses: 0,
        kills: 0,
        deaths: 0,
        assists: 0,
        cs: 0,
        gold: 0,
        damage: 0,
        vision_score: 0,
        minutes: 0,
      };
    }

    const role = roles[roleName];

    role.games += 1;
    role.wins += participant.win ? 1 : 0;
    role.losses += participant.win ? 0 : 1;
    role.kills += Number(participant.kills || 0);
    role.deaths += Number(participant.deaths || 0);
    role.assists += Number(participant.assists || 0);
    role.cs += Number(participant.cs || 0);
    role.gold += Number(participant.gold || 0);
    role.damage += Number(participant.damage || 0);
    role.vision_score += Number(participant.vision_score || 0);
    role.minutes += Number(participant.matches?.duration_seconds || 0) / 60;
  });

  return Object.values(roles)
    .filter((role) => role.games >= minGames)
    .map((role) => {
      const kda =
        role.deaths === 0
          ? role.kills + role.assists
          : (role.kills + role.assists) / role.deaths;

      return {
        role: role.role,
        games: role.games,
        wins: role.wins,
        losses: role.losses,
        win_rate: round((role.wins / role.games) * 100),
        avg_kills: round(role.kills / role.games),
        avg_deaths: round(role.deaths / role.games),
        avg_assists: round(role.assists / role.games),
        kda: round(kda),
        cs_per_min: role.minutes > 0 ? round(role.cs / role.minutes) : 0,
        gold_per_min: role.minutes > 0 ? round(role.gold / role.minutes) : 0,
        avg_damage: round(role.damage / role.games),
        avg_vision_score: round(role.vision_score / role.games),
      };
    });
}

export function calculatePlayerChampionStats(playerId, participants, minGames = 1) {
  const playerParticipants = participants.filter(
    (participant) => Number(participant.player_id) === Number(playerId)
  );

  const champions = {};

  playerParticipants.forEach((participant) => {
    const championName = participant.champion;

    if (!championName) {
      return;
    }

    if (!champions[championName]) {
      champions[championName] = {
        champion: championName,
        games: 0,
        wins: 0,
        losses: 0,
        kills: 0,
        deaths: 0,
        assists: 0,
        cs: 0,
        gold: 0,
        damage: 0,
        vision_score: 0,
        minutes: 0,
      };
    }

    const champion = champions[championName];

    champion.games += 1;
    champion.wins += participant.win ? 1 : 0;
    champion.losses += participant.win ? 0 : 1;
    champion.kills += Number(participant.kills || 0);
    champion.deaths += Number(participant.deaths || 0);
    champion.assists += Number(participant.assists || 0);
    champion.cs += Number(participant.cs || 0);
    champion.gold += Number(participant.gold || 0);
    champion.damage += Number(participant.damage || 0);
    champion.vision_score += Number(participant.vision_score || 0);
    champion.minutes += Number(participant.matches?.duration_seconds || 0) / 60;
  });

  return Object.values(champions)
    .filter((champion) => champion.games >= minGames)
    .map((champion) => {
      const kda =
        champion.deaths === 0
          ? champion.kills + champion.assists
          : (champion.kills + champion.assists) / champion.deaths;

      return {
        champion: champion.champion,
        games: champion.games,
        wins: champion.wins,
        losses: champion.losses,
        win_rate: round((champion.wins / champion.games) * 100),
        avg_kills: round(champion.kills / champion.games),
        avg_deaths: round(champion.deaths / champion.games),
        avg_assists: round(champion.assists / champion.games),
        kda: round(kda),
        cs_per_min:
          champion.minutes > 0 ? round(champion.cs / champion.minutes) : 0,
        gold_per_min:
          champion.minutes > 0 ? round(champion.gold / champion.minutes) : 0,
        avg_damage: round(champion.damage / champion.games),
        avg_vision_score: round(champion.vision_score / champion.games),
      };
    });
}

export function calculateHeadToHead(playerAId, playerBId, players, participants) {
  const playerA = players.find(
    (player) => Number(player.id) === Number(playerAId)
  );

  const playerB = players.find(
    (player) => Number(player.id) === Number(playerBId)
  );

  if (!playerA || !playerB) {
    throw new Error("Um ou ambos os jogadores não foram encontrados.");
  }

  const matchesMap = {};

  participants.forEach((participant) => {
    const matchId = participant.match_id;

    if (!matchesMap[matchId]) {
      matchesMap[matchId] = [];
    }

    matchesMap[matchId].push(participant);
  });

  const matchesAgainst = [];
  const matchesTogether = [];

  let againstGames = 0;
  let playerAWins = 0;
  let playerBWins = 0;

  let togetherGames = 0;
  let togetherWins = 0;

  let playerAKillsAgainst = 0;
  let playerADeathsAgainst = 0;
  let playerAAssistsAgainst = 0;

  let playerBKillsAgainst = 0;
  let playerBDeathsAgainst = 0;
  let playerBAssistsAgainst = 0;

  Object.values(matchesMap).forEach((matchParticipants) => {
    const participantA = matchParticipants.find(
      (participant) => Number(participant.player_id) === Number(playerAId)
    );

    const participantB = matchParticipants.find(
      (participant) => Number(participant.player_id) === Number(playerBId)
    );

    if (!participantA || !participantB) {
      return;
    }

    const sameTeam = participantA.team === participantB.team;
    const matchInfo = participantA.matches || participantB.matches;

    const formattedMatch = {
      match_id: participantA.match_id,
      game_date: matchInfo?.game_date,
      winner: matchInfo?.blue_team_win ? "blue" : "red",
      player_a: {
        champion: participantA.champion,
        kills: participantA.kills,
        deaths: participantA.deaths,
        assists: participantA.assists,
      },
      player_b: {
        champion: participantB.champion,
        kills: participantB.kills,
        deaths: participantB.deaths,
        assists: participantB.assists,
      },
    };

    if (sameTeam) {
      togetherGames += 1;

      if (participantA.win && participantB.win) {
        togetherWins += 1;
      }

      matchesTogether.push({
        ...formattedMatch,
        team: participantA.team,
        win: participantA.win && participantB.win,
      });
    } else {
      againstGames += 1;

      if (participantA.win) {
        playerAWins += 1;
      }

      if (participantB.win) {
        playerBWins += 1;
      }

      playerAKillsAgainst += Number(participantA.kills || 0);
      playerADeathsAgainst += Number(participantA.deaths || 0);
      playerAAssistsAgainst += Number(participantA.assists || 0);

      playerBKillsAgainst += Number(participantB.kills || 0);
      playerBDeathsAgainst += Number(participantB.deaths || 0);
      playerBAssistsAgainst += Number(participantB.assists || 0);

      matchesAgainst.push(formattedMatch);
    }
  });

  const playerAKda =
    playerADeathsAgainst === 0
      ? playerAKillsAgainst + playerAAssistsAgainst
      : (playerAKillsAgainst + playerAAssistsAgainst) / playerADeathsAgainst;

  const playerBKda =
    playerBDeathsAgainst === 0
      ? playerBKillsAgainst + playerBAssistsAgainst
      : (playerBKillsAgainst + playerBAssistsAgainst) / playerBDeathsAgainst;

  return {
    players: {
      player_a: {
        id: playerA.id,
        nickname: playerA.nickname,
      },
      player_b: {
        id: playerB.id,
        nickname: playerB.nickname,
      },
    },
    against: {
      games: againstGames,
      player_a_wins: playerAWins,
      player_b_wins: playerBWins,
      player_a_win_rate:
        againstGames > 0 ? round((playerAWins / againstGames) * 100) : 0,
      player_b_win_rate:
        againstGames > 0 ? round((playerBWins / againstGames) * 100) : 0,
      player_a_kda: round(playerAKda),
      player_b_kda: round(playerBKda),
    },
    together: {
      games: togetherGames,
      wins: togetherWins,
      losses: togetherGames - togetherWins,
      win_rate:
        togetherGames > 0 ? round((togetherWins / togetherGames) * 100) : 0,
    },
    matches_against: matchesAgainst,
    matches_together: matchesTogether,
  };
}