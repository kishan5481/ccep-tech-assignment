const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
app.use(cors());

// Upstream microservice URL
const HEALTH_GOAL_SERVICE_URL = 'http://localhost:3000';

app.get('/', (req, res) => {
  res.json({ message: 'API Gateway running on port 8080' });
});

// Gateway Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'API Gateway',
    microservices: {
      healthGoal: `${HEALTH_GOAL_SERVICE_URL}/health`
    },
    timestamp: Date.now()
  });
});

// Proxy rules (forward all /goals to microservice)
app.use('/goals', createProxyMiddleware({
  target: 'http://localhost:3000',
  changeOrigin: true,
  pathRewrite: { '^/': '/resource' },
}));


const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`API Gateway running on port ${PORT}`));
