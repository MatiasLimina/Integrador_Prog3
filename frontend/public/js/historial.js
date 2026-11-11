(function () {
  "use strict";

  var MENSAJE_RESPUESTA_INVALIDA = "El servidor devolvió una respuesta inesperada. Intentá de nuevo.";

  // ---------------------------------------------------------------
  // Estado de la consulta
  // ---------------------------------------------------------------
  var consulta = { limit: 20, offset: 0 };
  var numeroSolicitud = 0;
  var numeroDetalle = 0;
  var botonOrigenDetalle = null;
  var cantidadPaginaActual = 0;
  var finDelListado = false;

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

  function dosDigitos(numero) {
    return numero < 10 ? "0" + numero : String(numero);
  }

  // Texto de un dato de la API: nunca se muestra "undefined" ni "null".
  function texto(valor) {
    return valor === undefined || valor === null ? "—" : String(valor);
  }

  // Escribe la fecha en la celda del campo "fecha": `dd/mm/aaaa hh:mm` local dentro de un
  // <time> creado aquí, con `datetime` = toISOString(). Si no es una fecha válida, texto plano.
  function escribirFecha(contenedor, valor) {
    var celda = contenedor.querySelector("[data-campo=\"fecha\"]");
    var fecha = new Date(valor);
    if (valor === undefined || valor === null || isNaN(fecha.getTime())) {
      celda.textContent = texto(valor);
      return;
    }
    var tiempo = document.createElement("time");
    tiempo.textContent = dosDigitos(fecha.getDate()) + "/" + dosDigitos(fecha.getMonth() + 1) + "/" +
      fecha.getFullYear() + " " + dosDigitos(fecha.getHours()) + ":" + dosDigitos(fecha.getMinutes());
    tiempo.setAttribute("datetime", fecha.toISOString());
    celda.replaceChildren(tiempo);
  }

  function nombreCliente(venta) {
    return texto(venta.cliente && typeof venta.cliente === "object" ? venta.cliente.nombre : undefined);
  }

  function mensajeDe(error) {
    return error && typeof error.mensaje === "string" ? error.mensaje : MENSAJE_RESPUESTA_INVALIDA;
  }

  // ---------------------------------------------------------------
  // Lógica de paginación (misma que el Catálogo)
  // ---------------------------------------------------------------

  // La API no informa el total: si la página llegó completa puede haber más;
  // si llegó incompleta, es la última. Si el total es múltiplo exacto de
  // `limite`, la página siguiente vendrá vacía y lo resuelve `finDelListado`.
  function hayPaginaSiguiente(cantidadRecibida, limite) {
    return cantidadRecibida === limite;
  }

  // ---------------------------------------------------------------
  // Renderizado del listado
  // ---------------------------------------------------------------
  function mostrarEstado(nombre) {
    var mensajes = {
      cargando: porId("historial-mensaje-cargando"),
      vacio: porId("historial-mensaje-vacio"),
      error: porId("historial-mensaje-error")
    };
    for (var clave in mensajes) {
      if (Object.prototype.hasOwnProperty.call(mensajes, clave)) {
        mensajes[clave].hidden = clave !== nombre;
      }
    }
    porId("historial-tabla").hidden = nombre !== "resultados";

    var cargando = nombre === "cargando";
    porId("historial-limite").disabled = cargando;
    if (cargando) {
      porId("historial-anterior").disabled = true;
      porId("historial-siguiente").disabled = true;
    }
  }

  function renderListado(ventas) {
    var lista = porId("historial-lista");
    var plantilla = porId("plantilla-fila-venta");
    var fragmento = document.createDocumentFragment();
    for (var i = 0; i < ventas.length; i++) {
      var venta = ventas[i];
      if (!venta || typeof venta !== "object" || venta.id === undefined || venta.id === null) {
        continue; // fila sin la forma de una venta: se omite
      }
      var fila = plantilla.content.firstElementChild.cloneNode(true);
      fila.setAttribute("data-venta-id", String(venta.id));
      escribirCampo(fila, "id", String(venta.id));
      escribirFecha(fila, venta.fecha);
      escribirCampo(fila, "cliente", nombreCliente(venta));
      escribirCampo(fila, "total", texto(venta.total));
      escribirCampo(fila, "contextoVenta", "de la venta " + String(venta.id));
      fragmento.appendChild(fila);
    }
    lista.replaceChildren(fragmento);
  }

  function renderPaginacion(cantidad) {
    var rango = porId("historial-rango");
    if (cantidad > 0) {
      var texto = "Ventas " + (consulta.offset + 1) + "–" + (consulta.offset + cantidad);
      rango.textContent = finDelListado ? texto + ". No hay más ventas." : texto;
    } else {
      rango.textContent = "";
    }
    porId("historial-anterior").disabled = consulta.offset === 0;
    porId("historial-siguiente").disabled =
      finDelListado || !hayPaginaSiguiente(cantidad, consulta.limit);
  }

  // Devuelve el control de paginación que tenía el foco (o null).
  function controlPaginacionEnfocado() {
    var activo = document.activeElement;
    var ids = ["historial-anterior", "historial-siguiente", "historial-limite"];
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
    var candidatos = [control, porId("historial-siguiente"), porId("historial-anterior")];
    for (var i = 0; i < candidatos.length; i++) {
      if (!candidatos[i].disabled) {
        candidatos[i].focus();
        return;
      }
    }
    porId("titulo-historial-listado").focus();
  }

  // ---------------------------------------------------------------
  // Carga del listado (GET /ventas/ con limit y offset)
  // ---------------------------------------------------------------
  function mostrarErrorListado(mensaje) {
    // Nunca se deja a la vista un listado incompleto tras un error.
    renderListado([]);
    cantidadPaginaActual = 0;
    porId("historial-mensaje-error-texto").textContent = mensaje;
    mostrarEstado("error");
    porId("historial-rango").textContent = "";
    porId("historial-anterior").disabled = consulta.offset === 0;
    porId("historial-siguiente").disabled = true;
  }

  function cargarListado(opciones) {
    var desdeSiguiente = !!(opciones && opciones.desdeSiguiente === true);
    var controlConFoco = (opciones && opciones.controlConFoco) || controlPaginacionEnfocado();
    numeroSolicitud += 1;
    var miSolicitud = numeroSolicitud;
    var consultaPedida = { limit: consulta.limit, offset: consulta.offset };
    mostrarEstado("cargando");

    return Api.pedir("/ventas/", { parametros: consultaPedida }).then(
      function (ventas) {
        if (miSolicitud !== numeroSolicitud) {
          return;
        }
        if (!Array.isArray(ventas)) {
          mostrarErrorListado(MENSAJE_RESPUESTA_INVALIDA);
          restaurarFoco(controlConFoco);
          return;
        }
        if (ventas.length === 0 && consultaPedida.offset > 0) {
          if (desdeSiguiente) {
            // Fin del listado: se vuelve a la página anterior y se conservan sus filas en pantalla.
            consulta.offset = Math.max(0, consultaPedida.offset - consultaPedida.limit);
            finDelListado = true;
            mostrarEstado("resultados");
            renderPaginacion(cantidadPaginaActual);
            restaurarFoco(controlConFoco);
            return;
          }
          // Página vacía por otro motivo (p. ej. cambió el total): se vuelve al inicio.
          consulta.offset = 0;
          cargarListado({ controlConFoco: controlConFoco });
          return;
        }
        finDelListado = false;
        cantidadPaginaActual = ventas.length;
        if (ventas.length === 0) {
          renderListado([]);
          mostrarEstado("vacio");
          renderPaginacion(0);
          restaurarFoco(controlConFoco);
          return;
        }
        renderListado(ventas);
        mostrarEstado("resultados");
        renderPaginacion(ventas.length);
        restaurarFoco(controlConFoco);
      },
      function (error) {
        if (miSolicitud !== numeroSolicitud) {
          return;
        }
        mostrarErrorListado(mensajeDe(error));
        restaurarFoco(controlConFoco);
      }
    );
  }

  // ---------------------------------------------------------------
  // Detalle de la venta (GET /ventas/{id}, sin barra final)
  // ---------------------------------------------------------------
  function limpiarDetalle() {
    var contenido = porId("detalle-contenido");
    escribirCampo(contenido, "id", "");
    escribirCampo(contenido, "cliente", "");
    escribirCampo(contenido, "total", "");
    escribirCampo(contenido, "fecha", "");
    porId("detalle-renglones").replaceChildren();
  }

  function mostrarEstadoDetalle(nombre) {
    porId("detalle-mensaje-cargando").hidden = nombre !== "cargando";
    porId("detalle-mensaje-error").hidden = nombre !== "error";
    porId("detalle-contenido").hidden = nombre !== "datos";
  }

  function ventaTieneForma(venta) {
    return !!venta && typeof venta === "object" && !Array.isArray(venta) &&
      venta.id !== undefined && venta.id !== null &&
      !!venta.cliente && typeof venta.cliente === "object" &&
      Array.isArray(venta.renglones);
  }

  // Los importes se escriben tal como llegan en la respuesta: sin conversiones ni cálculos.
  function renderDetalle(venta) {
    var contenido = porId("detalle-contenido");
    escribirCampo(contenido, "id", texto(venta.id));
    escribirFecha(contenido, venta.fecha);
    escribirCampo(contenido, "cliente", nombreCliente(venta));
    escribirCampo(contenido, "total", texto(venta.total));

    var plantilla = porId("plantilla-fila-renglon-detalle");
    var fragmento = document.createDocumentFragment();
    for (var i = 0; i < venta.renglones.length; i++) {
      var renglon = venta.renglones[i] || {};
      var fila = plantilla.content.firstElementChild.cloneNode(true);
      escribirCampo(fila, "titulo", texto(renglon.titulo));
      escribirCampo(fila, "cantidad", texto(renglon.cantidad));
      escribirCampo(fila, "precioUnitario", texto(renglon.precio_unitario));
      escribirCampo(fila, "subtotal", texto(renglon.subtotal));
      fragmento.appendChild(fila);
    }
    porId("detalle-renglones").replaceChildren(fragmento);
  }

  function actualizarDireccion(parametro) {
    try {
      history.replaceState(null, "", location.pathname + (parametro === null ? "" : "?venta=" + parametro));
    } catch (e) {
      // Sin historial (p. ej. contexto restringido): el detalle sigue funcionando sin enlace directo.
    }
  }

  function mostrarErrorDetalle(mensaje) {
    limpiarDetalle();
    porId("detalle-mensaje-error").textContent = mensaje;
    mostrarEstadoDetalle("error");
  }

  function abrirDetalle(id, boton) {
    numeroDetalle += 1;
    var miDetalle = numeroDetalle;
    botonOrigenDetalle = boton || null;

    limpiarDetalle();
    porId("historial-detalle").hidden = false;
    mostrarEstadoDetalle("cargando");
    porId("titulo-historial-detalle").focus();
    actualizarDireccion(String(id));

    Api.pedir("/ventas/" + id).then(
      function (venta) {
        if (miDetalle !== numeroDetalle) {
          return;
        }
        if (!ventaTieneForma(venta)) {
          mostrarErrorDetalle(MENSAJE_RESPUESTA_INVALIDA);
          return;
        }
        renderDetalle(venta);
        mostrarEstadoDetalle("datos");
      },
      function (error) {
        if (miDetalle !== numeroDetalle) {
          return;
        }
        mostrarErrorDetalle(mensajeDe(error));
      }
    );
  }

  function abrirDetalleInvalido(mensaje) {
    numeroDetalle += 1;
    botonOrigenDetalle = null;
    porId("historial-detalle").hidden = false;
    mostrarErrorDetalle(mensaje);
    porId("titulo-historial-detalle").focus();
  }

  function cerrarDetalle() {
    numeroDetalle += 1;
    porId("historial-detalle").hidden = true;
    actualizarDireccion(null);
    if (botonOrigenDetalle && document.contains(botonOrigenDetalle)) {
      botonOrigenDetalle.focus();
    } else {
      // La fila de origen ya no existe (o se abrió por dirección): foco a un punto estable.
      porId("titulo-historial-listado").focus();
    }
    botonOrigenDetalle = null;
  }

  // ---------------------------------------------------------------
  // Manejadores de eventos
  // ---------------------------------------------------------------
  function alCambiarLimite() {
    consulta.limit = Number(porId("historial-limite").value);
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
    var boton = evento.target.closest("button[data-accion=\"ver-detalle\"]");
    if (!boton) {
      return;
    }
    var fila = boton.closest("tr[data-venta-id]");
    if (fila) {
      abrirDetalle(fila.getAttribute("data-venta-id"), boton);
    }
  }

  // Si la dirección trae ?venta=N, se abre ese detalle (o se informa que N no es válido).
  function abrirDetalleDesdeDireccion() {
    var valor = new URLSearchParams(location.search).get("venta");
    if (valor === null) {
      return;
    }
    var resultado = Validaciones.validarIdVenta(valor);
    if (!resultado.valido) {
      abrirDetalleInvalido(resultado.errores[0]);
      return;
    }
    abrirDetalle(resultado.id, null);
  }

  function inicializarHistorial() {
    porId("historial-limite").addEventListener("change", alCambiarLimite);
    porId("historial-anterior").addEventListener("click", alPresionarAnterior);
    porId("historial-siguiente").addEventListener("click", alPresionarSiguiente);
    porId("historial-reintentar").addEventListener("click", function () {
      cargarListado();
    });
    porId("historial-lista").addEventListener("click", alHacerClicEnLista);
    porId("detalle-volver").addEventListener("click", cerrarDetalle);

    consulta.limit = Number(porId("historial-limite").value);
    cargarListado();
    abrirDetalleDesdeDireccion();
  }

  inicializarHistorial();
})();
