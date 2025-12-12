# ccep-tech-assignment

CCEP MACH Microservice Exercise
Candidate Name: K.Kishan

**Health Goal Service — REST Endpoints**

- **Location:** `microservice`
- **Service port (default):** `3000`

**Microservice base URL**

- `http://localhost:3000`

**Health Check**

- `GET /health`
  - Response: `200 OK` JSON: `{ status: 'OK', service: 'Health Goal Service', timestamp: <ms> }`

**Health Goals Resource**

- Base path: `/resource`

- `GET /resource`
  - Returns list of health goals (array).
  - Response: `200 OK` JSON array `[]` or `[ {...}, ... ]`.

- `POST /resource`
  - Create a new health goal.
  - Request `Content-Type: application/json`.
  - Request body schema (JSON):
    - `userId` (string, required)
    - `title` (string, required, min length 3)
    - `description` (string, optional)
    - `targetDate` (ISO date string, required)
    - `status` (one of `active`, `completed`, `abandoned`; default `active`)
  - Success: `201 Created` with created object `{ id, userId, title, description, targetDate, status }`.
  - Validation failure: `400 Bad Request` with `{ error: '<message>' }`.

- `PUT /resource/:id`
  - Replace/update a health goal by `id`.
  - Request body uses same schema as `POST` (validation applies).
  - Success: `200 OK` with updated object.
  - Not found: `404 Not Found` with `{ error: 'Health goal not found' }`.

- `DELETE /resource/:id`
  - Delete a health goal by `id`.
  - Success: `200 OK` with `{ message: 'Health goal deleted', deletedGoal: [ ... ] }`.
  - Not found: `404 Not Found`.

Example curl requests (microservice)

```bash
# Health
curl -i http://localhost:3000/health

# List goals
curl -i http://localhost:3000/resource

# Create goal
curl -i -X POST http://localhost:3000/resource \
  -H "Content-Type: application/json" \
  -d '{"userId":"user-1","title":"Run 5K","targetDate":"2025-12-31T00:00:00.000Z"}'

# Update goal
curl -i -X PUT http://localhost:3000/resource/<id> \
  -H "Content-Type: application/json" \
  -d '{"userId":"user-1","title":"Run 10K","targetDate":"2026-06-30T00:00:00.000Z","status":"active"}'

# Delete goal
curl -i -X DELETE http://localhost:3000/resource/<id>
```

Gateway (API Gateway)

- **Location:** `gateway`
- **Gateway port (default):** `8080`
- **Gateway base URL:** `http://localhost:8080`

Proxy mappings (configured in `gateway/server.js`):

- `GET /health` — gateway health status
- `GET|POST|PUT|DELETE /goals` — proxied to `microservice:/resource`
  - The gateway rewrites paths so `GET /goals` → `GET /resource` on the microservice.

Example curl requests (gateway)

```bash
curl -i http://localhost:8080/health
curl -i http://localhost:8080/goals
curl -i -X POST http://localhost:8080/goals -H "Content-Type: application/json" -d '{"userId":"u","title":"T","targetDate":"2025-12-31T00:00:00.000Z"}'
```

Notes

- The microservice uses an in-memory store; data is not persisted between restarts.
- Validation errors return `400` with an `error` message.
- Not found returns `404` with an `error` message.
- To run the service locally:
  - Microservice:
    ```bash
    cd microservice
    npm install
    npm start    # runs server.js on port 3000
    ```
  - Gateway:
    ```bash
    cd gateway
    npm install
    npm start    # runs server.js on port 8080
    ```

- To run unit tests for the microservice:
  ```bash
  cd microservice
  npm test
  npm run test:coverage
  ```


