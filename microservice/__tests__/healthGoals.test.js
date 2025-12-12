const request = require('supertest');
const express = require('express');
const { createHealthGoalsRouter } = require('../routes/healthGoals');

describe('Health Goals API', () => {
  let app;
  let healthGoalsRouter;

  beforeEach(() => {
    // Create fresh app instance and router with isolated state for each test
    app = express();
    app.use(express.json());
    healthGoalsRouter = createHealthGoalsRouter();
    app.use('/resource', healthGoalsRouter);
  });

  describe('GET /resource', () => {
    it('should return an empty array initially', async () => {
      const res = await request(app).get('/resource');

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual([]);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return all health goals after creation', async () => {
      const goal = {
        userId: 'user-123',
        title: 'Lose Weight',
        description: 'Lose 10 pounds',
        targetDate: '2025-12-31T00:00:00.000Z',
        status: 'active'
      };

      // Create goal
      const createRes = await request(app)
        .post('/resource')
        .send(goal);

      expect(createRes.statusCode).toBe(201);
      expect(createRes.body).toHaveProperty('id');

      // Get all goals
      const getRes = await request(app).get('/resource');

      expect(getRes.statusCode).toBe(200);
      expect(getRes.body).toHaveLength(1);
      expect(getRes.body[0].title).toBe('Lose Weight');
    });
  });

  describe('POST /resource', () => {
    it('should create a new health goal with all fields', async () => {
      const goal = {
        userId: 'user-456',
        title: 'Build Muscle',
        description: 'Gain 10 pounds of muscle',
        targetDate: '2025-06-30T00:00:00.000Z',
        status: 'active'
      };

      const res = await request(app)
        .post('/resource')
        .send(goal);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.userId).toBe('user-456');
      expect(res.body.title).toBe('Build Muscle');
      expect(res.body.description).toBe('Gain 10 pounds of muscle');
      expect(res.body.status).toBe('active');
    });

    it('should create goal with minimal required fields', async () => {
      const goal = {
        userId: 'user-789',
        title: 'Run 5K',
        targetDate: '2025-05-15T00:00:00.000Z'
      };

      const res = await request(app)
        .post('/resource')
        .send(goal);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.userId).toBe('user-789');
      expect(res.body.title).toBe('Run 5K');
      expect(res.body.status).toBe('active'); // default status
    });

    it('should assign default status "active" when not provided', async () => {
      const goal = {
        userId: 'user-001',
        title: 'Meditate Daily',
        targetDate: '2025-12-31T00:00:00.000Z'
      };

      const res = await request(app)
        .post('/resource')
        .send(goal);

      expect(res.statusCode).toBe(201);
      expect(res.body.status).toBe('active');
    });

    it('should reject goal missing required userId field', async () => {
      const goal = {
        title: 'Sleep 8 Hours',
        targetDate: '2025-12-31T00:00:00.000Z'
      };

      const res = await request(app)
        .post('/resource')
        .send(goal);

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toMatch(/userId/i);
    });

    it('should reject goal missing required title field', async () => {
      const goal = {
        userId: 'user-123',
        targetDate: '2025-12-31T00:00:00.000Z'
      };

      const res = await request(app)
        .post('/resource')
        .send(goal);

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toMatch(/title/i);
    });

    it('should reject goal with title shorter than 3 characters', async () => {
      const goal = {
        userId: 'user-123',
        title: 'Go',
        targetDate: '2025-12-31T00:00:00.000Z'
      };

      const res = await request(app)
        .post('/resource')
        .send(goal);

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should reject goal missing required targetDate field', async () => {
      const goal = {
        userId: 'user-123',
        title: 'Valid Title'
      };

      const res = await request(app)
        .post('/resource')
        .send(goal);

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toMatch(/targetDate/i);
    });

    it('should reject goal with invalid status value', async () => {
      const goal = {
        userId: 'user-123',
        title: 'Test Goal',
        targetDate: '2025-12-31T00:00:00.000Z',
        status: 'invalid-status'
      };

      const res = await request(app)
        .post('/resource')
        .send(goal);

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toMatch(/status/i);
    });

    it('should accept all valid status values', async () => {
      const validStatuses = ['active', 'completed', 'abandoned'];

      for (const status of validStatuses) {
        const goal = {
          userId: 'user-123',
          title: 'Status Test',
          targetDate: '2025-12-31T00:00:00.000Z',
          status
        };

        const res = await request(app)
          .post('/resource')
          .send(goal);

        expect(res.statusCode).toBe(201);
        expect(res.body.status).toBe(status);
      }
    });

    it('should generate unique IDs for each goal', async () => {
      const goal1 = {
        userId: 'user-123',
        title: 'Goal 1',
        targetDate: '2025-12-31T00:00:00.000Z'
      };

      const goal2 = {
        userId: 'user-123',
        title: 'Goal 2',
        targetDate: '2025-12-31T00:00:00.000Z'
      };

      const res1 = await request(app)
        .post('/resource')
        .send(goal1);

      const res2 = await request(app)
        .post('/resource')
        .send(goal2);

      expect(res1.body.id).not.toBe(res2.body.id);
      expect(res1.statusCode).toBe(201);
      expect(res2.statusCode).toBe(201);
    });
  });

  describe('PUT /resource/:id', () => {
    let goalId;

    beforeEach(async () => {
      // Create a goal to update
      const goal = {
        userId: 'user-123',
        title: 'Original Title',
        description: 'Original description',
        targetDate: '2025-12-31T00:00:00.000Z',
        status: 'active'
      };

      const res = await request(app)
        .post('/resource')
        .send(goal);

      goalId = res.body.id;
    });

    it('should update an existing goal', async () => {
      const updated = {
        userId: 'user-123',
        title: 'Updated Title',
        description: 'Updated description',
        targetDate: '2025-06-30T00:00:00.000Z',
        status: 'completed'
      };

      const res = await request(app)
        .put(`/resource/${goalId}`)
        .send(updated);

      expect(res.statusCode).toBe(200);
      expect(res.body.id).toBe(goalId);
      expect(res.body.title).toBe('Updated Title');
      expect(res.body.description).toBe('Updated description');
      expect(res.body.status).toBe('completed');
    });

    it('should return 404 for non-existent goal', async () => {
      const updated = {
        userId: 'user-123',
        title: 'Updated Title',
        targetDate: '2025-12-31T00:00:00.000Z'
      };

      const res = await request(app)
        .put('/resource/non-existent-id')
        .send(updated);

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toMatch(/not found/i);
    });

    it('should validate required fields on update', async () => {
      const updated = {
        userId: 'user-123',
        title: 'Valid',
        // missing targetDate
      };

      const res = await request(app)
        .put(`/resource/${goalId}`)
        .send(updated);

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should preserve goal ID after update', async () => {
      const updated = {
        userId: 'user-456',
        title: 'New Title',
        targetDate: '2025-12-31T00:00:00.000Z',
        status: 'abandoned'
      };

      const res = await request(app)
        .put(`/resource/${goalId}`)
        .send(updated);

      expect(res.statusCode).toBe(200);
      expect(res.body.id).toBe(goalId);
    });

    it('should fully replace goal object', async () => {
      const updated = {
        userId: 'new-user',
        title: 'Completely New Goal',
        description: 'New description',
        targetDate: '2025-01-01T00:00:00.000Z',
        status: 'completed'
      };

      const res = await request(app)
        .put(`/resource/${goalId}`)
        .send(updated);

      expect(res.statusCode).toBe(200);
      expect(res.body.userId).toBe('new-user');
      expect(res.body.title).toBe('Completely New Goal');
      expect(res.body.description).toBe('New description');
    });
  });

  describe('DELETE /resource/:id', () => {
    let goalId;

    beforeEach(async () => {
      const goal = {
        userId: 'user-123',
        title: 'Goal to Delete',
        targetDate: '2025-12-31T00:00:00.000Z',
        status: 'active'
      };

      const res = await request(app)
        .post('/resource')
        .send(goal);

      goalId = res.body.id;
    });

    it('should delete an existing goal', async () => {
      const res = await request(app)
        .delete(`/resource/${goalId}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('deletedGoal');
      expect(res.body.deletedGoal[0].id).toBe(goalId);
    });

    it('should return 404 when deleting non-existent goal', async () => {
      const res = await request(app)
        .delete('/resource/non-existent-id');

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toMatch(/not found/i);
    });

    it('should actually remove goal from list', async () => {
      // Delete the goal
      const deleteRes = await request(app)
        .delete(`/resource/${goalId}`);

      expect(deleteRes.statusCode).toBe(200);

      // Verify it's gone
      const getRes = await request(app).get('/resource');

      expect(getRes.statusCode).toBe(200);
      expect(getRes.body).toHaveLength(0);
    });

    it('should not affect other goals when deleting one', async () => {
      // Create another goal
      const otherGoal = {
        userId: 'user-456',
        title: 'Other Goal',
        targetDate: '2025-12-31T00:00:00.000Z'
      };

      const createRes = await request(app)
        .post('/resource')
        .send(otherGoal);

      const otherGoalId = createRes.body.id;

      // Delete first goal
      const deleteRes = await request(app)
        .delete(`/resource/${goalId}`);

      expect(deleteRes.statusCode).toBe(200);

      // Verify only other goal remains
      const getRes = await request(app).get('/resource');

      expect(getRes.body).toHaveLength(1);
      expect(getRes.body[0].id).toBe(otherGoalId);
    });
  });

  describe('Content-Type & Format', () => {
    it('should return JSON content type on GET', async () => {
      const res = await request(app).get('/resource');

      expect(res.headers['content-type']).toMatch(/json/);
    });

    it('should return JSON content type on POST', async () => {
      const goal = {
        userId: 'user-123',
        title: 'Test Goal',
        targetDate: '2025-12-31T00:00:00.000Z'
      };

      const res = await request(app)
        .post('/resource')
        .send(goal);

      expect(res.headers['content-type']).toMatch(/json/);
    });

    it('should accept JSON requests', async () => {
      const goal = {
        userId: 'user-123',
        title: 'Test Goal',
        targetDate: '2025-12-31T00:00:00.000Z'
      };

      const res = await request(app)
        .post('/resource')
        .set('Content-Type', 'application/json')
        .send(goal);

      expect(res.statusCode).toBe(201);
    });
  });
});
