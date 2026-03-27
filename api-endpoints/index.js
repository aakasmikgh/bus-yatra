const express = require('express');
const swaggerUi = require('swagger-ui-express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5002;

const swaggerDocument = require('./swagger.json');

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/', (req, res) => {
    res.redirect('/api-docs');
});

app.listen(PORT, () => {
    console.log(`API Documentation running at http://localhost:${PORT}/api-docs`);
});
