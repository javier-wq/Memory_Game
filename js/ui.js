// Interfaz: pantallas, tablero, marcador, Tux y efectos.
(function () {
  'use strict';

  var Data = window.MG.Data;
  var Game = window.MG.Game;
  var Records = window.MG.Records;
  var Sound = window.MG.Audio;

  var FLIP_MS = 400;
  var MISS_SHOW_MS = 1250;
  var FINISH_MS = 1400;
  var CARD_RATIO = 0.82;

  var reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  var state = {
    mode: 'solo',
    type: 'libre',
    level: 'facil',
    names: ['Jugador 1', 'Jugador 2'],
    game: null,
    timers: [],
    clock: 0,
    startedAt: 0,
    seconds: 0,
    summary: null,
    recordsLevel: 'facil',
    recordsType: 'libre',
    cols: 4
  };

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }

  // Los récords del clásico se guardan aparte; los de libre vs. privativo conservan la clave original.
  function recordKey(type, level) { return (type === 'clasico' ? 'clasico-' : '') + level; }

  function formatTime(seconds) {
    var s = seconds % 60;
    return Math.floor(seconds / 60) + ':' + (s < 10 ? '0' : '') + s;
  }

  function replay(node, cls) {
    node.classList.remove(cls);
    void node.offsetWidth;
    node.classList.add(cls);
  }

  var board = $('#board');
  var boardWrap = $('#board-wrap');
  var screenGame = $('#juego');
  var guideBubble = $('#guide-bubble');
  var guideTux = $('#guide-tux');

  /* ---------- Pantallas ---------- */

  function show(id) {
    $$('.screen').forEach(function (s) { s.classList.toggle('is-active', s.id === id); });
    document.body.dataset.screen = id;
    window.scrollTo(0, 0);
    if (id === 'records') renderRecords();
    if (id === 'juego') layoutBoard();
    var title = $('#' + id + ' [tabindex="-1"]');
    if (title) title.focus({ preventScroll: true });
  }

  function leaveGame() {
    clearTimers();
    stopClock();
    stopConfetti();
    state.game = null;
  }

  /* ---------- Tux ---------- */

  function say(bubble, tux, content, mood) {
    bubble.textContent = '';
    if (typeof content === 'string') bubble.textContent = content;
    else bubble.appendChild(content);
    replay(bubble, 'pop');
    if (mood && tux) {
      tux.classList.remove('is-happy', 'is-sad');
      void tux.offsetWidth;
      tux.classList.add('is-' + mood);
    }
  }

  function guide(content, mood) { say(guideBubble, guideTux, content, mood); }

  function matchMessage(pair, prefix) {
    var box = document.createDocumentFragment();
    var logos = el('span', 'bubble-pair');
    var a = el('img'); a.src = pair.priv.img; a.alt = '';
    var b = el('img'); b.src = pair.libre.img; b.alt = '';
    logos.appendChild(a);
    logos.appendChild(el('span', 'bubble-arrow', '➜'));
    logos.appendChild(b);
    box.appendChild(logos);
    box.appendChild(el('strong', 'bubble-title', prefix + pair.priv.name + ' ➜ ' + pair.libre.name));
    box.appendChild(el('span', 'bubble-fact', pair.fact));
    return box;
  }

  // En el clásico se muestra el programa encontrado y con qué se empareja en el otro tipo.
  function classicMessage(pair, side, prefix) {
    var box = document.createDocumentFragment();
    var logos = el('span', 'bubble-pair');
    var img = el('img'); img.src = pair[side].img; img.alt = '';
    logos.appendChild(img);
    box.appendChild(logos);
    box.appendChild(el('strong', 'bubble-title', prefix + pair[side].name));
    box.appendChild(el('span', 'bubble-fact', side === 'libre'
      ? pair.libre.name + ' es software libre 🔓. Reemplaza a ' + pair.priv.name + '.'
      : pair.priv.name + ' es privativo 🔒. Su alternativa libre es ' + pair.libre.name + '.'));
    return box;
  }

  var HOME_TIPS = [
    '¡Hola! Soy Tux, el pingüino de Linux. ¿Jugamos?',
    'El software libre se puede usar, estudiar, compartir y mejorar.',
    '¿Sabías que Linux puede revivir computadoras viejas?',
    'Reta a un amigo en el modo Duelo. ¡Quien acierta repite turno!',
    'LibreOffice, GIMP y Firefox son libres. ¡Y son de todos!'
  ];
  var MISS_TIPS = ['¡Casi! Inténtalo otra vez.', '¡Uy! Recuerda dónde estaban.', 'No pasa nada, ¡tú puedes!', '¡Estuvo cerca! Sigue buscando.'];
  var homeTip = 0;

  function nextHomeTip(mood) {
    homeTip = (homeTip + 1) % HOME_TIPS.length;
    say($('#home-bubble'), $('#home-tux .tux'), HOME_TIPS[homeTip], mood);
  }

  /* ---------- Partida ---------- */

  function later(fn, ms) {
    var game = state.game;
    state.timers.push(setTimeout(function () {
      if (state.game === game) fn();
    }, ms));
  }

  function clearTimers() {
    state.timers.forEach(clearTimeout);
    state.timers = [];
  }

  function startClock() {
    if (state.startedAt) return;
    state.startedAt = Date.now();
    state.clock = setInterval(tick, 500);
  }

  function tick() {
    state.seconds = Math.floor((Date.now() - state.startedAt) / 1000);
    $('#hud-tiempo').textContent = formatTime(state.seconds);
  }

  function stopClock() {
    if (state.startedAt && state.clock) tick();
    clearInterval(state.clock);
    state.clock = 0;
  }

  function startGame() {
    leaveGame();
    var level = Data.LEVELS[state.level];
    state.game = Game.createGame({
      pairs: Data.PAIRS,
      pairCount: level.pairs,
      mode: state.mode,
      type: state.type,
      players: state.mode === 'duelo' ? state.names : ['Jugador']
    });
    state.startedAt = 0;
    state.seconds = 0;
    state.summary = null;

    renderBoard();
    renderHud(true);
    show('juego');
    guide(state.mode === 'duelo'
      ? 'Empieza el ' + state.names[0] + '. ¡Quien acierta repite turno!'
      : state.type === 'clasico'
        ? 'Encuentra las dos cartas iguales de cada programa.'
        : 'Une cada programa privativo 🔒 con su alternativa libre 🔓.', 'happy');
  }

  function cardLabel(card, index) {
    if (card.state === 'down') return 'Carta ' + (index + 1) + ', boca abajo';
    var kind = card.side === 'libre' ? 'software libre' : 'software privativo';
    return card.name + ', ' + kind + ', ' + card.category + (card.state === 'matched' ? ', pareja encontrada' : '');
  }

  function renderBoard() {
    var frag = document.createDocumentFragment();
    state.game.cards.forEach(function (card, i) {
      var btn = el('button', 'card');
      btn.type = 'button';
      btn.dataset.index = i;
      btn.style.setProperty('--i', i);
      btn.setAttribute('aria-label', cardLabel(card, i));

      var inner = el('span', 'card-inner');
      var back = el('span', 'card-face card-back');
      back.appendChild(el('span', 'card-q', '?'));

      var front = el('span', 'card-face card-front ' + card.side);
      front.appendChild(el('span', 'card-tag', card.side === 'libre' ? '🔓 Libre' : '🔒 Privativo'));
      var logo = el('span', 'card-logo');
      var img = el('img');
      img.src = card.img;
      img.alt = '';
      img.draggable = false;
      img.dataset.name = card.name;
      logo.appendChild(img);
      front.appendChild(logo);
      front.appendChild(el('span', 'card-name', card.name));
      front.appendChild(el('span', 'card-cat', card.category));

      inner.appendChild(back);
      inner.appendChild(front);
      btn.appendChild(inner);
      frag.appendChild(btn);
    });

    board.textContent = '';
    board.appendChild(frag);
    board.classList.add('is-dealing');
    later(function () { board.classList.remove('is-dealing'); }, state.game.cards.length * 45 + 600);
  }

  // Calcula el tamaño de carta más grande que cabe sin desplazarse.
  function layoutBoard() {
    if (!state.game) return;
    var level = Data.LEVELS[state.level];
    var style = window.getComputedStyle(boardWrap);
    var w = boardWrap.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    var h = boardWrap.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
    if (w <= 0 || h <= 0) return;

    var cols = level.cols;
    var rows = level.rows;
    if (h > w) { cols = level.rows; rows = level.cols; }

    var gap = Math.round(Math.max(8, Math.min(16, Math.min(w, h) * 0.02)));
    var byWidth = (w - gap * (cols - 1)) / cols;
    var byHeight = ((h - gap * (rows - 1)) / rows - 6) * CARD_RATIO;
    var size = Math.floor(Math.max(64, Math.min(byWidth, byHeight, 230)));

    state.cols = cols;
    board.style.setProperty('--cols', cols);
    board.style.setProperty('--gap', gap + 'px');
    board.style.setProperty('--card-w', size + 'px');
  }

  function setText(node, value, animate) {
    value = String(value);
    if (node.textContent === value) return;
    node.textContent = value;
    if (animate) replay(node, 'bump');
  }

  function renderHud(first) {
    var game = state.game;
    var duel = game.mode === 'duelo';
    $('#hud-solo').hidden = duel;
    $('#hud-duelo').hidden = !duel;

    if (!duel) {
      screenGame.removeAttribute('data-turn');
      setText($('#hud-puntos'), game.score, !first);
      setText($('#hud-parejas'), game.matches + '/' + game.totalPairs, !first);
      setText($('#hud-intentos'), game.moves, false);
      if (first) $('#hud-tiempo').textContent = '0:00';
      return;
    }

    screenGame.dataset.turn = game.current;
    game.players.forEach(function (player, i) {
      var box = $('#hud-p' + (i + 1));
      box.classList.toggle('is-active', game.current === i && !game.finished);
      $('.player-name', box).textContent = player.name;
      setText($('.player-score', box), player.pairs, !first);
    });
  }

  function cardAt(index) { return board.children[index]; }

  function burst(card) {
    if (reduced) return;
    var colors = ['#ffd23f', '#3ddc84', '#5fd3ff', '#ff5fa8', '#ff9838'];
    for (var i = 0; i < 8; i++) {
      var angle = (Math.PI * 2 * i) / 8 + Math.random() * 0.5;
      var dist = 5 + Math.random() * 3;
      var s = el('span', 'spark');
      s.style.setProperty('--dx', (Math.cos(angle) * dist).toFixed(2) + 'em');
      s.style.setProperty('--dy', (Math.sin(angle) * dist).toFixed(2) + 'em');
      s.style.setProperty('--c', colors[i % colors.length]);
      card.appendChild(s);
    }
  }

  function floatPoints(card, text) {
    if (reduced) return;
    card.appendChild(el('span', 'float-pts', text));
  }

  function onFlip(index) {
    var game = state.game;
    if (!game) return;
    var result = Game.flip(game, index);
    if (result.type === 'ignored') return;

    startClock();
    var btn = cardAt(index);
    btn.classList.add('is-up');
    btn.setAttribute('aria-label', cardLabel(game.cards[index], index));
    Sound.flip();

    if (result.type === 'first') {
      guide(game.type === 'clasico'
        ? '¿Dónde estará la otra carta de «' + game.cards[index].name + '»?'
        : '¿Dónde estará su pareja de «' + game.cards[index].category + '»?');
      return;
    }

    var cards = result.indexes.map(cardAt);

    if (result.type === 'match') {
      if (result.finished) stopClock();
      later(function () {
        cards.forEach(function (c, k) {
          c.classList.add('is-matched');
          if (game.mode === 'duelo') c.dataset.owner = result.player;
          c.setAttribute('aria-label', cardLabel(game.cards[result.indexes[k]], result.indexes[k]));
          burst(c);
        });
        floatPoints(cards[1], game.mode === 'duelo' ? '+1' : '+' + result.points);
        Sound.match(result.streak);
        var prefix = result.streak > 1 ? '¡Racha x' + result.streak + '! ' : '¡Pareja! ';
        guide(game.type === 'clasico'
          ? classicMessage(result.pair, result.side, prefix)
          : matchMessage(result.pair, prefix), 'happy');
        renderHud();
        if (result.finished) later(finish, FINISH_MS);
      }, FLIP_MS);
      return;
    }

    renderHud();
    later(function () {
      cards.forEach(function (c) { c.classList.add('is-wrong'); });
      Sound.miss();
      var next = game.players[(game.current + 1) % game.players.length].name;
      guide(game.mode === 'duelo' ? '¡Casi! Ahora le toca al ' + next + '.' : pick(MISS_TIPS), 'sad');
    }, FLIP_MS);
    later(function () {
      Game.resolveMiss(game);
      cards.forEach(function (c, k) {
        c.classList.remove('is-up', 'is-wrong');
        c.setAttribute('aria-label', cardLabel(game.cards[result.indexes[k]], result.indexes[k]));
      });
      renderHud();
    }, MISS_SHOW_MS);
  }

  /* ---------- Resultado ---------- */

  function countUp(node, to) {
    if (reduced || to <= 0) { node.textContent = to; return; }
    var start = performance.now();
    var dur = 1000;
    (function step(now) {
      var t = Math.min(1, (now - start) / dur);
      node.textContent = Math.round(to * (1 - Math.pow(1 - t, 3)));
      if (t < 1) requestAnimationFrame(step);
    })(start);
  }

  function formatDate(ms) {
    var d = new Date(ms);
    var months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    var min = d.getMinutes();
    return d.getDate() + ' ' + months[d.getMonth()] + ' · ' + d.getHours() + ':' + (min < 10 ? '0' : '') + min;
  }

  function chip(text, cls) { return el('span', 'chip' + (cls ? ' ' + cls : ''), text); }

  function finish() {
    var game = state.game;
    var s = Game.summary(game, state.seconds);
    state.summary = s;

    var stars = $('#resultado-estrellas');
    var score = $('#resultado-puntos');
    var stats = $('#resultado-datos');
    var done = $('#record-listo');
    stars.textContent = '';
    score.textContent = '';
    stats.textContent = '';
    done.hidden = true;

    if (s.mode === 'solo') {
      stars.hidden = false;
      for (var i = 0; i < 3; i++) {
        var star = el('span', 'star' + (i < s.stars ? ' on' : ''), '★');
        star.style.setProperty('--i', i);
        stars.appendChild(star);
      }
      $('#resultado-titulo').textContent = ['¡Lo lograste!', '¡Muy bien!', '¡Increíble!'][s.stars - 1];
      $('#resultado-sub').textContent = s.type === 'clasico'
        ? 'Encontraste las ' + s.totalPairs + ' parejas del memorama clásico.'
        : 'Encontraste las ' + s.totalPairs + ' parejas de software libre.';

      var big = el('span', 'score-big', '0');
      score.className = 'result-score';
      score.appendChild(big);
      score.appendChild(el('span', 'score-label', 'puntos'));
      countUp(big, s.score);

      stats.appendChild(chip('⏱ ' + formatTime(s.seconds)));
      stats.appendChild(chip('🎯 ' + s.moves + ' intentos'));
      if (s.bestStreak > 1) stats.appendChild(chip('🔥 Racha de ' + s.bestStreak));
      if (s.timeBonus > 0) stats.appendChild(chip('⚡ Bono de tiempo +' + s.timeBonus, 'gold'));

      var key = recordKey(s.type, state.level);
      if (Records.qualifies(key, s.score)) {
        var pos = Records.add(key, { score: s.score, moves: s.moves, seconds: s.seconds });
        done.textContent = '¡Nuevo récord! Quedaste en el puesto #' + pos + ' 🏅';
        done.hidden = false;
        state.recordsType = s.type;
        state.recordsLevel = state.level;
      }
    } else {
      stars.hidden = true;
      $('#resultado-titulo').textContent = s.tie ? '🤝 ¡Empate!' : '🏆 ¡Ganó el ' + s.players[s.winner].name + '!';
      $('#resultado-sub').textContent = s.tie ? '¡Qué duelo tan parejo! ¿Juegan la revancha?' : '¡Gran duelo! ¿Juegan la revancha?';

      score.className = 'result-score duel-result';
      s.players.forEach(function (p, i) {
        var box = el('div', 'duel-box p' + (i + 1) + (s.winner === i ? ' is-winner' : ''));
        box.appendChild(el('b', '', p.name));
        box.appendChild(el('span', '', p.pairs));
        box.appendChild(el('small', '', p.pairs === 1 ? 'pareja' : 'parejas'));
        score.appendChild(box);
        if (i === 0) score.appendChild(el('span', 'vs', 'VS'));
      });
      stats.appendChild(chip('⏱ ' + formatTime(s.seconds)));
      stats.appendChild(chip('🎯 ' + s.moves + ' intentos'));
    }

    show('resultado');
    replay($('.result-tux'), 'is-happy');
    Sound.win();
    confetti();
  }

  /* ---------- Récords y Aprende ---------- */

  function renderRecords() {
    var panel = $('#records-panel');
    $$('#records-tipo [role="tab"]').forEach(function (tab) {
      var on = tab.dataset.type === state.recordsType;
      tab.setAttribute('aria-selected', on ? 'true' : 'false');
      tab.tabIndex = on ? 0 : -1;
    });
    $$('#records-tabs [role="tab"]').forEach(function (tab) {
      var on = tab.dataset.level === state.recordsLevel;
      tab.setAttribute('aria-selected', on ? 'true' : 'false');
      tab.tabIndex = on ? 0 : -1;
      if (on) panel.setAttribute('aria-labelledby', tab.id);
    });

    var rows = Records.list(recordKey(state.recordsType, state.recordsLevel));
    panel.textContent = '';
    if (!rows.length) {
      var empty = el('p', 'empty');
      empty.appendChild(el('span', '', '🐧'));
      empty.appendChild(document.createTextNode('Aún no hay récords en este nivel. ¡Sé el primero!'));
      panel.appendChild(empty);
      return;
    }

    var medals = ['🥇', '🥈', '🥉'];
    var list = el('ol', 'rank');
    rows.forEach(function (row, i) {
      var li = el('li');
      li.style.setProperty('--i', i);
      li.appendChild(el('span', 'rank-pos', medals[i] || i + 1));
      var info = el('span', 'rank-name', '⏱ ' + formatTime(row.seconds) + ' · ' + row.moves + ' intentos');
      if (row.date) info.appendChild(el('small', '', formatDate(row.date)));
      li.appendChild(info);
      li.appendChild(el('span', 'rank-score', row.score));
      list.appendChild(li);
    });
    panel.appendChild(list);
    replay(panel, 'tab-panel');
  }

  function renderLearn() {
    var freedoms = $('#libertades');
    Data.FREEDOMS.forEach(function (f) {
      var li = el('li');
      var text = el('span');
      text.appendChild(el('b', '', f.title));
      text.appendChild(document.createTextNode(f.text));
      li.appendChild(text);
      freedoms.appendChild(li);
    });

    var compare = $('#comparativa');
    Data.PAIRS.forEach(function (pair) {
      var li = el('li');
      ['priv', 'libre'].forEach(function (side, i) {
        var item = el('span', 'compare-item ' + side);
        var img = el('img');
        img.src = pair[side].img;
        img.alt = '';
        img.loading = 'lazy';
        item.appendChild(img);
        item.appendChild(document.createTextNode(pair[side].name));
        li.appendChild(item);
        if (i === 0) li.appendChild(el('span', 'compare-arrow', '➜'));
      });
      li.appendChild(el('span', 'compare-cat', pair.category));
      compare.appendChild(li);
    });
  }

  function initTabs(list, onSelect) {
    var tabs = $$('[role="tab"]', list);

    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
      });
      if (focus) tab.focus();
      Sound.click();
      onSelect(tab);
    }

    list.addEventListener('click', function (e) {
      var tab = e.target.closest('[role="tab"]');
      if (tab) select(tab, false);
    });
    list.addEventListener('keydown', function (e) {
      var i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      var next = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : -2;
      if (next === -2) return;
      e.preventDefault();
      select(tabs[(next + tabs.length) % tabs.length], true);
    });
  }

  /* ---------- Diálogo ---------- */

  var dialog = $('#dialogo');
  var dialogOk = null;

  function ask(message, okLabel, onOk) {
    if (!dialog.showModal) {
      if (window.confirm(message)) onOk();
      return;
    }
    $('#dialogo-texto').textContent = message;
    $('#dialogo-si').textContent = okLabel;
    dialogOk = onOk;
    dialog.showModal();
    $('#dialogo-no').focus();
  }

  /* ---------- Confeti ---------- */

  var canvas = $('#confetti');
  var confettiFrame = 0;

  function stopConfetti() {
    cancelAnimationFrame(confettiFrame);
    confettiFrame = 0;
    canvas.classList.remove('is-on');
  }

  function confetti() {
    stopConfetti();
    if (reduced || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = window.innerWidth;
    var H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    canvas.classList.add('is-on');

    var colors = ['#ffd23f', '#3ddc84', '#5fd3ff', '#ff5fa8', '#ff9838', '#ffffff'];
    var parts = [];
    for (var i = 0; i < 150; i++) {
      parts.push({
        x: Math.random() * W, y: -20 - Math.random() * H * 0.6,
        vx: (Math.random() - 0.5) * 3, vy: 2 + Math.random() * 4,
        w: 7 + Math.random() * 8, h: 5 + Math.random() * 6,
        r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3,
        sway: Math.random() * Math.PI * 2, c: colors[i % colors.length]
      });
    }

    var last = performance.now();
    function frame(now) {
      var dt = Math.min(2.5, (now - last) / 16.67);
      last = now;
      var alive = 0;
      ctx.clearRect(0, 0, W, H);
      for (var k = 0; k < parts.length; k++) {
        var p = parts[k];
        if (p.y > H + 30) continue;
        alive++;
        p.sway += 0.05 * dt;
        p.x += (p.vx + Math.sin(p.sway) * 1.2) * dt;
        p.y += p.vy * dt;
        p.r += p.vr * dt;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.sway)) + 1);
        ctx.restore();
      }
      if (alive) confettiFrame = requestAnimationFrame(frame);
      else stopConfetti();
    }
    confettiFrame = requestAnimationFrame(frame);
  }

  /* ---------- Eventos ---------- */

  function openConfig(mode) {
    state.mode = mode;
    var duel = mode === 'duelo';
    $('#config-titulo').textContent = duel ? '⚔️ Duelo' : '🎮 Jugar solo';
    $('#config-sub').textContent = duel
      ? 'Dos jugadores, por turnos. Gana quien encuentre más parejas.'
      : 'Elige un nivel y encuentra todas las parejas.';
    show('config');
  }

  function gameInProgress() {
    return state.game && !state.game.finished && (state.game.moves > 0 || state.game.first >= 0);
  }

  function bind() {
    document.addEventListener('click', function (e) {
      var target = e.target.closest('[data-mode], [data-go]');
      if (!target) return;
      Sound.click();
      if (target.dataset.mode) { openConfig(target.dataset.mode); return; }
      leaveGame();
      show(target.dataset.go);
    });

    $('#config-form').addEventListener('submit', function (e) {
      e.preventDefault();
      state.level = $('input[name="nivel"]:checked').value;
      state.type = $('input[name="tipo"]:checked').value;
      Sound.click();
      startGame();
    });

    board.addEventListener('click', function (e) {
      var card = e.target.closest('.card');
      if (card) onFlip(Number(card.dataset.index));
    });

    // Flechas del teclado para moverse entre cartas.
    board.addEventListener('keydown', function (e) {
      var moves = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -state.cols, ArrowDown: state.cols };
      var card = e.target.closest('.card');
      if (!card || !(e.key in moves)) return;
      var next = board.children[Number(card.dataset.index) + moves[e.key]];
      if (next) { e.preventDefault(); next.focus(); }
    });

    board.addEventListener('animationend', function (e) {
      if (e.target.classList.contains('spark') || e.target.classList.contains('float-pts')) e.target.remove();
    });

    // Si un logo no carga, la carta muestra la inicial del programa.
    document.addEventListener('error', function (e) {
      var img = e.target;
      if (!img || img.tagName !== 'IMG' || !img.dataset.name || !img.parentNode) return;
      var initial = el('span', 'card-initial');
      initial.appendChild(el('b', '', img.dataset.name.charAt(0)));
      img.parentNode.replaceChild(initial, img);
    }, true);

    document.addEventListener('animationend', function (e) {
      if (e.target.classList && e.target.classList.contains('tux')) e.target.classList.remove('is-happy', 'is-sad');
    });

    $('#btn-salir').addEventListener('click', function () {
      Sound.click();
      function exit() { leaveGame(); show('inicio'); }
      if (gameInProgress()) ask('¿Salir de la partida?', 'Sí, salir', exit);
      else exit();
    });

    $('#btn-reiniciar').addEventListener('click', function () {
      Sound.click();
      if (gameInProgress()) ask('¿Empezar una partida nueva?', 'Sí, reiniciar', startGame);
      else startGame();
    });

    $('#btn-otra').addEventListener('click', function () {
      Sound.click();
      startGame();
    });

    $('#btn-borrar').addEventListener('click', function () {
      ask('¿Borrar todos los récords de esta computadora?', 'Sí, borrar', function () {
        Records.clear();
        renderRecords();
      });
    });

    $('#dialogo-no').addEventListener('click', function () { dialog.close(); });
    $('#dialogo-si').addEventListener('click', function () {
      var fn = dialogOk;
      dialogOk = null;
      dialog.close();
      if (fn) fn();
    });

    initTabs($('#records-tipo'), function (tab) {
      state.recordsType = tab.dataset.type;
      renderRecords();
    });
    initTabs($('#records-tabs'), function (tab) {
      state.recordsLevel = tab.dataset.level;
      renderRecords();
    });
    initTabs($('#aprende-tabs'), function (tab) {
      $$('#aprende .tab-panel').forEach(function (panel) {
        panel.hidden = panel.id !== tab.getAttribute('aria-controls');
      });
    });

    $('#home-tux').addEventListener('click', function () {
      Sound.match(1 + (homeTip % 4));
      nextHomeTip('happy');
    });
    setInterval(function () {
      if (document.body.dataset.screen === 'inicio' && !document.hidden) nextHomeTip();
    }, 7000);

    var soundBtn = $('#btn-sonido');
    function paintSound() {
      var muted = Sound.isMuted();
      soundBtn.textContent = muted ? '🔇' : '🔊';
      soundBtn.setAttribute('aria-pressed', muted ? 'true' : 'false');
      soundBtn.setAttribute('aria-label', muted ? 'Activar sonido' : 'Silenciar sonido');
    }
    soundBtn.addEventListener('click', function () { Sound.toggle(); paintSound(); });
    paintSound();

    var fullBtn = $('#btn-pantalla');
    var root = document.documentElement;
    if (!root.requestFullscreen) fullBtn.hidden = true;
    fullBtn.addEventListener('click', function () {
      Sound.click();
      if (document.fullscreenElement) document.exitFullscreen();
      else root.requestFullscreen().catch(function () { /* el navegador lo bloqueó */ });
    });

    var pending = 0;
    function relayout() {
      cancelAnimationFrame(pending);
      pending = requestAnimationFrame(layoutBoard);
    }
    if (window.ResizeObserver) new ResizeObserver(relayout).observe(boardWrap);
    else window.addEventListener('resize', relayout);
  }

  function preload() {
    Data.PAIRS.forEach(function (pair) {
      new Image().src = pair.priv.img;
      new Image().src = pair.libre.img;
    });
  }

  // Guarda el juego en el navegador para que funcione sin internet cuando se abre desde GitHub Pages.
  // Con doble clic en index.html (file://) no hace falta: todos los archivos ya son locales.
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () { /* sin modo sin conexión */ });
    });
  }

  document.body.dataset.screen = 'inicio';
  renderLearn();
  bind();
  if (window.requestIdleCallback) window.requestIdleCallback(preload);
  else setTimeout(preload, 300);
})();
