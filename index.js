const express = require('express'); 
const fs = require('fs'); 
const bodyParser = require('body-parser'); 
const app = express(); 
const bodyP = bodyParser.json(); 
app.use(bodyP); 
const port = 3000; // Definimos el puerto donde el servidor estará disponible.

// ** Función para leer datos desde el archivo "datos.json". */
const leerDatos = () => {
    try {
        const datos = fs.readFileSync("./datos.json"); // Lee el archivo de manera sincrónica.
        return JSON.parse(datos); // Convierte el contenido del archivo de JSON a objeto JavaScript.
    } catch (error) {
        console.log(error); // Si ocurre un error, lo mostramos en la consola.
    }
};

// ** Función para escribir datos en el archivo "datos.json". */
const escribir = (datos) => {
    try {
        fs.writeFileSync("./datos.json", JSON.stringify(datos, null, 2)); // Escribe el archivo con formato.
    } catch (error) {
        console.log(error); // Si ocurre un error al escribir, lo mostramos en la consola.
    }
};

// ** Validar si una cuenta tiene saldo suficiente para realizar una operación. */
const validarSaldoSuficiente = (cuenta, monto) => {
    return cuenta.saldoActual >= monto; // Retorna true si el saldo es suficiente, de lo contrario false.
};

// ** Validar que una fecha ingresada no sea anterior al día actual. */
const validarFecha = (fecha) => {
    const fechaIngresada = new Date(fecha); // Convertimos la fecha ingresada a objeto Date.
    const hoy = new Date(); // Obtenemos la fecha actual.
    return fechaIngresada >= hoy; // Comprobamos que la fecha ingresada no sea anterior.
};

// Listar todos los usuarios.
app.get('/ListarUsuarios', (req, res) => {
    const datos = leerDatos(); // Leemos los datos desde el archivo.
    res.json(datos.usuarios); // Devolvemos la lista de usuarios en formato JSON.
});

// Buscar un usuario por su ID.
app.get('/BuscarUsuario/:id', (req, res) => {
    const datos = leerDatos(); // Leemos los datos desde el archivo.
    const id = parseInt(req.params.id); // Obtenemos el ID desde los parámetros.
    const usuario = datos.usuarios.find((usuario) => usuario.id === id); // Buscamos al usuario por ID.
    if (usuario) {
        res.json(usuario); // Si existe, lo devolvemos en la respuesta.
    } else {
        res.status(404).send("Usuario no encontrado."); // Si no existe, devolvemos un error 404.
    }
});

// Crear un nuevo usuario.
app.post('/SubirUsuario', (req, res) => {
    const datos = leerDatos(); // Leemos los datos existentes.
    const body = req.body; // Obtenemos los datos del cuerpo de la solicitud.
    const nuevoUsuario = {
        id: datos.usuarios.length + 1, // Generamos un nuevo ID para el usuario.
        ...body, // Añadimos el resto de los datos enviados en el cuerpo.
    };
    datos.usuarios.push(nuevoUsuario); // Agregamos el nuevo usuario al array.
    escribir(datos); // Guardamos los cambios en el archivo.
    res.json(nuevoUsuario); // Devolvemos el nuevo usuario en la respuesta.
});

// Actualizar un usuario existente por su ID.
app.put('/ActualizarUsuario/:id', (req, res) => {
    const datos = leerDatos(); // Leemos los datos existentes.
    const body = req.body; // Obtenemos los datos actualizados del cuerpo de la solicitud.
    const id = parseInt(req.params.id); // Obtenemos el ID desde los parámetros.
    const index = datos.usuarios.findIndex((usuario) => usuario.id === id); // Buscamos el índice del usuario.
    if (index !== -1) {
        datos.usuarios[index] = { ...datos.usuarios[index], ...body }; // Actualizamos los datos del usuario.
        escribir(datos); // Guardamos los cambios en el archivo.
        res.json({ message: "Usuario actualizado" }); // Confirmamos la actualización.
    } else {
        res.status(404).send("Usuario no encontrado."); // Si no existe, devolvemos un error 404.
    }
});

// Eliminar un usuario por su ID.
app.delete('/EliminarUsuario/:id', (req, res) => {
    const datos = leerDatos(); // Leemos los datos existentes.
    const id = parseInt(req.params.id); // Obtenemos el ID desde los parámetros.
    const index = datos.usuarios.findIndex((usuario) => usuario.id === id); // Buscamos el índice del usuario.
    if (index !== -1) {
        datos.usuarios.splice(index, 1); // Eliminamos el usuario del array.
        escribir(datos); // Guardamos los cambios en el archivo.
        res.json({ message: "Usuario eliminado" }); // Confirmamos la eliminación.
    } else {
        res.status(404).send("Usuario no encontrado."); // Si no existe, devolvemos un error 404.
    }
});

// ** Rutas para gestionar cuentas. */

// Listar todas las cuentas.
app.get('/ListarCuentas', (req, res) => {
    const datos = leerDatos(); // Leemos los datos existentes.
    res.json(datos.cuentas); // Devolvemos la lista de cuentas en formato JSON.
});

// Buscar una cuenta por su ID.
app.get('/BuscarCuenta/:id', (req, res) => {
    const datos = leerDatos(); // Leemos los datos existentes.
    const id = parseInt(req.params.id); // Obtenemos el ID desde los parámetros.
    const cuenta = datos.cuentas.find((cuenta) => cuenta.id === id); // Buscamos la cuenta por ID.
    if (cuenta) {
        res.json(cuenta); // Si existe, la devolvemos en la respuesta.
    } else {
        res.status(404).send("Cuenta no encontrada."); // Si no existe, devolvemos un error 404.
    }
});

// Crear una nueva cuenta.
app.post('/SubirCuenta', (req, res) => {
    const datos = leerDatos(); // Leemos los datos existentes.
    const body = req.body; // Obtenemos los datos del cuerpo de la solicitud.

    // Verificamos que el usuario asociado exista.
    const usuarioAsociado = datos.usuarios.find((usuario) => usuario.id === body.usuarioId);
    if (!usuarioAsociado) {
        return res.status(400).send("La cuenta debe estar asociada a un usuario existente.");
    }

    // Validamos que la fecha de apertura sea válida.
    if (!validarFecha(body.fechaApertura)) {
        return res.status(400).send("La fecha de apertura no puede ser anterior a hoy.");
    }

    // Creamos la nueva cuenta.
    const nuevaCuenta = {
        id: datos.cuentas.length + 1, // Generamos un nuevo ID.
        ...body, // Añadimos los datos enviados.
    };
    datos.cuentas.push(nuevaCuenta); // Agregamos la cuenta al array.
    escribir(datos); // Guardamos los cambios en el archivo.
    res.json(nuevaCuenta); // Devolvemos la nueva cuenta en la respuesta.
});

// Actualizar una cuenta existente por su ID.
app.put('/ActualizarCuenta/:id', (req, res) => {
    const datos = leerDatos(); // Leemos los datos existentes.
    const body = req.body; // Obtenemos los datos actualizados del cuerpo.
    const id = parseInt(req.params.id); // Obtenemos el ID desde los parámetros.
    const index = datos.cuentas.findIndex((cuenta) => cuenta.id === id); // Buscamos el índice de la cuenta.
    if (index !== -1) {
        datos.cuentas[index] = { ...datos.cuentas[index], ...body }; // Actualizamos los datos de la cuenta.
        escribir(datos); // Guardamos los cambios en el archivo.
        res.json({ message: "Cuenta actualizada" }); // Confirmamos la actualización.
    } else {
        res.status(404).send("Cuenta no encontrada."); // Si no existe, devolvemos un error 404.
    }
});

// Eliminar una cuenta por su ID.
app.delete('/EliminarCuenta/:id', (req, res) => {
    const datos = leerDatos(); // Leemos los datos existentes.
    const id = parseInt(req.params.id); // Obtenemos el ID desde los parámetros.
    const index = datos.cuentas.findIndex((cuenta) => cuenta.id === id); // Buscamos el índice de la cuenta.
    if (index !== -1) {
        datos.cuentas.splice(index, 1); // Eliminamos la cuenta del array.
        escribir(datos); // Guardamos los cambios en el archivo.
        res.json({ message: "Cuenta eliminada" }); // Confirmamos la eliminación.
    } else {
        res.status(404).send("Cuenta no encontrada."); // Si no existe, devolvemos un error 404.
    }
});

// ** Rutas para gestionar transacciones. */

// Listar todas las transacciones.
app.get('/ListarTransacciones', (req, res) => {
    const datos = leerDatos(); // Leemos los datos existentes.
    res.json(datos.transacciones); // Devolvemos la lista de transacciones.
});

// Buscar una transacción por su ID.
app.get('/BuscarTransaccion/:id', (req, res) => {
    const datos = leerDatos(); // Leemos los datos existentes.
    const id = parseInt(req.params.id); // Obtenemos el ID desde los parámetros.
    const transaccion = datos.transacciones.find((transaccion) => transaccion.id === id); // Buscamos la transacción.
    if (transaccion) {
        res.json(transaccion); // Si existe, la devolvemos.
    } else {
        res.status(404).send("Transacción no encontrada."); // Si no existe, devolvemos un error 404.
    }
});

// Crear una nueva transacción.
app.post('/SubirTransaccion', (req, res) => {
    const datos = leerDatos(); // Leemos los datos existentes.
    const body = req.body; // Obtenemos los datos del cuerpo.

    // Verificamos que la cuenta de origen exista.
    const cuentaOrigen = datos.cuentas.find((cuenta) => cuenta.numeroCuenta === body.cuentaOrigen);
    if (!cuentaOrigen) {
        return res.status(400).send("La cuenta de origen no existe.");
    }

    // Lógica para diferentes tipos de transacciones.
    if (body.tipoTransaccion === 'Transferencia') {
        // Transferencia: verificamos la cuenta de destino y el saldo.
        const cuentaDestino = datos.cuentas.find((cuenta) => cuenta.numeroCuenta === body.cuentaDestino);
        if (!cuentaDestino) {
            return res.status(400).send("La cuenta de destino no existe.");
        }
        if (!validarSaldoSuficiente(cuentaOrigen, body.monto)) {
            return res.status(400).send("Saldo insuficiente para la transferencia.");
        }
        // Realizamos la transferencia.
        cuentaOrigen.saldoActual -= body.monto;
        cuentaDestino.saldoActual += body.monto;
    } else if (body.tipoTransaccion === 'Retiro') {
        // Retiro: verificamos saldo suficiente.
        if (!validarSaldoSuficiente(cuentaOrigen, body.monto)) {
            return res.status(400).send("Saldo insuficiente para el retiro.");
        }
        cuentaOrigen.saldoActual -= body.monto;
    } else if (body.tipoTransaccion === 'Depósito') {
        // Depósito: simplemente añadimos el monto.
        cuentaOrigen.saldoActual += body.monto;
    }

    // Creamos la nueva transacción.
    const nuevaTransaccion = {
        id: datos.transacciones.length + 1, // Generamos un nuevo ID.
        ...body, // Añadimos los datos enviados.
    };
    datos.transacciones.push(nuevaTransaccion); // Agregamos la transacción al array.
    escribir(datos); // Guardamos los cambios en el archivo.
    res.json(nuevaTransaccion); // Devolvemos la nueva transacción.
});

// Actualizar una transacción existente.
app.put('/ActualizarTransaccion/:id', (req, res) => {
    const datos = leerDatos(); // Leemos los datos existentes.
    const body = req.body; // Obtenemos los datos actualizados del cuerpo.
    const id = parseInt(req.params.id); // Obtenemos el ID desde los parámetros.
    const index = datos.transacciones.findIndex((transaccion) => transaccion.id === id); // Buscamos la transacción.
    if (index !== -1) {
        datos.transacciones[index] = { ...datos.transacciones[index], ...body }; // Actualizamos la transacción.
        escribir(datos); // Guardamos los cambios en el archivo.
        res.json({ message: "Transacción actualizada" }); // Confirmamos la actualización.
    } else {
        res.status(404).send("Transacción no encontrada."); // Si no existe, devolvemos un error 404.
    }
});

// Eliminar una transacción por su ID.
app.delete('/EliminarTransaccion/:id', (req, res) => {
    const datos = leerDatos(); // Leemos los datos existentes.
    const id = parseInt(req.params.id); // Obtenemos el ID desde los parámetros.
    const index = datos.transacciones.findIndex((transaccion) => transaccion.id === id); // Buscamos la transacción.
    if (index !== -1) {
        datos.transacciones.splice(index, 1); // Eliminamos la transacción.
        escribir(datos); // Guardamos los cambios en el archivo.
        res.json({ message: "Transacción eliminada" }); // Confirmamos la eliminación.
    } else {
        res.status(404).send("Transacción no encontrada."); // Si no existe, devolvemos un error 404.
    }
});

// ** Inicio del servidor. */

// Arrancamos el servidor en el puerto definido.
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`); // Mensaje de confirmación.
});
