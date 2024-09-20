const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Función para autenticar y obtener la información del usuario autenticado
const authenticateUser = async () => {
    try {
        const response = await axios.post('https://db.buckapi.com:8090/api/collections/users/auth-with-password', {
            identity: 'admin@email.com',
            password: 'admin1234'
        });

        if (response && response.data) {
            console.log('Autenticación exitosa:', response.data);
            return response.data; // Retorna los datos de autenticación
        } else {
            throw new Error('No se recibió una respuesta válida de autenticación');
        }
    } catch (error) {
        console.error('Error en la autenticación:', error.response ? error.response.data : error.message);
        throw new Error('No se pudo autenticar el usuario');
    }
};

// Función para obtener usuarios, validando si es admin o no
const getUsers = async (authData) => {
    try {
        const { token, record } = authData; // Cambiado a record

        // Validamos si el usuario es admin o no
        let queryParam = `id=${record.id}`; // Si no es admin, solo ve su propio usuario
        if (record.type === 'admin') {
            queryParam = ''; // Si es admin, puede ver todos los usuarios
        }

        console.log(`Consultando usuarios con el token: ${token}, queryParam: ${queryParam}`);

        const response = await axios.get(`https://db.buckapi.com:8090/api/collections/users/records?${queryParam}`, {
            headers: {
                Authorization: `Bearer ${token}` // Usamos el token de autenticación
            }
        });

        // Verificamos que la respuesta sea correcta
        if (response && response.data && response.data.items) {
            console.log('Usuarios obtenidos:', response.data.items);
            return response.data.items;
        } else {
            throw new Error('No se recibieron datos válidos al obtener usuarios');
        }
    } catch (error) {
        console.error('Error al obtener usuarios:', error.response ? error.response.data : error.message);
        throw new Error('No se pudieron obtener los usuarios');
    }
};

// Función para obtener las valoraciones de un especialista
const getRatingsBySpecialist = async (idSpecialist) => {
    try {
        const response = await axios.get('https://db.buckapi.com:8090/api/collections/camiwaRatings/records');
        return response.data.items.filter(rating => rating.idSpecialist === idSpecialist);
    } catch (error) {
        console.error('Error al obtener valoraciones:', error.response ? error.response.data : error.message);
        throw new Error('No se pudieron obtener las valoraciones');
    }
};

// Endpoint para obtener usuarios
app.get('/users', async (req, res) => {
    try {
        // Primero autenticamos al usuario
        const authData = await authenticateUser();
        // Luego obtenemos los usuarios con base en las reglas establecidas
        const users = await getUsers(authData);
        res.json(users);
    } catch (error) {
        console.error('Error general:', error);
        res.status(500).send('Error al obtener los usuarios');
    }
});

// Endpoint para obtener las valoraciones y enlazar con usuarios
app.get('/ratings/:idSpecialist', async (req, res) => {
    const { idSpecialist } = req.params;
    try {
        // Obtenemos las valoraciones
        const ratings = await getRatingsBySpecialist(idSpecialist);
        
        // Si no hay valoraciones, retornamos un array vacío
        if (ratings.length === 0) {
            return res.json([]);
        }

        // Obtenemos los usuarios
        const authData = await authenticateUser();
        const users = await getUsers(authData);

        // Enlazamos las valoraciones con los usuarios que las escribieron
        const ratingsWithUsers = ratings.map(rating => {
            const user = users.find(user => user.id === rating.idUser); // Asumiendo que idUser está en cada rating
            return {
                ...rating,
                user: user ? { id: user.id, email: user.email, name: user.name ,images: user.images } : null // Incluimos solo algunos campos del usuario
            };
        });

        // Retornamos las valoraciones con los detalles de los usuarios
        res.json(ratingsWithUsers);
    } catch (error) {
        console.error('Error al obtener valoraciones y usuarios:', error);
        res.status(500).send('Error al obtener los datos');
    }
});

app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
