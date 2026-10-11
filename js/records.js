// Tabla de récords guardada en esta computadora (localStorage).
(function (root) {
  'use strict';

  var KEY = 'memorama-records-v1';
  var MAX = 10;

  function load() {
    try {
      var data = JSON.parse(root.localStorage.getItem(KEY));
      return data && typeof data === 'object' ? data : {};
    } catch (e) {
      return {};
    }
  }

  function save(data) {
    try {
      root.localStorage.setItem(KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      return false;
    }
  }

  function sort(list) {
    return list.sort(function (a, b) {
      return b.score - a.score || a.seconds - b.seconds || a.moves - b.moves;
    });
  }

  function list(level) {
    var rows = load()[level];
    return Array.isArray(rows) ? sort(rows).slice(0, MAX) : [];
  }

  function qualifies(level, score) {
    var rows = list(level);
    return score > 0 && (rows.length < MAX || score > rows[rows.length - 1].score);
  }

  // entry: { score, moves, seconds }. Devuelve la posición (1 = primer lugar) o 0 si no entró.
  function add(level, entry) {
    var data = load();
    var row = {
      score: entry.score, moves: entry.moves, seconds: entry.seconds, date: Date.now()
    };
    var rows = sort((Array.isArray(data[level]) ? data[level] : []).concat(row)).slice(0, MAX);
    data[level] = rows;
    save(data);
    return rows.indexOf(row) + 1;
  }

  function clear() {
    try { root.localStorage.removeItem(KEY); } catch (e) { /* sin almacenamiento */ }
  }

  root.MG = root.MG || {};
  root.MG.Records = { list: list, add: add, qualifies: qualifies, clear: clear };
})(window);
