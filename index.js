const admin = require('firebase-admin');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
const app = express();

app.use(bodyParser.json());
app.use(cors());
require('dotenv').config();

const serviceAccount = {
    "type": "service_account",
    "project_id": process.env.FIREBASE_PROJECT_ID,
    "private_key_id": process.env.FIREBASE_PRIVATE_KEY_ID,
    "private_key": process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    "client_email": process.env.FIREBASE_CLIENT_EMAIL,
    "client_id": process.env.FIREBASE_CLIENT_ID,
    "auth_uri": process.env.FIREBASE_AUTH_URI,
    "token_uri": process.env.FIREBASE_TOKEN_URI,
    "auth_provider_x509_cert_url": process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    "client_x509_cert_url": process.env.FIREBASE_CLIENT_X509_CERT_URL
};

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DB_URL
});

app.get('/', (req, res) => {
    res.send('Servidor corriendo correctamente');
});

app.get('/products', (req, res) => {
    const url = `${admin.app().options.databaseURL}/products.json`;
    axios.get(url)
        .then(response => {
            res.send(response.data);
        })
        .catch(error => {
            console.error(error, req);
            res.status(500).send('Error obteniendo los productos');
        });
});

const PORT = process.env.PORT || 3000; // Utiliza el puerto definido por la variable de entorno PORT o el puerto 3000 por defecto

// Inicia el servidor y comienza a escuchar en el puerto especificado
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto http://localhost:${PORT}`);
});