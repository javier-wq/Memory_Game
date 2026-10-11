// Contenido del memorama: cada pareja une un programa privativo con su alternativa libre.
(function (root) {
  'use strict';

  var LOGOS = 'assets/logos/';

  var PAIRS = [
    {
      id: 'sistema', category: 'Sistema operativo',
      priv: { name: 'Windows', img: LOGOS + 'windows.svg' },
      libre: { name: 'Linux', img: LOGOS + 'linux.svg' },
      fact: 'Linux es libre y gratis. ¡Puede revivir computadoras viejas!'
    },
    {
      id: 'documentos', category: 'Documentos',
      priv: { name: 'Word', img: LOGOS + 'word.svg' },
      libre: { name: 'Writer', img: LOGOS + 'writer.svg' },
      fact: 'Writer sirve para escribir cartas y tareas, y también abre archivos de Word.'
    },
    {
      id: 'calculo', category: 'Hojas de cálculo',
      priv: { name: 'Excel', img: LOGOS + 'excel.svg' },
      libre: { name: 'Calc', img: LOGOS + 'calc.svg' },
      fact: 'Calc hace cuentas, tablas y gráficas sin pagar ninguna licencia.'
    },
    {
      id: 'presentaciones', category: 'Presentaciones',
      priv: { name: 'PowerPoint', img: LOGOS + 'powerpoint.svg' },
      libre: { name: 'Impress', img: LOGOS + 'impress.svg' },
      fact: 'Con Impress creas presentaciones con animaciones para exponer en clase.'
    },
    {
      id: 'fotos', category: 'Edición de fotos',
      priv: { name: 'Photoshop', img: LOGOS + 'photoshop.svg' },
      libre: { name: 'GIMP', img: LOGOS + 'gimp.svg' },
      fact: 'GIMP edita fotos como un profesional. ¡Su mascota se llama Wilber!'
    },
    {
      id: 'navegador', category: 'Navegador',
      priv: { name: 'Chrome', img: LOGOS + 'chrome.svg' },
      libre: { name: 'Firefox', img: LOGOS + 'firefox.svg' },
      fact: 'Firefox lo hace Mozilla, una organización sin fines de lucro que cuida tu privacidad.'
    },
    {
      id: 'dibujo', category: 'Dibujo vectorial',
      priv: { name: 'Illustrator', img: LOGOS + 'illustrator.svg' },
      libre: { name: 'Inkscape', img: LOGOS + 'inkscape.svg' },
      fact: 'Con Inkscape puedes agrandar tus dibujos todo lo que quieras sin que se vean borrosos.'
    },
    {
      id: 'multimedia', category: 'Video y música',
      priv: { name: 'Media Player', img: LOGOS + 'mediaplayer.svg' },
      libre: { name: 'VLC', img: LOGOS + 'vlc.svg' },
      fact: 'VLC reproduce casi cualquier video o canción. ¡Su logo es un cono de tránsito!'
    },
    {
      id: 'video', category: 'Edición de video',
      priv: { name: 'Premiere', img: LOGOS + 'premiere.svg' },
      libre: { name: 'Kdenlive', img: LOGOS + 'kdenlive.svg' },
      fact: 'Kdenlive sirve para editar videos: cortar, unir clips y agregar música.'
    },
    {
      id: 'correo', category: 'Correo',
      priv: { name: 'Outlook', img: LOGOS + 'outlook.svg' },
      libre: { name: 'Thunderbird', img: LOGOS + 'thunderbird.svg' },
      fact: 'Thunderbird organiza tus correos y es de la familia de Mozilla, como Firefox.'
    }
  ];

  // cols/rows en horizontal; en pantallas verticales la interfaz los intercambia.
  var LEVELS = {
    facil: { id: 'facil', label: 'Fácil', pairs: 6, cols: 4, rows: 3, hint: '12 cartas' },
    normal: { id: 'normal', label: 'Normal', pairs: 8, cols: 4, rows: 4, hint: '16 cartas' },
    dificil: { id: 'dificil', label: 'Difícil', pairs: 10, cols: 5, rows: 4, hint: '20 cartas' }
  };

  var FREEDOMS = [
    { title: 'Usar', text: 'Usar el programa para lo que tú quieras.' },
    { title: 'Estudiar', text: 'Estudiar cómo funciona por dentro.' },
    { title: 'Compartir', text: 'Compartirlo con tus amigos o tu escuela.' },
    { title: 'Mejorar', text: 'Mejorarlo y publicar las mejoras para todos.' }
  ];

  var api = { PAIRS: PAIRS, LEVELS: LEVELS, FREEDOMS: FREEDOMS };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.MG = root.MG || {};
  root.MG.Data = api;
})(typeof window !== 'undefined' ? window : globalThis);
