(function () {
  "use strict";

  var ESPERA_FILTRO_MS = 300;

  // ---------------------------------------------------------------
  // Estado de la consulta
  // ---------------------------------------------------------------
  var consulta = { titulo: "", limit: 20, offset: 0 };
  var numeroSolicitud = 0;
  var numeroDetalle = 0;
  var temporizadorFiltro = null;
  var botonOrigenDetalle = null;
  var cantidadPaginaActual = 0;
  var finDelListado = false;
  var MENSAJE_RESPUESTA_INVALIDA = "El servidor devolvió una respuesta inesperada. Intentá de nuevo.";

  // ---------------------------------------------------------------
  // Utilidades del DOM
  // ---------------------------------------------------------------
  function porId(id) {
    return document.getElementById(id);
  }

  function escribirCampo(contenedor, campo, valor) {
    var elementos = contenedor.querySelectorAll("[data-campo]");
    for (var i = 0; i < elementos.length; i++) {
      if (elementos[i].getAttribute("data-campo") === campo) {
        elementos[i].textContent = valor;
      }
    }
  }

  // El precio llega como cadena con dos decimales: se muestra tal cual.
  function formatearPrecio(precio) {
    if (typeof precio === "number") {
      return precio.toFixed(2);
    }
    return String(precio);
  }

  function nombreGenero(genero) {
    return genero ? genero.nombre : "Sin clasificar";
  }

  // ---------------------------------------------------------------
  // Lógica de paginación
  // ---------------------------------------------------------------

  // Decide si el botón "Siguiente" se habilita.
  // La API no informa el total: si la página llegó completa puede haber más;
  // si llegó incompleta, es la última. Si el total es múltiplo exacto de
  // `limite`, la página siguiente vendrá vacía y lo resuelve `finDelListado`.
  function hayPaginaSiguiente(cantidadRecibida, limite) {
    return cantidadRecibida === limite;
  }

  // ---------------------------------------------------------------
  // Renderizado: estados, listado y paginación
  // ---------------------------------------------------------------
  function mostrarEstado(nombre) {
    var mensajes = {
      cargando: porId("catalogo-mensaje-cargando"),
      vacio: porId("catalogo-mensaje-vacio"),
      "sin-resultados": porId("catalogo-mensaje-sin-resultados"),
      error: porId("catalogo-mensaje-error")
    };
    for (var clave in mensajes) {
      if (Object.prototype.hasOwnProperty.call(mensajes, clave)) {
        mensajes[clave].hidden = clave !== nombre;
      }
    }
    porId("catalogo-lista").hidden = nombre !== "resultados";

    var cargando = nombre === "cargando";
    porId("catalogo-limite").disabled = cargando;
    if (cargando) {
      porId("catalogo-anterior").disabled = true;
      porId("catalogo-siguiente").disabled = true;
    }
  }

  function renderListado(libros) {
    var lista = porId("catalogo-lista");
    var plantilla = porId("plantilla-tarjeta-libro");
    var fragmento = document.createDocumentFragment();
    for (var i = 0; i < libros.length; i++) {
      var libro = libros[i];
      var clon = plantilla.content.firstElementChild.cloneNode(true);
      clon.setAttribute("data-libro-id", String(libro.id));
      escribirCampo(clon, "titulo", libro.titulo);
      escribirCampo(clon, "isbn", libro.isbn);
      escribirCampo(clon, "precio", formatearPrecio(libro.precio));
      escribirCampo(clon, "editorial", libro.editorial ? libro.editorial.nombre : "");
      escribirCampo(clon, "genero", nombreGenero(libro.genero));
      escribirCampo(clon, "titulo-accesible", " de «" + libro.titulo + "»");
      fragmento.appendChild(clon);
    }
    lista.replaceChildren(fragmento);
  }

  function renderPaginacion(cantidad) {
    var rango = porId("catalogo-rango");
    if (cantidad > 0) {
      var texto = "Libros " + (consulta.offset + 1) + "–" + (consulta.offset + cantidad);
      rango.textContent = finDelListado ? texto + ". No hay más libros." : texto;
    } else {
      rango.textContent = "";
    }
    porId("catalogo-anterior").disabled = consulta.offset === 0;
    porId("catalogo-siguiente").disabled =
      finDelListado || !hayPaginaSiguiente(cantidad, consulta.limit);
  }

  // ---------------------------------------------------------------
  // Carga del listado (usa el cliente HTTP compartido)
  // ---------------------------------------------------------------
  // Devuelve el control de paginación que tenía el foco (o null).
  function controlPaginacionEnfocado() {
    var activo = document.activeElement;
    var ids = ["catalogo-anterior", "catalogo-siguiente", "catalogo-limite"];
    for (var i = 0; i < ids.length; i++) {
      if (activo === porId(ids[i])) {
        return activo;
      }
    }
    return null;
  }

  // Los controles se deshabilitan mientras carga y el foco cae al <body>:
  // se devuelve al mismo control, a otro botón de paginación habilitado o al título.
  function restaurarFoco(control) {
    if (!control) {
      return;
    }
    var candidatos = [control, porId("catalogo-siguiente"), porId("catalogo-anterior")];
    for (var i = 0; i < candidatos.length; i++) {
      if (!candidatos[i].disabled) {
        candidatos[i].focus();
        return;
      }
    }
    porId("titulo-catalogo").focus();
  }

  function cargarListado(opciones) {
    var desdeSiguiente = !!(opciones && opciones.desdeSiguiente === true);
    var controlConFoco = controlPaginacionEnfocado();
    numeroSolicitud += 1;
    var miSolicitud = numeroSolicitud;
    var consultaPedida = { titulo: consulta.titulo, limit: consulta.limit, offset: consulta.offset };
    mostrarEstado("cargando");

    return Api.pedir("/libros/", {
      parametros: {
        titulo: consultaPedida.titulo,
        limit: consultaPedida.limit,
        offset: consultaPedida.offset
      }
    }).then(
      function (libros) {
        if (miSolicitud !== numeroSolicitud) {
          return;
        }
        if (!Array.isArray(libros)) {
          mostrarErrorListado(MENSAJE_RESPUESTA_INVALIDA);
          restaurarFoco(controlConFoco);
          return;
        }
        if (libros.length === 0 && consultaPedida.offset > 0) {
          if (desdeSiguiente) {
            // Fin del listado: se vuelve a la página anterior y se conserva su lista en pantalla.
            consulta.offset = Math.max(0, consultaPedida.offset - consultaPedida.limit);
            finDelListado = true;
            mostrarEstado("resultados");
            renderPaginacion(cantidadPaginaActual);
            restaurarFoco(controlConFoco);
            return;
          }
          // Página vacía por otro motivo (p. ej. cambió el total): se vuelve al inicio.
          consulta.offset = 0;
          cargarListado();
          return;
        }
        finDelListado = false;
        cantidadPaginaActual = libros.length;
        if (libros.length === 0) {
          mostrarEstado(consultaPedida.titulo === "" ? "vacio" : "sin-resultados");
          renderListado([]);
          renderPaginacion(0);
          restaurarFoco(controlConFoco);
          return;
        }
        renderListado(libros);
        mostrarEstado("resultados");
        renderPaginacion(libros.length);
        restaurarFoco(controlConFoco);
      },
      function (error) {
        if (miSolicitud !== numeroSolicitud) {
          return;
        }
        mostrarErrorListado(error && error.mensaje ? error.mensaje : MENSAJE_RESPUESTA_INVALIDA);
        restaurarFoco(controlConFoco);
      }
    );
  }

  function mostrarErrorListado(mensaje) {
    porId("catalogo-mensaje-error-texto").textContent = mensaje;
    mostrarEstado("error");
    porId("catalogo-rango").textContent = "";
    porId("catalogo-anterior").disabled = consulta.offset === 0;
    porId("catalogo-siguiente").disabled = true;
  }

  // ---------------------------------------------------------------
  // Detalle del libro
  // ---------------------------------------------------------------
  function limpiarDetalle() {
    var contenido = porId("detalle-contenido");
    var campos = contenido.querySelectorAll("[data-campo]");
    for (var i = 0; i < campos.length; i++) {
      campos[i].textContent = "";
    }
    porId("detalle-autores").replaceChildren();
  }

  function mostrarEstadoDetalle(nombre) {
    porId("detalle-mensaje-cargando").hidden = nombre !== "cargando";
    porId("detalle-mensaje-error").hidden = nombre !== "error";
    porId("detalle-contenido").hidden = nombre !== "datos";
  }

  function renderDetalle(libro) {
    var contenido = porId("detalle-contenido");
    escribirCampo(contenido, "titulo", libro.titulo);
    escribirCampo(contenido, "isbn", libro.isbn);
    escribirCampo(contenido, "precio", formatearPrecio(libro.precio));
    escribirCampo(contenido, "stock", String(libro.stock));
    escribirCampo(contenido, "editorial", libro.editorial ? libro.editorial.nombre : "");
    escribirCampo(contenido, "genero", nombreGenero(libro.genero));

    var autores = (libro.autores || []).slice().sort(function (a, b) {
      return a.orden - b.orden;
    });
    var lista = porId("detalle-autores");
    var fragmento = document.createDocumentFragment();
    for (var i = 0; i < autores.length; i++) {
      var item = document.createElement("li");
      item.textContent = autores[i].nombre + " — " + autores[i].rol;
      fragmento.appendChild(item);
    }
    lista.replaceChildren(fragmento);
    porId("detalle-sin-autores").hidden = autores.length > 0;
    lista.hidden = autores.length === 0;
  }

  function abrirDetalle(id, boton) {
    numeroDetalle += 1;
    var miDetalle = numeroDetalle;
    botonOrigenDetalle = boton;

    porId("catalogo-detalle").hidden = false;
    mostrarEstadoDetalle("cargando");
    porId("titulo-detalle").focus();

    Api.pedir("/libros/" + id).then(
      function (libro) {
        if (miDetalle !== numeroDetalle) {
          return;
        }
        if (!libro || typeof libro !== "object" || Array.isArray(libro)) {
          limpiarDetalle();
          porId("detalle-mensaje-error").textContent = MENSAJE_RESPUESTA_INVALIDA;
          mostrarEstadoDetalle("error");
          return;
        }
        renderDetalle(libro);
        mostrarEstadoDetalle("datos");
      },
      function (error) {
        if (miDetalle !== numeroDetalle) {
          return;
        }
        limpiarDetalle();
        porId("detalle-mensaje-error").textContent =
          error && error.mensaje ? error.mensaje : MENSAJE_RESPUESTA_INVALIDA;
        mostrarEstadoDetalle("error");
      }
    );
  }

  function cerrarDetalle() {
    numeroDetalle += 1;
    porId("catalogo-detalle").hidden = true;
    if (botonOrigenDetalle && document.contains(botonOrigenDetalle)) {
      botonOrigenDetalle.focus();
    } else {
      // La tarjeta de origen ya no existe (la lista se recargó): foco a un punto estable.
      porId("catalogo-buscar").focus();
    }
    botonOrigenDetalle = null;
  }

  // ---------------------------------------------------------------
  // Manejadores de eventos
  // ---------------------------------------------------------------
  function aplicarFiltro() {
    var texto = porId("catalogo-buscar").value.trim();
    if (texto !== consulta.titulo) {
      consulta.titulo = texto;
      consulta.offset = 0;
    }
    finDelListado = false;
    cargarListado();
  }

  function alEscribir() {
    clearTimeout(temporizadorFiltro);
    temporizadorFiltro = setTimeout(aplicarFiltro, ESPERA_FILTRO_MS);
  }

  function alEnviar(evento) {
    evento.preventDefault();
    clearTimeout(temporizadorFiltro);
    aplicarFiltro();
  }

  function alCambiarLimite() {
    consulta.limit = Number(porId("catalogo-limite").value);
    consulta.offset = 0;
    finDelListado = false;
    cargarListado();
  }

  function alPresionarAnterior() {
    consulta.offset = Math.max(0, consulta.offset - consulta.limit);
    finDelListado = false;
    cargarListado();
  }

  function alPresionarSiguiente() {
    consulta.offset += consulta.limit;
    cargarListado({ desdeSiguiente: true });
  }

  function alHacerClicEnLista(evento) {
    var boton = evento.target.closest("button[data-accion=\"detalle\"]");
    if (!boton) {
      return;
    }
    var item = boton.closest("li[data-libro-id]");
    if (item) {
      abrirDetalle(item.getAttribute("data-libro-id"), boton);
    }
  }

  function inicializarCatalogo() {
    porId("catalogo-buscar").addEventListener("input", alEscribir);
    porId("catalogo-busqueda").addEventListener("submit", alEnviar);
    porId("catalogo-limite").addEventListener("change", alCambiarLimite);
    porId("catalogo-anterior").addEventListener("click", alPresionarAnterior);
    porId("catalogo-siguiente").addEventListener("click", alPresionarSiguiente);
    porId("catalogo-reintentar").addEventListener("click", function () {
      cargarListado();
    });
    porId("catalogo-lista").addEventListener("click", alHacerClicEnLista);
    porId("detalle-cerrar").addEventListener("click", cerrarDetalle);

    consulta.limit = Number(porId("catalogo-limite").value);
    cargarListado();
  }

  inicializarCatalogo();
})();
