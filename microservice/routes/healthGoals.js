const express = require('express');
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');

// Validation schema using Joi
const goalSchema = Joi.object({
  userId: Joi.string().required(),
  title: Joi.string().min(3).required(),
  description: Joi.string().optional().allow(''),
  targetDate: Joi.date().required(),
  status: Joi.string().valid('active', 'completed', 'abandoned').default('active')
});

// Factory function to create router with isolated state
function createHealthGoalsRouter() {
  const router = express.Router();
  const goals = [];

  /**
   * POST /resource → Create a new health goal
   */
  router.post('/', (req, res) => {
    const { error, value } = goalSchema.validate(req.body);

    if (error) return res.status(400).json({ error: error.details[0].message });

    const newGoal = { id: uuidv4(), ...value };
    goals.push(newGoal);

    res.status(201).json(newGoal);
  });

  /**
   * GET /resource → Retrieve all health goals
   */
  router.get('/', (req, res) => {
    res.json(goals);
  });

  /**
   * PUT /resource/:id → Update a resource
   */
  router.put('/:id', (req, res) => {
    const id = req.params.id;

    const index = goals.findIndex(goal => goal.id === id);
    if (index === -1)
      return res.status(404).json({ error: 'Health goal not found' });

    const { error, value } = goalSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    // Replace full object
    goals[index] = { id, ...value };

    res.json(goals[index]);
  });

  /**
   * DELETE /resource/:id → Delete a resource
   */
  router.delete('/:id', (req, res) => {
    const id = req.params.id;

    const index = goals.findIndex(goal => goal.id === id);
    if (index === -1)
      return res.status(404).json({ error: 'Health goal not found' });

    const deletedGoal = goals.splice(index, 1);
    res.json({ message: 'Health goal deleted', deletedGoal });
  });

  return router;
}

module.exports = createHealthGoalsRouter();
module.exports.createHealthGoalsRouter = createHealthGoalsRouter;
