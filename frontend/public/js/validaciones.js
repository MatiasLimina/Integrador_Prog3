(function () {
  "use strict";

  var FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var FORMATO_PRECIO = /^\d+(\.\d{1,2})?$/;
  var FORMATO_ENTERO = /^-?\d+$/;
  var PRECIO_MAXIMO = 99999999.99;
  var ENTERO_MAXIMO = 2147483647;
  var ROLES = ["autor", "coautor", "traductor", "ilustrador"];

  // Texto -> string seguro para validar (nunca null/undefined).
  function comoTexto(valor) {
    if (valor === undefined || valor === null) {
      return "";
    }
    return String(valor);
  }

  // Texto de un entero -> Number, o null si no es un entero escrito en decimal.
  function comoEntero(texto) {
    if (!FORMATO_ENTERO.test(texto)) {
      return null;
    }
    return Number(texto);
  }

  // Valida el precio recortado; devuelve el error o "" si es válido.
  function errorDePrecio(precioTexto) {
    if (precioTexto === "") {
      return "El precio es obligatorio.";
    }
    if (isNaN(Number(precioTexto))) {
      return "El precio debe ser un número.";
    }
    if (Number(precioTexto) <= 0) {
      return "El precio debe ser mayor que cero.";
    }
    if (!FORMATO_PRECIO.test(precioTexto)) {
      return "El precio admite hasta dos decimales.";
    }
    if (Number(precioTexto) > PRECIO_MAXIMO) {
      return "El precio no puede superar 99999999.99.";
    }
    return "";
  }

  // Valida el stock recortado; devuelve el error o "" si es válido.
  function errorDeStock(stockTexto) {
    if (stockTexto === "") {
      return "El stock es obligatorio.";
    }
    var stock = comoEntero(stockTexto);
    if (stock === null) {
      return "El stock debe ser un número entero.";
    }
    if (stock < 0) {
      return "El stock no puede ser negativo.";
    }
    if (stock > ENTERO_MAXIMO) {
      return "El stock no puede superar 2147483647.";
    }
    return "";
  }

  // Valida un alta de libro. Pura: no toca DOM ni datos. `cuerpo` es el JSON del contrato.
  // `autorias` es el borrador: [{autor_id, nombre, rol, orden}].
  function validarLibro(entrada, autorias) {
    var datos = entrada || {};
    var lista = autorias || [];
    var errores = [];

    var titulo = comoTexto(datos.titulo).trim();
    if (titulo === "") {
      errores.push("El título es obligatorio.");
    }

    var isbn = comoTexto(datos.isbn).trim();
    if (isbn === "") {
      errores.push("El ISBN es obligatorio.");
    }

    var precioTexto = comoTexto(datos.precio).trim();
    var errorPrecio = errorDePrecio(precioTexto);
    if (errorPrecio !== "") {
      errores.push(errorPrecio);
    }

    var stockTexto = comoTexto(datos.stock).trim();
    var errorStock = errorDeStock(stockTexto);
    if (errorStock !== "") {
      errores.push(errorStock);
    }

    var editorialTexto = comoTexto(datos.editorialId).trim();
    var editorialId = comoEntero(editorialTexto);
    if (editorialId === null || editorialId < 1) {
      errores.push("Elegí una editorial.");
    }

    var generoTexto = comoTexto(datos.generoId).trim();
    var generoId = generoTexto === "" ? null : comoEntero(generoTexto);
    if (generoTexto !== "" && (generoId === null || generoId < 1)) {
      errores.push("El género seleccionado no es válido.");
    }

    if (lista.length === 0) {
      errores.push("Agregá al menos un autor.");
    }

    var autores = [];
    for (var i = 0; i < lista.length; i++) {
      autores.push({
        autor_id: lista[i].autor_id,
        rol: lista[i].rol,
        orden: lista[i].orden
      });
    }

    return {
      valido: errores.length === 0,
      errores: errores,
      cuerpo: {
        isbn: isbn,
        titulo: titulo,
        precio: precioTexto,
        stock: errorStock === "" ? Number(stockTexto) : stockTexto,
        editorial_id: editorialId,
        genero_id: generoId,
        autores: autores
      }
    };
  }

  // Valida una autoría antes de agregarla al borrador. Pura.
  // entrada: {autorId, rol, orden}; autorias: borrador actual [{autor_id, ...}].
  function validarAutoria(entrada, autorias) {
    var datos = entrada || {};
    var lista = autorias || [];
    var errores = [];

    var autorTexto = comoTexto(datos.autorId).trim();
    var autorId = comoEntero(autorTexto);
    if (autorId === null || autorId < 1) {
      errores.push("Elegí un autor.");
    } else {
      for (var i = 0; i < lista.length; i++) {
        if (lista[i].autor_id === autorId) {
          errores.push("Ese autor ya está en el libro.");
          break;
        }
      }
    }

    var rol = comoTexto(datos.rol).trim();
    if (ROLES.indexOf(rol) === -1) {
      errores.push("El rol debe ser autor, coautor, traductor o ilustrador.");
    }

    var ordenTexto = comoTexto(datos.orden).trim();
    var orden = comoEntero(ordenTexto);
    if (orden === null || orden < 1 || orden > ENTERO_MAXIMO) {
      errores.push("El orden debe ser un entero mayor o igual que 1.");
    }

    return {
      valido: errores.length === 0,
      errores: errores,
      autoria: { autor_id: autorId, rol: rol, orden: orden }
    };
  }

  // Valida un alta de cliente. Pura. No decide la unicidad del email: la decide la API.
  function validarCliente(entrada) {
    var datos = entrada || {};
    var errores = [];

    var nombre = comoTexto(datos.nombreCompleto).trim();
    if (nombre === "") {
      errores.push("El nombre completo es obligatorio.");
    }

    var email = comoTexto(datos.email).trim();
    if (email === "") {
      errores.push("El email es obligatorio.");
    } else if (!FORMATO_EMAIL.test(email)) {
      errores.push("El email no tiene un formato válido.");
    }

    return {
      valido: errores.length === 0,
      errores: errores,
      cuerpo: { nombre: nombre, email: email }
    };
  }

  // Texto de un ID -> número si es un entero entre 1 y 2147483647; si no, null.
  function idEntero(texto) {
    var id = comoEntero(comoTexto(texto).trim());
    if (id === null || id < 1 || id > ENTERO_MAXIMO) {
      return null;
    }
    return id;
  }

  // Valida el ID escrito para buscar un cliente: entero entre 1 y 2147483647.
  function validarIdCliente(texto) {
    var id = idEntero(texto);
    if (id === null) {
      return {
        valido: false,
        errores: ["El ID debe ser un entero entre 1 y 2147483647."],
        id: null
      };
    }
    return { valido: true, errores: [], id: id };
  }

  // Valida el ID de un libro elegido en el selector: entero entre 1 y 2147483647.
  function validarIdLibro(texto) {
    var id = idEntero(texto);
    if (id === null) {
      return { valido: false, errores: ["Elegí un libro."], id: null };
    }
    return { valido: true, errores: [], id: id };
  }

  // Valida el identificador de venta de `?venta=N`: entero entre 1 y 2147483647.
  function validarIdVenta(texto) {
    var id = idEntero(texto);
    if (id === null) {
      return {
        valido: false,
        errores: ["El identificador de venta no es válido."],
        id: null
      };
    }
    return { valido: true, errores: [], id: id };
  }

  // Valida una cantidad escrita: entero entre 1 y 2147483647 (recortado). Pura.
  function validarCantidad(texto) {
    var id = idEntero(texto);
    if (id === null) {
      return {
        valido: false,
        errores: ["La cantidad debe ser un entero entre 1 y 2147483647."],
        cantidad: null
      };
    }
    return { valido: true, errores: [], cantidad: id };
  }

  // Valida una venta (RN-15, RN-16, RN-17, RN-20). Pura: no toca DOM ni datos.
  // `renglones` es el borrador [{libro_id, titulo, precio, cantidad}]; el cuerpo solo
  // lleva {libro_id, cantidad}. La existencia de cliente y libros la decide la API.
  function validarVenta(clienteId, renglones) {
    var lista = renglones || [];
    var errores = [];

    var cliente = idEntero(clienteId);
    if (cliente === null) {
      errores.push("Elegí un cliente.");
    }

    if (lista.length === 0) {
      errores.push("La venta debe tener al menos un renglón.");
    }

    var cuerpoRenglones = [];
    var vistos = {};
    var errorLibro = false;
    var errorCantidad = false;
    var errorRepetido = false;
    for (var i = 0; i < lista.length; i++) {
      var renglon = lista[i] || {};
      var libro = idEntero(renglon.libro_id);
      if (libro === null) {
        errorLibro = true;
      } else if (vistos[libro]) {
        errorRepetido = true;
      } else {
        vistos[libro] = true;
      }
      var cantidad = idEntero(renglon.cantidad);
      if (cantidad === null) {
        errorCantidad = true;
      }
      cuerpoRenglones.push({ libro_id: libro, cantidad: cantidad });
    }
    if (errorLibro) {
      errores.push("Hay un renglón con un libro no válido.");
    }
    if (errorCantidad) {
      errores.push("La cantidad debe ser un entero entre 1 y 2147483647.");
    }
    if (errorRepetido) {
      errores.push("Un libro no puede repetirse en la venta.");
    }

    return {
      valido: errores.length === 0,
      errores: errores,
      cuerpo: { cliente_id: cliente, renglones: cuerpoRenglones }
    };
  }

  window.Validaciones = {
    validarLibro: validarLibro,
    validarAutoria: validarAutoria,
    validarCliente: validarCliente,
    validarIdCliente: validarIdCliente,
    validarIdVenta: validarIdVenta,
    validarIdLibro: validarIdLibro,
    validarCantidad: validarCantidad,
    validarVenta: validarVenta
  };
})();
