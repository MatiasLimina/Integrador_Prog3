(function () {
  "use strict";

  var CANTIDAD_MAXIMA = 2147483647;
  var MENSAJE_RESPUESTA_INVALIDA = "El servidor devolvió una respuesta inesperada. Intentá de nuevo.";
  var MENSAJE_VENTA_INESPERADA =
    "La respuesta del servidor fue inesperada: revisá el historial antes de volver a confirmar.";
  var NOTA_RED = "Si la venta llegó al servidor, aparecerá en el historial.";

  // Borrador de la venta: solo en memoria, nunca en el almacenamiento del navegador.
  // El cliente se lee del <select> al confirmar.
  var borrador = { renglones: [] }; // [{libro_id, titulo, precio, cantidad}]
  var opcionesListas = false;
  var enviando = false;
  var numeroCargaOpciones = 0;

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

  function textoDeError(error) {
    if (error && error.tipo === "http") {
      return "(" + error.estado + ") " + error.mensaje;
    }
    if (error && typeof error.mensaje === "string") {
      return error.mensaje;
    }
    return MENSAJE_RESPUESTA_INVALIDA;
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

  // ---------------------------------------------------------------
  // Mensajes
  // ---------------------------------------------------------------
  function ocultarMensajes() {
    porId("venta-mensaje-ok").hidden = true;
    porId("venta-mensaje-error").hidden = true;
    porId("venta-errores").replaceChildren();
  }

  function mostrarErrores(errores) {
    var lista = porId("venta-errores");
    var fragmento = document.createDocumentFragment();
    for (var i = 0; i < errores.length; i++) {
      var item = document.createElement("li");
      item.textContent = errores[i];
      fragmento.appendChild(item);
    }
    lista.replaceChildren(fragmento);
    porId("venta-mensaje-ok").hidden = true;
    porId("venta-mensaje-error").hidden = false;
  }

  // ---------------------------------------------------------------
  // Botones y bloqueo del formulario
  // ---------------------------------------------------------------
  function actualizarBotones() {
    porId("venta-agregar-renglon").disabled = !opcionesListas || enviando;
    porId("venta-confirmar").disabled = !opcionesListas || enviando;
  }

  // Durante el envío se bloquean los tres <fieldset> (deshabilita todos sus controles):
  // así el borrador conservado tras un rechazo es exactamente lo que se envió.
  function bloquearBorrador(bloqueado) {
    var fieldsets = porId("form-venta").querySelectorAll("fieldset");
    for (var i = 0; i < fieldsets.length; i++) {
      fieldsets[i].disabled = bloqueado;
    }
    enviando = bloqueado;
    actualizarBotones();
  }

  // ---------------------------------------------------------------
  // Opciones de los selectores (clientes y libros desde la API)
  // ---------------------------------------------------------------
  function reconstruirOpciones(select, items, textoDe, extra) {
    var fragmento = document.createDocumentFragment();
    var primera = select.querySelector("option");
    if (primera) {
      var opcionInicial = document.createElement("option");
      opcionInicial.value = primera.value;
      opcionInicial.textContent = primera.textContent;
      fragmento.appendChild(opcionInicial);
    }
    for (var i = 0; i < items.length; i++) {
      var opcion = document.createElement("option");
      opcion.value = String(items[i].id);
      opcion.textContent = textoDe(items[i]);
      if (extra) {
        extra(opcion, items[i]);
      }
      fragmento.appendChild(opcion);
    }
    select.replaceChildren(fragmento);
  }

  function cargarOpciones() {
    numeroCargaOpciones += 1;
    var miCarga = numeroCargaOpciones;
    opcionesListas = false;
    porId("venta-opciones-error").hidden = true;
    porId("venta-mensaje-cargando").hidden = false;
    actualizarBotones();

    Promise.all([Api.listarTodo("/clientes/"), Api.listarTodo("/libros/")]).then(
      function (resultados) {
        if (miCarga !== numeroCargaOpciones) {
          return;
        }
        reconstruirOpciones(porId("venta-cliente"), resultados[0], function (cliente) {
          return cliente.nombre + " (ID " + cliente.id + ")";
        });
        // El título y el precio se guardan en la opción para armar el renglón al agregarlo.
        reconstruirOpciones(
          porId("venta-libro"),
          resultados[1],
          function (libro) {
            return libro.titulo + " — " + String(libro.precio);
          },
          function (opcion, libro) {
            opcion.setAttribute("data-titulo", String(libro.titulo));
            opcion.setAttribute("data-precio", String(libro.precio));
          }
        );
        opcionesListas = true;
        porId("venta-mensaje-cargando").hidden = true;
        actualizarBotones();
      },
      function (error) {
        if (miCarga !== numeroCargaOpciones) {
          return;
        }
        porId("venta-mensaje-cargando").hidden = true;
        porId("venta-opciones-error-texto").textContent =
          "No se pudieron cargar los clientes y libros. " + textoDeError(error);
        porId("venta-opciones-error").hidden = false;
        actualizarBotones();
      }
    );
  }

  // ---------------------------------------------------------------
  // Borrador: renglones en memoria
  // ---------------------------------------------------------------
  function buscarRenglon(libroId) {
    for (var i = 0; i < borrador.renglones.length; i++) {
      if (borrador.renglones[i].libro_id === libroId) {
        return borrador.renglones[i];
      }
    }
    return null;
  }

  function renderBorrador() {
    var cuerpo = porId("venta-renglones");
    var plantilla = porId("plantilla-fila-renglon");
    var fragmento = document.createDocumentFragment();
    for (var i = 0; i < borrador.renglones.length; i++) {
      var renglon = borrador.renglones[i];
      var fila = plantilla.content.firstElementChild.cloneNode(true);
      fila.setAttribute("data-libro-id", String(renglon.libro_id));
      escribirCampo(fila, "titulo", renglon.titulo);
      escribirCampo(fila, "precio", renglon.precio);
      escribirCampo(fila, "contextoLibro", "de «" + renglon.titulo + "»");

      var idCantidad = "venta-renglon-" + i + "-cantidad";
      var entrada = fila.querySelector("input");
      entrada.id = idCantidad;
      entrada.value = String(renglon.cantidad);
      var etiqueta = fila.querySelector("label");
      etiqueta.setAttribute("for", idCantidad);
      etiqueta.textContent = "Cantidad de «" + renglon.titulo + "»";
      fragmento.appendChild(fila);
    }
    cuerpo.replaceChildren(fragmento);
    porId("venta-mensaje-vacio").hidden = borrador.renglones.length > 0;
  }

  function agregarRenglon() {
    ocultarMensajes();
    var selectLibro = porId("venta-libro");
    var opcion = selectLibro.options[selectLibro.selectedIndex];
    var libroTexto = selectLibro.value;
    var errores = [];
    var libro = Validaciones.validarIdLibro(libroTexto);
    if (!libro.valido || !opcion) {
      errores.push("Elegí un libro.");
    }
    var resultado = Validaciones.validarCantidad(porId("venta-cantidad").value);
    if (!resultado.valido) {
      errores = errores.concat(resultado.errores);
    }
    if (errores.length > 0) {
      mostrarErrores(errores);
      return;
    }

    var libroId = libro.id;
    var titulo = opcion.getAttribute("data-titulo") || opcion.textContent;
    var precio = opcion.getAttribute("data-precio") || "";
    var existente = buscarRenglon(libroId);
    if (existente) {
      // Libro repetido: se suma a su renglón (un renglón por libro).
      if (existente.cantidad + resultado.cantidad > CANTIDAD_MAXIMA) {
        mostrarErrores(["La cantidad de «" + existente.titulo + "» no puede superar 2147483647."]);
        return;
      }
      existente.cantidad += resultado.cantidad;
    } else {
      borrador.renglones.push({
        libro_id: libroId,
        titulo: titulo,
        precio: precio,
        cantidad: resultado.cantidad
      });
    }
    renderBorrador();
  }

  function filaDe(elemento) {
    return elemento.closest("tr[data-libro-id]");
  }

  function alCambiarCantidad(evento) {
    var entrada = evento.target.closest("input[data-accion=\"cambiar-cantidad\"]");
    if (entrada) {
      confirmarCantidad(entrada);
    }
  }

  // Aplica la cantidad escrita en un renglón (o la revierte si no es válida).
  function confirmarCantidad(entrada) {
    var fila = filaDe(entrada);
    var renglon = fila ? buscarRenglon(Number(fila.getAttribute("data-libro-id"))) : null;
    if (!renglon) {
      return;
    }
    ocultarMensajes();
    var resultado = Validaciones.validarCantidad(entrada.value);
    if (resultado.valido) {
      renglon.cantidad = resultado.cantidad;
      entrada.value = String(resultado.cantidad);
    } else {
      entrada.value = String(renglon.cantidad);
      mostrarErrores(resultado.errores);
    }
  }

  // Enter en un campo del formulario no debe enviar la venta: agrega el renglón o confirma la edición.
  function alPresionarTecla(evento) {
    if (evento.key !== "Enter") {
      return;
    }
    var destino = evento.target;
    if (destino.id === "venta-cantidad" || destino.id === "venta-libro") {
      evento.preventDefault();
      if (!porId("venta-agregar-renglon").disabled) {
        agregarRenglon();
      }
      return;
    }
    var entrada = destino.closest ? destino.closest("input[data-accion=\"cambiar-cantidad\"]") : null;
    if (entrada) {
      evento.preventDefault();
      confirmarCantidad(entrada);
    }
  }

  function alHacerClicEnRenglones(evento) {
    var boton = evento.target.closest("button[data-accion=\"quitar-renglon\"]");
    if (!boton) {
      return;
    }
    var fila = filaDe(boton);
    if (!fila) {
      return;
    }
    var libroId = Number(fila.getAttribute("data-libro-id"));
    borrador.renglones = borrador.renglones.filter(function (renglon) {
      return renglon.libro_id !== libroId;
    });
    ocultarMensajes();
    renderBorrador();
    // La fila quitada se llevó el foco: se pasa a otro control estable.
    var siguiente = porId("venta-renglones").querySelector("button[data-accion=\"quitar-renglon\"]");
    (siguiente || porId("venta-libro")).focus();
  }

  // ---------------------------------------------------------------
  // Envío y comprobante
  // ---------------------------------------------------------------
  function ventaTieneForma(venta) {
    return !!venta && typeof venta === "object" && !Array.isArray(venta) &&
      venta.id !== undefined && venta.id !== null &&
      !!venta.cliente && typeof venta.cliente === "object" &&
      Array.isArray(venta.renglones);
  }

  // Los importes se escriben tal como llegan en la respuesta: sin conversiones ni cálculos.
  function mostrarComprobante(venta) {
    var bloque = porId("venta-registrada");
    escribirCampo(bloque, "id", texto(venta.id));
    escribirCampo(bloque, "cliente", texto(venta.cliente.nombre));
    escribirFecha(bloque, venta.fecha);
    escribirCampo(bloque, "total", texto(venta.total));

    var plantilla = porId("plantilla-fila-registrada");
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
    bloque.querySelector("tbody[data-campo=\"renglones\"]").replaceChildren(fragmento);
    porId("venta-ver-historial").setAttribute("href", "historial.html?venta=" + encodeURIComponent(String(venta.id)));
    bloque.hidden = false;
  }

  function reiniciarFormulario() {
    borrador.renglones = [];
    renderBorrador();
    porId("venta-cliente").value = "";
    porId("venta-libro").value = "";
    porId("venta-cantidad").value = "1";
  }

  function alRegistrar(venta) {
    if (!ventaTieneForma(venta)) {
      mostrarErrores([MENSAJE_VENTA_INESPERADA]);
      return;
    }
    mostrarComprobante(venta);
    reiniciarFormulario();
    ocultarMensajes();
    porId("venta-mensaje-ok").hidden = false;
    porId("titulo-venta-registrada").focus();
  }

  function alRechazar(error) {
    var texto = textoDeError(error);
    if (error && error.tipo === "red") {
      texto += " " + NOTA_RED;
    }
    mostrarErrores([texto]);
  }

  function alEnviar(evento) {
    evento.preventDefault();
    if (enviando) {
      return;
    }
    ocultarMensajes();
    var resultado = Validaciones.validarVenta(porId("venta-cliente").value, borrador.renglones);
    if (!resultado.valido) {
      mostrarErrores(resultado.errores);
      return;
    }

    porId("venta-registrada").hidden = true;
    bloquearBorrador(true);
    Api.pedir("/ventas/", { metodo: "POST", cuerpo: resultado.cuerpo }).then(
      function (venta) {
        bloquearBorrador(false);
        alRegistrar(venta);
      },
      function (error) {
        bloquearBorrador(false);
        alRechazar(error);
      }
    );
  }

  // ---------------------------------------------------------------
  // Inicialización
  // ---------------------------------------------------------------
  function inicializarVentas() {
    porId("form-venta").addEventListener("submit", alEnviar);
    porId("form-venta").addEventListener("keydown", alPresionarTecla);
    porId("venta-agregar-renglon").addEventListener("click", agregarRenglon);
    porId("venta-renglones").addEventListener("change", alCambiarCantidad);
    porId("venta-renglones").addEventListener("click", alHacerClicEnRenglones);
    porId("venta-opciones-reintentar").addEventListener("click", cargarOpciones);
    renderBorrador();
    cargarOpciones();
  }

  inicializarVentas();
})();
