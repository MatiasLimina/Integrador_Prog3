(function () {
  "use strict";

  // Única aparición de la base de la API: las rutas se pasan exactas a pedir().
  var BASE = "/api";

  var MENSAJE_RED = "No se pudo conectar con el servidor. Revisá la conexión e intentá de nuevo.";

  var MENSAJES_POR_CODIGO = {
    404: "No se encontró lo que se pidió.",
    409: "La operación entra en conflicto con datos existentes.",
    422: "Los datos enviados no son válidos."
  };

  function mensajeGenerico(estado) {
    if (MENSAJES_POR_CODIGO[estado]) {
      return MENSAJES_POR_CODIGO[estado];
    }
    if (estado >= 500) {
      return "El servidor tuvo un problema. Intentá de nuevo más tarde.";
    }
    return "No se pudo completar la operación (código " + estado + ").";
  }

  function construirConsulta(parametros) {
    if (!parametros) {
      return "";
    }
    var consulta = new URLSearchParams();
    Object.keys(parametros).forEach(function (clave) {
      var valor = parametros[clave];
      if (valor === undefined || valor === null || valor === "") {
        return;
      }
      consulta.append(clave, String(valor));
    });
    var texto = consulta.toString();
    return texto === "" ? "" : "?" + texto;
  }

  function mensajeDeLista(lista) {
    var partes = [];
    for (var i = 0; i < lista.length; i++) {
      var elemento = lista[i];
      if (!elemento || typeof elemento.msg !== "string") {
        continue;
      }
      var msg = elemento.msg.replace(/^Value error, /, "");
      var campo = Array.isArray(elemento.loc) ? elemento.loc[elemento.loc.length - 1] : undefined;
      partes.push(typeof campo === "string" ? campo + ": " + msg : msg);
    }
    return partes.join("; ");
  }

  function mensajeDeError(estado, datos) {
    if (datos && typeof datos === "object") {
      if (typeof datos.detail === "string" && datos.detail !== "") {
        return datos.detail;
      }
      if (Array.isArray(datos.detail)) {
        var desdeLista = mensajeDeLista(datos.detail);
        if (desdeLista !== "") {
          return desdeLista;
        }
      }
    }
    return mensajeGenerico(estado);
  }

  function errorRed(estado) {
    var error = { tipo: "red", mensaje: MENSAJE_RED };
    if (estado !== undefined) {
      error.estado = estado;
    }
    return error;
  }

  function interpretar(texto) {
    if (texto === "") {
      return null;
    }
    try {
      return JSON.parse(texto);
    } catch (e) {
      return undefined;
    }
  }

  function pedir(ruta, opciones) {
    var config = opciones || {};
    var init = { method: config.metodo || "GET", headers: {} };
    if (config.cuerpo !== undefined) {
      init.headers["Content-Type"] = "application/json";
      init.body = JSON.stringify(config.cuerpo);
    }

    var url = BASE + ruta + construirConsulta(config.parametros);

    return fetch(url, init).then(
      function (respuesta) {
        return respuesta.text().then(function (texto) {
          var datos = interpretar(texto);
          if (respuesta.ok) {
            return datos === undefined ? null : datos;
          }
          if (respuesta.status === 502 || respuesta.status === 503 || respuesta.status === 504) {
            throw errorRed(respuesta.status);
          }
          throw {
            tipo: "http",
            estado: respuesta.status,
            mensaje: mensajeDeError(respuesta.status, datos)
          };
        });
      },
      function () {
        throw errorRed();
      }
    ).catch(function (e) {
      // Cualquier fallo inesperado (p. ej. al leer el cuerpo) sale con la forma estable.
      throw (e && e.tipo) ? e : errorRed();
    });
  }

  window.Api = { pedir: pedir };
})();
