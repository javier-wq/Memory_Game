// Reglas del memorama. Lógica pura, sin DOM, para poder probarla con Node.
(function (root) {
  'use strict';

  var POINTS_MATCH = 100;
  var POINTS_STREAK = 50;
  var POINTS_MISS = 10;
  var SECONDS_PER_PAIR = 15;
  var POINTS_PER_SECOND = 5;

  function shuffle(list, rnd) {
    rnd = rnd || Math.random;
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function card(p, side, pairId) {
    return {
      pairId: pairId, source: p.id, side: side, name: p[side].name, img: p[side].img,
      category: p.category, state: 'down'
    };
  }

  // type 'libre': privativo + su alternativa libre. type 'clasico': dos cartas iguales.
  function buildDeck(pairs, count, rnd, type) {
    var cards = [];
    if (type === 'clasico') {
      var programs = [];
      pairs.forEach(function (p) { programs.push([p, 'priv'], [p, 'libre']); });
      shuffle(programs, rnd).slice(0, count).forEach(function (item) {
        var id = item[0].id + ':' + item[1];
        cards.push(card(item[0], item[1], id), card(item[0], item[1], id));
      });
    } else {
      shuffle(pairs, rnd).slice(0, count).forEach(function (p) {
        cards.push(card(p, 'priv', p.id), card(p, 'libre', p.id));
      });
    }
    return shuffle(cards, rnd);
  }

  // options: { pairs, pairCount, mode: 'solo' | 'duelo', type: 'libre' | 'clasico', players: [nombres], rnd }
  function createGame(options) {
    var names = options.players && options.players.length ? options.players : ['Jugador'];
    var type = options.type === 'clasico' ? 'clasico' : 'libre';
    var byId = {};
    options.pairs.forEach(function (p) { byId[p.id] = p; });
    var cards = buildDeck(options.pairs, options.pairCount, options.rnd, type);
    return {
      mode: options.mode === 'duelo' ? 'duelo' : 'solo',
      type: type,
      cards: cards,
      pairsById: byId,
      totalPairs: cards.length / 2,
      players: names.map(function (n) { return { name: n, pairs: 0 }; }),
      current: 0,
      first: -1,
      pending: null,
      moves: 0,
      misses: 0,
      matches: 0,
      streak: 0,
      bestStreak: 0,
      score: 0,
      timeBonus: 0,
      finished: false
    };
  }

  // Voltea una carta. Devuelve { type: 'ignored' | 'first' | 'match' | 'miss', ... }.
  // Tras un 'miss' el tablero queda bloqueado hasta llamar a resolveMiss().
  function flip(game, index) {
    var card = game.cards[index];
    if (game.finished || game.pending || !card || card.state !== 'down') return { type: 'ignored' };

    card.state = 'up';
    if (game.first < 0) {
      game.first = index;
      return { type: 'first', index: index };
    }

    var a = game.first;
    var other = game.cards[a];
    game.first = -1;
    game.moves++;

    if (other.pairId === card.pairId) {
      other.state = card.state = 'matched';
      game.matches++;
      game.streak++;
      if (game.streak > game.bestStreak) game.bestStreak = game.streak;
      var points = POINTS_MATCH + POINTS_STREAK * (game.streak - 1);
      game.score += points;
      game.players[game.current].pairs++;
      if (game.matches === game.totalPairs) game.finished = true;
      return {
        type: 'match', indexes: [a, index], pair: game.pairsById[card.source], side: card.side,
        points: points, streak: game.streak, player: game.current, finished: game.finished
      };
    }

    game.misses++;
    game.streak = 0;
    var lost = Math.min(POINTS_MISS, game.score);
    game.score -= lost;
    game.pending = [a, index];
    return { type: 'miss', indexes: [a, index], points: -lost, player: game.current };
  }

  // Oculta las dos cartas falladas y, en duelo, pasa el turno. Devuelve el jugador en turno.
  function resolveMiss(game) {
    if (!game.pending) return game.current;
    game.pending.forEach(function (i) { game.cards[i].state = 'down'; });
    game.pending = null;
    if (game.mode === 'duelo') game.current = (game.current + 1) % game.players.length;
    return game.current;
  }

  function stars(game) {
    if (game.misses <= game.totalPairs) return 3;
    if (game.misses <= game.totalPairs * 2) return 2;
    return 1;
  }

  // Cierra la partida: suma el bono de tiempo (solo) y calcula el ganador (duelo).
  function summary(game, seconds) {
    seconds = Math.max(0, Math.round(seconds || 0));
    var result = {
      mode: game.mode, type: game.type, moves: game.moves, misses: game.misses, seconds: seconds,
      bestStreak: game.bestStreak, totalPairs: game.totalPairs
    };
    if (game.mode === 'solo') {
      var bonus = Math.max(0, game.totalPairs * SECONDS_PER_PAIR - seconds) * POINTS_PER_SECOND;
      result.timeBonus = bonus;
      result.score = game.score + bonus;
      result.stars = stars(game);
      return result;
    }
    var best = Math.max.apply(null, game.players.map(function (p) { return p.pairs; }));
    var leaders = game.players.filter(function (p) { return p.pairs === best; });
    result.players = game.players.map(function (p) { return { name: p.name, pairs: p.pairs }; });
    result.tie = leaders.length > 1;
    result.winner = result.tie ? -1 : game.players.indexOf(leaders[0]);
    return result;
  }

  var api = { shuffle: shuffle, createGame: createGame, flip: flip, resolveMiss: resolveMiss, summary: summary };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.MG = root.MG || {};
  root.MG.Game = api;
})(typeof window !== 'undefined' ? window : globalThis);
