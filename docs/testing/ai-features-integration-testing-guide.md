# AI Features Integration Testing Guide

## Overview
This guide provides comprehensive instructions for running integration tests for FlyUp's AI features, including adaptive quiz generation, chatbot, and course recommendations.

## Test Scripts Overview

### Available Test Scripts
All test scripts are located in `backend/scripts/`:

1. **Environment & Utilities Testing**
   - Not a standalone script, utilities used by other tests
   - Location: `backend/scripts/test-utils/`

2. **Adaptive Quiz Generation**
   - Script: `test-adaptive-quiz-generation-comprehensive.js`
   - Tests: CAT algorithm, IRT parameters, caching, error handling
   - Duration: ~2-3 minutes

3. **Chatbot with Rate Limiting**
   - Script: `test-chatbot-with-rate-limiting-and-streaming.js`
   - Tests: Standard endpoint, SSE streaming, conversation memory, rate limits
   - Duration: ~3-4 minutes (includes rate limit waits)

4. **Course Recommendations**
   - Script: `test-ai-course-recommendations-with-caching.js`
   - Tests: AI recommendations, caching, authorization, performance
   - Duration: ~1-2 minutes

5. **Cross-Feature Integration**
   - Script: `test-cross-feature-integration-and-infrastructure.js`
   - Tests: Database pooling, Redis concurrency, feature isolation
   - Duration: ~2-3 minutes (includes rate limit waits)

## Prerequisites

### Required Software
- Node.js 18 or higher
- Access to PostgreSQL database (Supabase)
- Access to Redis instance (Upstash)
- Valid API keys (Groq)

### Required Environment Variables
Create or verify `.env` file in `backend/` directory:

```env
# Server Configuration
API_BASE_URL=http://localhost:5000
PORT=5000

# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Redis
REDIS_URL=redis://user:password@host:port

# Authentication
JWT_SECRET=your-jwt-secret-here

# AI Services
GROQ_API_KEY=your-groq-api-key-here

# Optional: Pre-generated test token
TEST_JWT_TOKEN=your-test-jwt-token-here
```

### Database Setup
1. Ensure database has test data:
   - At least one user with enrollments
   - Courses with sections and lectures
   - Assignments with MCQ questions
   - Some questions with IRT parameters (ParamA, ParamB, ParamC)

2. Run database migrations if needed:
   ```bash
   cd backend
   npx prisma migrate deploy
   npx prisma generate
   ```

### Backend Server
Tests require the backend server to be running:

```bash
cd backend
npm run dev
```

Server should be accessible at `http://localhost:5000` (or configured API_BASE_URL)

## Quick Start

### Running All Tests
```bash
cd backend

# Run each test script individually
node scripts/test-adaptive-quiz-generation-comprehensive.js
node scripts/test-chatbot-with-rate-limiting-and-streaming.js
node scripts/test-ai-course-recommendations-with-caching.js
node scripts/test-cross-feature-integration-and-infrastructure.js
```

### Running Specific Tests
Each script is standalone and can be run independently. Order doesn't matter.

## Test Execution Workflow

### 1. Pre-Test Checklist
- [ ] Backend server running
- [ ] Environment variables configured
- [ ] Database accessible
- [ ] Redis accessible
- [ ] Groq API key valid
- [ ] Test data exists in database

### 2. Execute Tests
Run scripts one at a time or in sequence:

```bash
# Quiz generation tests
node scripts/test-adaptive-quiz-generation-comprehensive.js

# Wait for rate limits to reset (60 seconds)
sleep 60

# Chatbot tests
node scripts/test-chatbot-with-rate-limiting-and-streaming.js

# Wait for rate limits to reset
sleep 60

# Recommendations tests
node scripts/test-ai-course-recommendations-with-caching.js

# Wait for rate limits to reset
sleep 60

# Cross-feature tests
node scripts/test-cross-feature-integration-and-infrastructure.js
```

### 3. Review Results
Each test script outputs:
- ✅ Success indicators
- ❌ Failure indicators
- ⚠️ Warning indicators
- 📊 Final summary

Example output:
```
=================================================================
📊 Test Summary
-----------------------------------------------------------------
  Total Tests: 9
  ✅ Passed: 8
  ❌ Failed: 0
  ⚠️  Warnings: 1
=================================================================

✅ All tests passed!
```

## Understanding Test Results

### Exit Codes
- `0` - All tests passed (warnings allowed)
- `1` - One or more tests failed

### Result Types

#### Success (✅)
Test executed correctly and met all criteria.

#### Failure (❌)
Test failed to meet requirements. Requires investigation.

#### Warning (⚠️)
Test passed but with caveats:
- Performance slower than target
- Optional features unavailable
- Degraded service state
- Acceptable edge cases

### Common Warnings
1. **"Cache may not be working"** - Redis unavailable, features still work
2. **"Service degraded"** - Cache or AI service partially unavailable
3. **"Performance slower than target"** - Response took longer than ideal
4. **"Insufficient questions"** - Test user/course lacks required data

## Troubleshooting

See [troubleshooting-ai-integration-test-failures.md](troubleshooting-ai-integration-test-failures.md) for detailed solutions.

### Quick Fixes

#### "Database connection failed"
```bash
# Check DATABASE_URL
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

#### "Redis not available"
```bash
# Check REDIS_URL
echo $REDIS_URL

# Test connection
redis-cli -u $REDIS_URL ping
```

#### "JWT_SECRET not configured"
```bash
# Ensure .env has JWT_SECRET
grep JWT_SECRET backend/.env
```

#### "No test user found"
```sql
-- Create test user (in database)
INSERT INTO "Users" ("Id", "UserName", "Email", "Role")
VALUES (uuid_generate_v4(), 'TestUser', 'test@example.com', 'Student');
```

## CI/CD Integration

### GitHub Actions Example
```yaml
name: AI Features Integration Tests

on:
  push:
    branches: [main, dev/*]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          cd backend
          npm install

      - name: Setup database
        run: |
          cd backend
          npx prisma migrate deploy
          npx prisma db seed  # If you have seed script

      - name: Start backend server
        run: |
          cd backend
          npm run dev &
          sleep 10  # Wait for server to start
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
          REDIS_URL: redis://localhost:6379
          JWT_SECRET: ${{ secrets.JWT_SECRET }}
          GROQ_API_KEY: ${{ secrets.GROQ_API_KEY }}

      - name: Run integration tests
        run: |
          cd backend
          node scripts/test-adaptive-quiz-generation-comprehensive.js
          sleep 60
          node scripts/test-chatbot-with-rate-limiting-and-streaming.js
          sleep 60
          node scripts/test-ai-course-recommendations-with-caching.js
          sleep 60
          node scripts/test-cross-feature-integration-and-infrastructure.js
```

## Best Practices

### Development Testing
1. Run tests before committing changes
2. Test on feature branches
3. Verify all tests pass locally
4. Review warnings for potential issues

### Continuous Integration
1. Run tests on every pull request
2. Block merges if tests fail
3. Monitor test execution time
4. Alert on persistent warnings

### Maintenance
1. Update tests when features change
2. Add tests for new features
3. Keep documentation current
4. Review and optimize slow tests

## Performance Benchmarks

### Expected Response Times

#### Quiz Generation
- Uncached: < 2 seconds
- Cached: < 500ms

#### Chatbot
- Standard: < 5 seconds
- Streaming: Chunks within 1 second

#### Recommendations
- Uncached: < 3 seconds
- Cached: < 500ms

### Memory Usage
- Test execution: < 200MB increase
- Stable after garbage collection

## Support

### Getting Help
- Review [troubleshooting-ai-integration-test-failures.md](troubleshooting-ai-integration-test-failures.md)
- Check environment variables
- Verify database connectivity
- Validate test data exists

### Reporting Issues
Include in bug reports:
1. Full test output
2. Environment configuration (no secrets!)
3. Database state description
4. Steps to reproduce

---
*Last Updated: 2026-02-12*
