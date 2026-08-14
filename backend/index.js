const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Endpoint para recibir mensajes
app.post('/api/message', (req, res) => {
    const { message } = req.body;
    console.log(`Mensaje recibido: ${message}`);
    
    res.json({
        success: true,
        reply: `¡Hola desde el servidor! Recibí tu: "${message}"`
    });
});

// Endpoint básico de prueba
app.get('/health', (req, res) => {
    res.send('Backend operativo');
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
