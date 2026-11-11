(function () {
  "use strict";

  // Altas y listados de Libros y Clientes contra la API (I-03).
  // Un solo script para las dos páginas: cada sección se activa si existe su formulario.
  // Todo dato escrito por el usuario o devuelto por la API se inserta con textContent.

  var MENSAJE_RESPUESTA_INVALIDA = "El servidor devolvió una respuesta inesperada. Intentá de nuevo.";

  // ---- Comunes ------------------------------------------------------------

  function porId(id) {
    return document.getElementById(id);
  }

  // Escribe un único campo [data-campo] como texto plano, sin inyectar marcado (regla dura 5).
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

  function nombreGenero(genero) {
    return genero ? genero.nombre : "Sin clasificar";
  }

  // Muestra solo el estado indicado entre los mensajes y la tabla de un listado.
  // true si el listado muestra datos completos ("filas" o "vacio"); false si
  // está cargando o falló, y entonces agregar una fila suelta lo haría parecer completo.
  function listadoMuestraDatos(prefijo) {
    return !porId(prefijo + "-tabla").hidden || !porId(prefijo + "-mensaje-vacio").hidden;
  }

  function mostrarEstadoListado(prefijo, estado) {
    porId(prefijo + "-mensaje-cargando").hidden = estado !== "cargando";
    porId(prefijo + "-mensaje-vacio").hidden = estado !== "vacio";
    porId(prefijo + "-mensaje-error-carga").hidden = estado !== "error";
    porId(prefijo + "-tabla").hidden = estado !== "filas";
  }

  // Mensajes de resultado de un formulario de alta (uno visible a la vez).
  function obtenerMensajes(prefijo) {
    return {
      ok: porId(prefijo + "-mensaje-ok"),
      error: porId(prefijo + "-mensaje-error"),
      lista: porId(prefijo + "-errores")
    };
  }

  function ocultarMensajes(mensajes) {
    mensajes.ok.hidden = true;
    mensajes.error.hidden = true;
    mensajes.lista.replaceChildren();
  }

  function mostrarExito(mensajes, texto) {
    mensajes.error.hidden = true;
    mensajes.ok.textContent = texto;
    mensajes.ok.hidden = false;
  }

  // Un <li> por error (textContent), muestra el error y oculta el OK.
  function mostrarErrores(mensajes, errores) {
    var fragmento = document.createDocumentFragment();
    for (var i = 0; i < errores.length; i++) {
      var item = document.createElement("li");
      item.textContent = errores[i];
      fragmento.appendChild(item);
    }
    mensajes.lista.replaceChildren(fragmento);
    mensajes.ok.hidden = true;
    mensajes.error.hidden = false;
  }

  // Preserva la primera opción literal (value="") del HTML y agrega las de la API.
  function reconstruirOpciones(select, items) {
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
      opcion.textContent = items[i].nombre;
      fragmento.appendChild(opcion);
    }
    select.replaceChildren(fragmento);
  }

  // ==========================================================================
  // LIBROS
  // ==========================================================================

  var autorias = []; // borrador del formulario: [{autor_id, nombre, rol, orden}]
  var nombresAutores = {}; // id -> nombre, para mostrar el borrador
  var opcionesListas = false;
  var numeroCargaLibros = 0;
  var numeroCargaOpciones = 0;
  var enviandoLibro = false;
  var cantidadLibros = 0;

  // ---- Listado de libros ----

  function escribirFilaLibro(libro) {
    var plantilla = porId("plantilla-fila-libro");
    var fila = plantilla.content.firstElementChild.cloneNode(true);
    fila.setAttribute("data-libro-id", String(libro.id));
    escribirCampo(fila, "titulo", libro.titulo);
    escribirCampo(fila, "isbn", libro.isbn);
    escribirCampo(fila, "editorial", libro.editorial ? libro.editorial.nombre : "");
    escribirCampo(fila, "genero", nombreGenero(libro.genero));
    escribirCampo(fila, "precio", String(libro.precio));
    escribirCampo(fila, "stock", String(libro.stock));
    return fila;
  }

  function renderLibros(libros) {
    var fragmento = document.createDocumentFragment();
    for (var i = 0; i < libros.length; i++) {
      fragmento.appendChild(escribirFilaLibro(libros[i]));
    }
    porId("libros-lista").replaceChildren(fragmento);
    cantidadLibros = libros.length;
    mostrarEstadoListado("libros", libros.length === 0 ? "vacio" : "filas");
  }

  function cargarLibros() {
    var numero = ++numeroCargaLibros;
    porId("libros-lista").replaceChildren();
    cantidadLibros = 0;
    mostrarEstadoListado("libros", "cargando");

    Api.listarTodo("/libros/").then(function (libros) {
      if (numero !== numeroCargaLibros) {
        return;
      }
      renderLibros(libros);
    }, function (error) {
      if (numero !== numeroCargaLibros) {
        return;
      }
      porId("libros-mensaje-error-carga-texto").textContent = textoDeError(error);
      mostrarEstadoListado("libros", "error");
    });
  }

  function agregarFilaLibro(libro) {
    if (!listadoMuestraDatos("libros")) {
      cargarLibros(); // relee todo: incluye el libro nuevo y descarta la carga en curso
      return;
    }
    porId("libros-lista").appendChild(escribirFilaLibro(libro));
    cantidadLibros += 1;
    mostrarEstadoListado("libros", "filas");
  }

  // ---- Opciones del formulario (editoriales, géneros, autores) ----

  function actualizarBotonesLibro() {
    porId("libro-enviar").disabled = !opcionesListas || enviandoLibro;
    porId("libro-autoria-agregar").disabled = !opcionesListas;
  }

  function cargarOpciones() {
    var numero = ++numeroCargaOpciones;
    opcionesListas = false;
    porId("libro-opciones-error").hidden = true;
    actualizarBotonesLibro();

    Promise.all([
      Api.listarTodo("/editoriales/"),
      Api.listarTodo("/generos/"),
      Api.listarTodo("/autores/")
    ]).then(function (resultados) {
      if (numero !== numeroCargaOpciones) {
        return;
      }
      reconstruirOpciones(porId("libro-editorial"), resultados[0]);
      reconstruirOpciones(porId("libro-genero"), resultados[1]);
      reconstruirOpciones(porId("libro-autoria-autor"), resultados[2]);
      nombresAutores = {};
      for (var i = 0; i < resultados[2].length; i++) {
        nombresAutores[resultados[2][i].id] = resultados[2][i].nombre;
      }
      opcionesListas = true;
      actualizarBotonesLibro();
    }, function (error) {
      if (numero !== numeroCargaOpciones) {
        return;
      }
      porId("libro-opciones-error-texto").textContent =
        "No se pudieron cargar las opciones del formulario. " + textoDeError(error);
      porId("libro-opciones-error").hidden = false;
      actualizarBotonesLibro();
    });
  }

  // ---- Editor de autorías ----

  function renderAutorias() {
    var ordenadas = autorias.slice().sort(function (a, b) {
      return a.orden - b.orden; // sort estable: empates en orden de carga
    });
    var fragmento = document.createDocumentFragment();
    for (var i = 0; i < ordenadas.length; i++) {
      var autoria = ordenadas[i];
      var item = document.createElement("li");

      var texto = document.createElement("span");
      texto.textContent = autoria.nombre + " — " + autoria.rol + " (orden " + autoria.orden + ")";
      item.appendChild(texto);

      var quitar = document.createElement("button");
      quitar.type = "button";
      quitar.setAttribute("data-autor-id", String(autoria.autor_id));
      quitar.appendChild(document.createTextNode("Quitar"));
      var oculto = document.createElement("span");
      oculto.className = "visualmente-oculto";
      oculto.textContent = " a " + autoria.nombre;
      quitar.appendChild(oculto);
      item.appendChild(quitar);

      fragmento.appendChild(item);
    }
    porId("libro-autorias-lista").replaceChildren(fragmento);
  }

  function ordenSugerido() {
    var maximo = 0;
    for (var i = 0; i < autorias.length; i++) {
      if (autorias[i].orden > maximo) {
        maximo = autorias[i].orden;
      }
    }
    return maximo + 1;
  }

  function mostrarErrorAutoria(texto) {
    var mensaje = porId("libro-autoria-error");
    mensaje.textContent = texto;
    mensaje.hidden = texto === "";
  }

  function agregarAutoria() {
    var selectAutor = porId("libro-autoria-autor");
    var resultado = window.Validaciones.validarAutoria({
      autorId: selectAutor.value,
      rol: porId("libro-autoria-rol").value,
      orden: porId("libro-autoria-orden").value
    }, autorias);

    if (!resultado.valido) {
      mostrarErrorAutoria(resultado.errores.join(" "));
      return;
    }

    mostrarErrorAutoria("");
    var autor = resultado.autoria;
    autorias.push({
      autor_id: autor.autor_id,
      nombre: nombresAutores[autor.autor_id] || selectAutor.options[selectAutor.selectedIndex].textContent,
      rol: autor.rol,
      orden: autor.orden
    });
    renderAutorias();
    selectAutor.value = "";
    porId("libro-autoria-orden").value = String(ordenSugerido());
  }

  function quitarAutoria(evento) {
    var boton = evento.target.closest("button[data-autor-id]");
    if (!boton) {
      return;
    }
    var id = Number(boton.getAttribute("data-autor-id"));
    autorias = autorias.filter(function (autoria) {
      return autoria.autor_id !== id;
    });
    mostrarErrorAutoria("");
    renderAutorias();
    porId("libro-autoria-orden").value = String(ordenSugerido());
  }

  function reiniciarAutorias() {
    autorias = [];
    renderAutorias();
    mostrarErrorAutoria("");
    porId("libro-autoria-orden").value = "1";
  }

  // ---- Alta de libro ----

  function leerEntradaLibro() {
    return {
      titulo: porId("libro-titulo").value,
      isbn: porId("libro-isbn").value,
      precio: porId("libro-precio").value,
      stock: porId("libro-stock").value,
      editorialId: porId("libro-editorial").value,
      generoId: porId("libro-genero").value
    };
  }

  function mostrarLibroRegistrado(libro) {
    var bloque = porId("libro-registrado");
    escribirCampo(bloque, "id", String(libro.id));
    escribirCampo(bloque, "titulo", libro.titulo);
    escribirCampo(bloque, "isbn", libro.isbn);
    escribirCampo(bloque, "precio", String(libro.precio));
    escribirCampo(bloque, "stock", String(libro.stock));
    escribirCampo(bloque, "editorial", libro.editorial ? libro.editorial.nombre : "");
    escribirCampo(bloque, "genero", nombreGenero(libro.genero));

    var fragmento = document.createDocumentFragment();
    var lista = Array.isArray(libro.autores) ? libro.autores : [];
    for (var i = 0; i < lista.length; i++) {
      var item = document.createElement("li");
      item.textContent = lista[i].nombre + " — " + lista[i].rol + " (orden " + lista[i].orden + ")";
      fragmento.appendChild(item);
    }
    porId("libro-registrado-autorias").replaceChildren(fragmento);
    bloque.hidden = false;
  }

  function manejarAltaLibro(evento) {
    evento.preventDefault();
    if (enviandoLibro) {
      return;
    }
    var mensajes = obtenerMensajes("libros");
    ocultarMensajes(mensajes);
    porId("libro-registrado").hidden = true;

    var resultado = window.Validaciones.validarLibro(leerEntradaLibro(), autorias);
    if (!resultado.valido) {
      mostrarErrores(mensajes, resultado.errores);
      return;
    }

    enviandoLibro = true;
    actualizarBotonesLibro();

    Api.pedir("/libros/", { metodo: "POST", cuerpo: resultado.cuerpo }).then(function (libro) {
      enviandoLibro = false;
      actualizarBotonesLibro();
      if (!libro || typeof libro !== "object") {
        mostrarErrores(mensajes, [MENSAJE_RESPUESTA_INVALIDA]);
        return;
      }
      mostrarLibroRegistrado(libro);
      agregarFilaLibro(libro);
      porId("form-libro").reset();
      reiniciarAutorias();
      mostrarExito(mensajes, "Libro registrado correctamente.");
    }, function (error) {
      enviandoLibro = false;
      actualizarBotonesLibro();
      mostrarErrores(mensajes, [textoDeError(error)]);
    });
  }

  function inicializarLibros() {
    var formulario = porId("form-libro");
    formulario.addEventListener("submit", manejarAltaLibro);
    porId("libro-autoria-agregar").addEventListener("click", agregarAutoria);
    porId("libro-autorias-lista").addEventListener("click", quitarAutoria);
    porId("libro-opciones-reintentar").addEventListener("click", cargarOpciones);
    porId("libros-reintentar").addEventListener("click", cargarLibros);
    actualizarBotonesLibro();
    cargarOpciones();
    cargarLibros();
  }

  // ==========================================================================
  // CLIENTES
  // ==========================================================================

  var numeroCargaClientes = 0;
  var numeroBusqueda = 0;
  var enviandoCliente = false;

  // ---- Listado de clientes ----

  function escribirFilaCliente(cliente) {
    var plantilla = porId("plantilla-fila-cliente");
    var fila = plantilla.content.firstElementChild.cloneNode(true);
    fila.setAttribute("data-cliente-id", String(cliente.id));
    escribirCampo(fila, "id", String(cliente.id));
    escribirCampo(fila, "nombreCompleto", cliente.nombre);
    escribirCampo(fila, "email", cliente.email);
    return fila;
  }

  function renderClientes(clientes) {
    var fragmento = document.createDocumentFragment();
    for (var i = 0; i < clientes.length; i++) {
      fragmento.appendChild(escribirFilaCliente(clientes[i]));
    }
    porId("clientes-lista").replaceChildren(fragmento);
    mostrarEstadoListado("clientes", clientes.length === 0 ? "vacio" : "filas");
  }

  function cargarClientes() {
    var numero = ++numeroCargaClientes;
    porId("clientes-lista").replaceChildren();
    mostrarEstadoListado("clientes", "cargando");

    Api.listarTodo("/clientes/").then(function (clientes) {
      if (numero !== numeroCargaClientes) {
        return;
      }
      renderClientes(clientes);
    }, function (error) {
      if (numero !== numeroCargaClientes) {
        return;
      }
      porId("clientes-mensaje-error-carga-texto").textContent = textoDeError(error);
      mostrarEstadoListado("clientes", "error");
    });
  }

  // ---- Alta de cliente ----

  function manejarAltaCliente(evento) {
    evento.preventDefault();
    if (enviandoCliente) {
      return;
    }
    var mensajes = obtenerMensajes("clientes");
    ocultarMensajes(mensajes);

    var resultado = window.Validaciones.validarCliente({
      nombreCompleto: porId("cliente-nombre-completo").value,
      email: porId("cliente-email").value
    });
    if (!resultado.valido) {
      mostrarErrores(mensajes, resultado.errores);
      return;
    }

    var boton = porId("form-cliente").querySelector('button[type="submit"]');
    enviandoCliente = true;
    boton.disabled = true;

    Api.pedir("/clientes/", { metodo: "POST", cuerpo: resultado.cuerpo }).then(function (cliente) {
      enviandoCliente = false;
      boton.disabled = false;
      if (!cliente || typeof cliente !== "object") {
        mostrarErrores(mensajes, [MENSAJE_RESPUESTA_INVALIDA]);
        return;
      }
      if (listadoMuestraDatos("clientes")) {
        porId("clientes-lista").appendChild(escribirFilaCliente(cliente));
        mostrarEstadoListado("clientes", "filas");
      } else {
        cargarClientes(); // relee todo: incluye el cliente nuevo y descarta la carga en curso
      }
      porId("form-cliente").reset();
      mostrarExito(mensajes, "Cliente registrado correctamente con ID " + cliente.id + ".");
    }, function (error) {
      enviandoCliente = false;
      boton.disabled = false;
      mostrarErrores(mensajes, [textoDeError(error)]);
    });
  }

  // ---- Búsqueda de cliente por ID ----

  function manejarBusquedaCliente(evento) {
    evento.preventDefault();
    var numero = ++numeroBusqueda;
    var cargando = porId("buscar-cliente-cargando");
    var error = porId("buscar-cliente-error");
    var resultadoCaja = porId("buscar-cliente-resultado");

    resultadoCaja.hidden = true;
    error.hidden = true;
    cargando.hidden = true;

    var validacion = window.Validaciones.validarIdCliente(porId("buscar-cliente-id").value);
    if (!validacion.valido) {
      error.textContent = validacion.errores.join(" ");
      error.hidden = false;
      return;
    }

    cargando.hidden = false;
    Api.pedir("/clientes/" + validacion.id).then(function (cliente) {
      if (numero !== numeroBusqueda) {
        return;
      }
      cargando.hidden = true;
      if (!cliente || typeof cliente !== "object") {
        error.textContent = MENSAJE_RESPUESTA_INVALIDA;
        error.hidden = false;
        return;
      }
      escribirCampo(resultadoCaja, "id", String(cliente.id));
      escribirCampo(resultadoCaja, "nombre", cliente.nombre);
      escribirCampo(resultadoCaja, "email", cliente.email);
      resultadoCaja.hidden = false;
    }, function (fallo) {
      if (numero !== numeroBusqueda) {
        return;
      }
      cargando.hidden = true;
      error.textContent = fallo && fallo.tipo === "http" && fallo.estado === 404
        ? fallo.mensaje
        : textoDeError(fallo);
      error.hidden = false;
    });
  }

  function inicializarClientes() {
    porId("form-cliente").addEventListener("submit", manejarAltaCliente);
    porId("form-buscar-cliente").addEventListener("submit", manejarBusquedaCliente);
    porId("clientes-reintentar").addEventListener("click", cargarClientes);
    cargarClientes();
  }

  // ---- Arranque -----------------------------------------------------------

  if (porId("form-libro")) {
    inicializarLibros();
  }
  if (porId("form-cliente")) {
    inicializarClientes();
  }
})();
