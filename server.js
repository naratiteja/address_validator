const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const logger = require('./src/utils/logger');
const addressRoutes = require('./src/routes/address.routes');
const notFound = require('./src/middleware/notFound');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Security Middlewares
// Customize helmet for content security policy to allow bootstrap/axios CDN files
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://unpkg.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
        imgSrc: ["'self'", "data:", "https://*"],
        connectSrc: ["'self'", "https://nominatim.openstreetmap.org", "https://*.openstreetmap.org"]
      }
    }
  })
);
app.use(cors());

// Parsing Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend client files
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/address', addressRoutes);

// Fallback middlewares
app.use(notFound);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`Global Address Validation Server running on port ${PORT}`);
});

module.exports = app;
