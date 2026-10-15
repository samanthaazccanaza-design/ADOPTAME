/* ========================================
   ADOPTAME - index.js
   Se usa en todas las páginas: cada bloque revisa
   si existe su elemento antes de hacer algo.
   ======================================== */

(function () {
  // Carpeta donde vive index.js (la raíz del sitio). Sirve para encontrar
  // data.json, images/ y frames/ desde cualquier página.
  var BASE = document.currentScript.src.replace(/index\.js.*$/, '');

  // ----- Imágenes: el skeleton queda detrás y solo se ve mientras carga -----
  // Si una imagen falla, se oculta para que se vea el skeleton y no el ícono roto.
  function markBroken(img) { img.classList.add('is-broken'); }

  document.querySelectorAll('.skeleton > img').forEach(function (img) {
    if (img.complete && img.naturalWidth === 0) markBroken(img);
  });
  // Los errores de imagen no "burbujean": se escuchan en la fase de captura
  document.addEventListener('error', function (e) {
    if (e.target.tagName === 'IMG' && e.target.closest('.skeleton')) markBroken(e.target);
  }, true);

  // ----- Navbar: menú móvil -----
  var toggle = document.getElementById('navToggle');
  var menu = document.getElementById('navMenu');

  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      var open = menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open);
    });

    // Cierra el menú al elegir un enlace
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        menu.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // ----- Carrusel (inicio) -----
  document.querySelectorAll('.carousel').forEach(function (c) {
    var track = c.querySelector('.carousel-track');
    var slides = track.querySelectorAll('.carousel-slide');
    var dotsBox = c.querySelector('.carousel-dots');

    function step() { return track.clientWidth; }

    // Un punto por slide
    slides.forEach(function (_, i) {
      var d = document.createElement('button');
      d.type = 'button';
      d.className = 'carousel-dot';
      d.setAttribute('aria-label', 'Ir a la imagen ' + (i + 1));
      d.addEventListener('click', function () { track.scrollTo({ left: i * step() }); });
      dotsBox.appendChild(d);
    });
    var dots = dotsBox.querySelectorAll('.carousel-dot');

    // Marca el punto activo
    function update() {
      var i = Math.round(track.scrollLeft / step());
      i = Math.max(0, Math.min(i, dots.length - 1));
      dots.forEach(function (d, n) {
        if (n === i) d.setAttribute('aria-current', 'true');
        else d.removeAttribute('aria-current');
      });
    }

    // Flechas (dan la vuelta al llegar al final)
    c.querySelectorAll('.carousel-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        var i = Math.round(track.scrollLeft / step()) + Number(b.dataset.dir);
        if (i < 0) i = slides.length - 1;
        if (i >= slides.length) i = 0;
        track.scrollTo({ left: i * step() });
      });
    });

    track.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  });

  // ----- Datos de los perritos (data.json) -----
  var pets = null;

  // Lee data.json una sola vez (requiere Live Server)
  function getPets() {
    if (pets) return Promise.resolve(pets);
    return fetch(BASE + 'data.json')
      .then(function (res) {
        if (!res.ok) throw new Error(res.status);
        return res.json();
      })
      .then(function (data) {
        pets = data.mascotas || [];
        return pets;
      });
  }

  // ----- Detalle del perrito (modal) -----
  var modal = document.getElementById('petModal');

  function openPet(id) {
    if (!modal) return;
    getPets()
      .then(function (list) {
        var p = list.find(function (x) { return x.id === id; });
        if (!p) return;
        var needs = p.necesidades || {};

        var img = document.getElementById('petModalImg');
        img.classList.remove('is-broken');
        img.removeAttribute('src');   // evita ver la foto del perrito anterior mientras carga
        img.src = BASE + p.img;
        img.alt = p.nombre;
        document.getElementById('petModalName').textContent = p.nombre;
        document.getElementById('petModalMeta').textContent =
          p.raza + ' \u00b7 ' + p.edad + ' \u00b7 ' + p.tamanio;
        document.getElementById('petModalDesc').textContent = p.descripcion;
        document.getElementById('petModalFood').textContent = needs.comida || '-';
        document.getElementById('petModalVax').textContent = needs.vacunas || '-';
        document.getElementById('petModalSterile').textContent = needs.desexionado || '-';
        // El botón de donar lleva a la página de donación con este perrito elegido
        document.getElementById('petModalDonate').href = BASE + 'frames/cta/cta.html?perro=' + p.id;

        modal.showModal();
      })
      .catch(function (err) {
        console.error('No se pudo cargar data.json:', err);
      });
  }

  if (modal) {
    modal.querySelector('[data-close]').addEventListener('click', function () { modal.close(); });
    // Clic en el fondo oscuro cierra el modal
    modal.addEventListener('click', function (e) { if (e.target === modal) modal.close(); });
    document.querySelectorAll('.pet-detail-btn').forEach(function (btn) {
      btn.addEventListener('click', function () { openPet(Number(btn.dataset.id)); });
    });
  }

  // ----- Catálogo de perritos (frames/adopcion) -----
  var catalog = document.getElementById('petsCatalog');

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  var ICONO_IMAGEN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="1.8"/><path d="M21 16l-5-5-9 9"/></svg>';

  function buildCard(p) {
    var card = el('article', 'pet-card');
    var photo = el('div', 'skeleton pet-photo');
    photo.innerHTML = ICONO_IMAGEN;
    var img = document.createElement('img');
    img.src = BASE + p.img;
    img.alt = p.nombre;
    photo.appendChild(img);
    card.appendChild(photo);
    card.appendChild(el('h3', '', p.nombre));
    card.appendChild(el('p', 'pet-meta', p.raza + ' \u00b7 ' + p.edad + ' \u00b7 ' + p.tamanio));
    card.appendChild(el('p', 'pet-need', 'Necesita ' + ((p.necesidades && p.necesidades.comida) || 'comida')));
    var btn = el('button', 'pet-detail-btn', 'Ver detalle');
    btn.type = 'button';
    btn.addEventListener('click', function () { openPet(p.id); });
    card.appendChild(btn);
    return card;
  }

  if (catalog) {
    getPets()
      .then(function (list) {
        catalog.textContent = '';
        list.forEach(function (p) { catalog.appendChild(buildCard(p)); });
      })
      .catch(function () {
        catalog.innerHTML = '';
        catalog.appendChild(el('p', 'catalog-msg', 'No se pudieron cargar los perritos. Abre la página con Live Server.'));
      });
  }

  // ----- Donación simulada (frames/cta) -----
  var form = document.getElementById('donateForm');

  if (form) {
    var PRECIO_BOLSA = 40; // precio de ejemplo
    var select = document.getElementById('donatePet');
    var total = document.getElementById('donateTotal');
    var done = document.getElementById('donateDone');

    function bags() {
      var r = form.querySelector('input[name="bolsas"]:checked');
      return r ? Number(r.value) : 1;
    }
    function updateTotal() { total.textContent = 'S/ ' + bags() * PRECIO_BOLSA; }

    form.addEventListener('change', updateTotal);
    updateTotal();

    // Llena la lista de perritos y preselecciona el que viene en la URL (?perro=1)
    getPets()
      .then(function (list) {
        list.forEach(function (p) {
          var o = document.createElement('option');
          o.value = p.id;
          o.textContent = p.nombre;
          select.appendChild(o);
        });
        var wanted = new URLSearchParams(location.search).get('perro');
        if (wanted) select.value = wanted;
      })
      .catch(function () { /* se queda con "Cualquiera que lo necesite" */ });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var n = bags();
      document.getElementById('donateDoneName').textContent = form.elements['nombre'].value.trim();
      document.getElementById('donateDoneBags').textContent = n + (n === 1 ? ' bolsa' : ' bolsas');
      document.getElementById('donateDonePet').textContent = select.options[select.selectedIndex].textContent;
      document.getElementById('donateDoneRef').textContent = 'SIM-' + Math.random().toString(36).slice(2, 8).toUpperCase();
      form.hidden = true;
      done.hidden = false;
      done.focus();
    });

    document.getElementById('donateAgain').addEventListener('click', function () {
      form.reset();
      updateTotal();
      done.hidden = true;
      form.hidden = false;
    });
  }

    // ----- Carrusel grande (pantalla completa) -----
  document.querySelectorAll('.carrusel-grande').forEach(function (c) {
    var track = c.querySelector('.carrusel-grande-track');
    var slides = track.querySelectorAll('.carrusel-grande-slide');
    var dotsBox = c.querySelector('.carrusel-grande-dots');
    var timer = null;

    function step() { return track.clientWidth; }
    function current() { return Math.round(track.scrollLeft / step()); }
    function goTo(i) {
      if (i < 0) i = slides.length - 1;
      if (i >= slides.length) i = 0;
      track.scrollTo({ left: i * step() });
    }

    slides.forEach(function (_, i) {
      var d = document.createElement('button');
      d.type = 'button';
      d.className = 'carrusel-grande-dot';
      d.setAttribute('aria-label', 'Ir al slide ' + (i + 1));
      d.addEventListener('click', function () { goTo(i); restart(); });
      dotsBox.appendChild(d);
    });
    var dots = dotsBox.querySelectorAll('.carrusel-grande-dot');

    function update() {
      var i = Math.max(0, Math.min(current(), dots.length - 1));
      dots.forEach(function (d, n) {
        if (n === i) d.setAttribute('aria-current', 'true');
        else d.removeAttribute('aria-current');
      });
    }

    c.querySelectorAll('.carrusel-grande-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        goTo(current() + Number(b.dataset.dir));
        restart();
      });
    });

    // Autoplay cada 5 segundos (se pausa al pasar el mouse)
    function start() { timer = setInterval(function () { goTo(current() + 1); }, 5000); }
    function stop() { clearInterval(timer); }
    function restart() { stop(); start(); }

    c.addEventListener('mouseenter', stop);
    c.addEventListener('mouseleave', start);

    track.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
    start();
  });
})();