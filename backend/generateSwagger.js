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
    // Using relative paths often works better with swagger-jsdoc globs
    apis: ['./routes/*.js', './server.js'], 
};

try {
    console.log(`[DEBUG] Current Directory: ${process.cwd()}`);
    console.log(`[DEBUG] Looking for routes in: ./routes/*.js`);
    
    const swaggerSpec = swaggerJsdoc(options);
    // Move up TWO levels to reach the root 'ticketing' directory from 'backend'
    const outputPath = path.resolve(__dirname, '../../api-endpoints/swagger.json');

    const pathCount = Object.keys(swaggerSpec.paths || {}).length;
    console.log(`[DEBUG] Paths found keys: ${Object.keys(swaggerSpec.paths || {}).join(', ')}`);
    console.log(`[DEBUG] Paths count: ${pathCount}`);

    // Ensure directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
        console.log(`[DEBUG] Creating directory: ${dir}`);
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(swaggerSpec, null, 2));
    console.log(`[SUCCESS] Swagger specification generated at ${outputPath}`);

    
    if (pathCount === 0) {
        console.warn(`[WARNING] No paths were found. Check your JSDoc comments and file paths.`);
    }
} catch (error) {
    console.error(`[ERROR] Swagger generation failed: ${error.message}`);
    console.error(error.stack);
}



