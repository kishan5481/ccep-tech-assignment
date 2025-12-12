const express = require('express');
const healthGoalsRouter = require('./routes/healthGoals');

const app = express();
app.use(express.json());

// Routes
app.use('/resource', healthGoalsRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'Health Goal Service', timestamp: Date.now() });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
