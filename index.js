const admin = require('firebase-admin');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
const nodemailer = require('nodemailer');
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

app.post('/invoice', (req, res) => {
    const { orders, customer, totalPrice } = req.body;
    const [customerName, customerNumber, customerAddress] = customer;
    const orderList = orders.join(', ');
    let emailHTML = htmlTemplate(orderList, customerName, customerNumber, customerAddress, totalPrice);
    let transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: 465,
        secure: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });
    let mailOptions = {
        from: process.env.EMAIL_USER,
        to: `${process.env.EMAIL_CLIENT}`,
        subject: 'NUEVO PEDIDO REALIZADO',
        html: emailHTML
    };
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.error('Error al enviar correo:', error);
        }
        console.log('Correo enviado:', info.response);
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto http://localhost:${PORT}`);
});

function htmlTemplate(orders, name, number, address, totalPrice) {
    const emailHTML = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
                background-color: #f9f9f9;
            }
            .container {
                width: 95%;
                margin: 20px auto;
                background-color: #ffffff;
                border-radius: 8px;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
                padding: 20px;
                box-sizing: border-box;
            }
            h1 {
                color: #298779;
            }
            .section {
                margin-bottom: 25px;
            }
            .section h2 {
                color: #F77F00;
                margin-bottom: 15px;
            }
            .section p {
                margin: 8px 0;
                color: #666666;
            }
            .footer {
                text-align: center;
                margin-top: 20px;
                font-size: 0.9em;
                color: #999999;
            }
            ul {
                padding-left: 20px;
            }
            li {
                margin-bottom: 5px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Nuevo pedido</h1>
            <div class="section">
                <h2>Detalles del Pedido</h2>
                <p><strong>${orders}</strong></p>
            </div>
            <div class="section">
                <h2>Detalles del Cliente</h2>
                <p><strong>Nombre:</strong> ${name}</p>
                <p><strong>Número telefónico:</strong> ${number}</p>
                <p><strong>Dirección:</strong> ${address}</p>
            </div>
            <div class="section">
                <h2>Total</h2>
                <h3><p><strong></strong> ${totalPrice} colones</p></h3>
            </div>
            <div class="footer">
                <p>Este correo se genera de manera automática. No responder.</p>
            </div>
        </div>
    </body>
    </html>
    `;
    return emailHTML;
}