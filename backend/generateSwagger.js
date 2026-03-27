const swaggerJsdoc = require('swagger-jsdoc');
const fs = require('fs');
const path = require('path');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Bus Ticketing System API',
            version: '1.0.0',
            description: 'API documentation for the Bus Ticketing System',
        },
        servers: [
            {
                url: 'http://localhost:5001',
                description: 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: [path.join(__dirname, './routes/*.js')], // Path to the API docs
};

const swaggerSpec = swaggerJsdoc(options);

const outputPath = path.join(__dirname, '../api-endpoints/swagger.json');

// Ensure directory exists
const dir = path.dirname(outputPath);
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

fs.writeFileSync(outputPath, JSON.stringify(swaggerSpec, null, 2));

console.log(`Swagger specification generated at ${outputPath}`);
