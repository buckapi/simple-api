const awsServerlessExpress = require('aws-serverless-express');
const express = require('express');
const axios = require('axios');

const app = express();

// Código de autenticación y obtención de datos (igual al código anterior)

const authenticateUser = async () => {
    // ...
};

const getUsers = async (authData) => {
    // ...
};

const getRatingsBySpecialist = async (idSpecialist) => {
    // ...
};

// Rutas de la aplicación Express

app.get('/users', async (req, res) => {
    try {
        const authData = await authenticateUser();
        const users = await getUsers(authData);
        res.json(users);
    } catch (error) {
        res.status(500).send('Error al obtener los usuarios');
    }
});

app.get('/ratings/:idSpecialist', async (req, res) => {
    const { idSpecialist } = req.params;
    try {
        const ratings = await getRatingsBySpecialist(idSpecialist);
        const authData = await authenticateUser();
        const users = await getUsers(authData);
        const ratingsWithUsers = ratings.map(rating => {
            const user = users.find(user => user.id === rating.idUser);
            return {
                ...rating,
                user: user ? { id: user.id, email: user.email, name: user.name, images: user.images } : null
            };
        });
        res.json(ratingsWithUsers);
    } catch (error) {
        res.status(500).send('Error al obtener los datos');
    }
});

// Convertimos la app de Express en un servidor manejado por AWS Lambda
const server = awsServerlessExpress.createServer(app);

// Handler de Lambda
exports.handler = (event, context) => {
    awsServerlessExpress.proxy(server, event, context);
};
