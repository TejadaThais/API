const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.json());
const port = 3000;

const leerDatos = () => {
    try {
        const datos = fs.readFileSync('./datos.json');
        return JSON.parse(datos);
    } catch (error) {
        console.error('Error al leer datos:', error);
    }
};

const escribirDatos = (datos) => {
    try {
        fs.writeFileSync('./datos.json', JSON.stringify(datos));
    } catch (error) {
        console.error('Error al escribir datos:', error);
    }
};

app.get('/', (req, res) => {
    res.send('API de Control de Cuentas Bancarias.');
});

// -------------------USUARIOS-----------------------
app.get('/ListarUsuarios', (req, res) => {
    const datos = leerDatos();
    res.json(datos.usuarios);
});

app.get('/ListarUsuarios/:id', (req, res) => {
    const datos = leerDatos();
    const id = parseInt(req.params.id);
    const usuario = datos.usuarios.find((u) => u.id === id);
    usuario ? res.json(usuario) : res.status(404).send('Usuario no encontrado.');
});

app.post('/SubirUsuarios', (req, res) => {
    const datos = leerDatos();
    const nuevoUsuario = {
        id: datos.usuarios.length + 1,
        ...req.body,
    };
    datos.usuarios.push(nuevoUsuario);
    escribirDatos(datos);
    res.json(nuevoUsuario);
});

app.put('/ActualizarUsuarios/:id', (req, res) => {
    const datos = leerDatos();
    const id = parseInt(req.params.id);
    const index = datos.usuarios.findIndex((u) => u.id === id);
    if (index !== -1) {
        datos.usuarios[index] = { ...datos.usuarios[index], ...req.body };
        escribirDatos(datos);
        res.json({ message: 'Usuario actualizado' });
    } else {
        res.status(404).send('Usuario no encontrado.');
    }
});

app.delete('/EliminarUsuarios/:id', (req, res) => {
    const datos = leerDatos();
    const id = parseInt(req.params.id);
    datos.usuarios = datos.usuarios.filter((u) => u.id !== id);
    escribirDatos(datos);
    res.json({ message: 'Usuario eliminado' });
});

// -------------------CUENTAS BANCARIAS-----------------------
app.get('/ListarCuentas', (req, res) => {
    const datos = leerDatos();
    res.json(datos.cuentas);
});

app.get('/ListarCuentas/:id', (req, res) => {
    const datos = leerDatos();
    const id = parseInt(req.params.id);
    const cuenta = datos.cuentas.find((c) => c.id === id);
    cuenta ? res.json(cuenta) : res.status(404).send('Cuenta no encontrada.');
});

app.post('/SubirCuentas', (req, res) => {
    const datos = leerDatos();
    const { usuarioId, fechaApertura, ...resto } = req.body;

    // Validación: Usuario asociado existe
    const usuario = datos.usuarios.find((u) => u.id === usuarioId);
    if (!usuario) {
        return res.status(400).json({ error: 'El usuario asociado no existe.' });
    }

    // Validación: Fecha de apertura no puede ser anterior a hoy
    const hoy = new Date().toISOString().split('T')[0];
    if (new Date(fechaApertura) < new Date(hoy)) {
        return res.status(400).json({ error: 'La fecha de apertura no puede ser anterior a hoy.' });
    }

    const nuevaCuenta = {
        id: datos.cuentas.length + 1,
        usuarioId,
        fechaApertura,
        ...resto,
    };

    datos.cuentas.push(nuevaCuenta);
    escribirDatos(datos);

    res.json(nuevaCuenta);
});

app.put('/ActualizarCuentas/:id', (req, res) => {
    const datos = leerDatos();
    const id = parseInt(req.params.id);
    const index = datos.cuentas.findIndex((c) => c.id === id);
    if (index !== -1) {
        datos.cuentas[index] = { ...datos.cuentas[index], ...req.body };
        escribirDatos(datos);
        res.json({ message: 'Cuenta actualizada' });
    } else {
        res.status(404).send('Cuenta no encontrada.');
    }
});

app.delete('/EliminarCuentas/:id', (req, res) => {
    const datos = leerDatos();
    const id = parseInt(req.params.id);
    datos.cuentas = datos.cuentas.filter((c) => c.id !== id);
    escribirDatos(datos);
    res.json({ message: 'Cuenta eliminada' });
});

// -------------------TRANSACCIONES-----------------------
app.get('/ListarTransacciones', (req, res) => {
    const datos = leerDatos();
    res.json(datos.transacciones);
});

app.post('/SubirTransacciones', (req, res) => {
    const datos = leerDatos();
    const { tipo, monto, cuentaOrigen, cuentaDestino, fecha } = req.body;

    // Validación: Fecha no puede ser anterior a hoy
    const hoy = new Date().toISOString().split('T')[0];
    if (new Date(fecha) < new Date(hoy)) {
        return res.status(400).json({ error: 'La fecha no puede ser anterior a hoy.' });
    }

    // Validación: Cuenta de origen existe
    const origen = datos.cuentas.find((c) => c.id === cuentaOrigen);
    if (!origen) {
        return res.status(400).json({ error: 'La cuenta de origen no existe.' });
    }

    // Validación: Saldo suficiente para transferencias/retiros
    if ((tipo === 'transferencia' || tipo === 'retiro') && origen.saldo < monto) {
        return res.status(400).json({ error: 'Saldo insuficiente en la cuenta de origen.' });
    }

    // Validación: Cuenta de destino existe (para transferencias)
    if (tipo === 'transferencia') {
        const destino = datos.cuentas.find((c) => c.id === cuentaDestino);
        if (!destino) {
            return res.status(400).json({ error: 'La cuenta de destino no existe.' });
        }
    }

    const nuevaTransaccion = {
        id: datos.transacciones.length + 1,
        tipo,
        monto,
        cuentaOrigen,
        cuentaDestino,
        fecha,
    };

    // Actualización de saldos
    if (tipo === 'retiro' || tipo === 'transferencia') {
        origen.saldo -= monto;
    }
    if (tipo === 'depósito') {
        origen.saldo += monto;
    }
    if (tipo === 'transferencia') {
        const destino = datos.cuentas.find((c) => c.id === cuentaDestino);
        destino.saldo += monto;
    }

    datos.transacciones.push(nuevaTransaccion);
    escribirDatos(datos);

    res.json(nuevaTransaccion);
});

// -------------------TARJETAS-----------------------
app.get('/ListarTarjetas', (req, res) => {
    const datos = leerDatos();
    res.json(datos.tarjetas);
});

app.post('/SubirTarjetas', (req, res) => {
    const datos = leerDatos();
    const nuevaTarjeta = {
        id: datos.tarjetas.length + 1,
        ...req.body,
    };
    datos.tarjetas.push(nuevaTarjeta);
    escribirDatos(datos);
    res.json(nuevaTarjeta);
});

// -------------------PRÉSTAMOS-----------------------
app.get('/ListarPrestamos', (req, res) => {
    const datos = leerDatos();
    res.json(datos.prestamos);
});

app.post('/SubirPrestamos', (req, res) => {
    const datos = leerDatos();
    const nuevoPrestamo = {
        id: datos.prestamos.length + 1,
        ...req.body,
    };
    datos.prestamos.push(nuevoPrestamo);
    escribirDatos(datos);
    res.json(nuevoPrestamo);
});

app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});