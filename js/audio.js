// Efectos de sonido sintetizados con Web Audio: no hace falta descargar archivos.
(function (root) {
  'use strict';

  var KEY = 'memorama-silencio';
  var ctx = null;
  var master = null;
  var muted = false;

  try { muted = root.localStorage.getItem(KEY) === '1'; } catch (e) { /* sin almacenamiento */ }

  // El navegador solo permite crear audio después de un clic o toque del usuario.
  function ready() {
    if (muted) return false;
    var AC = root.AudioContext || root.webkitAudioContext;
    if (!AC) return false;
    if (!ctx) {
      try {
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = 0.5;
        master.connect(ctx.destination);
      } catch (e) {
        ctx = null;
        return false;
      }
    }
    if (ctx.state === 'suspended') ctx.resume();
    return true;
  }

  // note: { f: frecuencia, to: frecuencia final, t: inicio, d: duración, type, v: volumen }
  function tone(note) {
    var start = ctx.currentTime + (note.t || 0);
    var dur = note.d || 0.15;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = note.type || 'sine';
    osc.frequency.setValueAtTime(note.f, start);
    if (note.to) osc.frequency.exponentialRampToValueAtTime(note.to, start + dur);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(note.v || 0.3, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(gain);
    gain.connect(master);
    osc.start(start);
    osc.stop(start + dur + 0.03);
  }

  function play(notes) {
    if (!ready()) return;
    notes.forEach(tone);
  }

  var Audio = {
    click: function () {
      play([{ f: 660, d: 0.07, type: 'triangle', v: 0.18 }]);
    },
    flip: function () {
      play([{ f: 380, to: 760, d: 0.09, type: 'triangle', v: 0.2 }]);
    },
    // Cuanto más larga la racha, más agudo suena el acierto.
    match: function (streak) {
      var k = Math.pow(2, Math.min(Math.max((streak || 1) - 1, 0), 5) / 12);
      play([
        { f: 523.25 * k, d: 0.16, type: 'triangle', v: 0.3 },
        { f: 659.25 * k, t: 0.09, d: 0.16, type: 'triangle', v: 0.3 },
        { f: 783.99 * k, t: 0.18, d: 0.2, type: 'triangle', v: 0.3 },
        { f: 1046.5 * k, t: 0.27, d: 0.34, type: 'sine', v: 0.32 }
      ]);
    },
    miss: function () {
      play([
        { f: 330, to: 247, d: 0.16, type: 'sine', v: 0.22 },
        { f: 247, to: 185, t: 0.15, d: 0.22, type: 'sine', v: 0.22 }
      ]);
    },
    win: function () {
      var melody = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.5];
      var notes = melody.map(function (f, i) {
        return { f: f, t: i * 0.13, d: i === melody.length - 1 ? 0.7 : 0.18, type: 'triangle', v: 0.3 };
      });
      notes.push({ f: 261.63, t: 0.78, d: 0.7, type: 'sine', v: 0.22 });
      notes.push({ f: 659.25, t: 0.78, d: 0.7, type: 'sine', v: 0.18 });
      play(notes);
    },
    isMuted: function () { return muted; },
    toggle: function () {
      muted = !muted;
      try { root.localStorage.setItem(KEY, muted ? '1' : '0'); } catch (e) { /* sin almacenamiento */ }
      if (!muted) Audio.click();
      return muted;
    }
  };

  root.MG = root.MG || {};
  root.MG.Audio = Audio;
})(window);
