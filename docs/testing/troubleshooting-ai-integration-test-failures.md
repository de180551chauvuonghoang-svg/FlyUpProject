# Troubleshooting AI Integration Test Failures

## Common Issues & Solutions

### Environment Configuration Issues

#### "Environment variable not set"
**Cause:** Missing required environment variable in `.env` file

**Solution:**
```bash
# Check current environment
cd backend
cat .env

# Add missing variables
echo "GROQ_API_KEY=your-key-here" >> .env
```

**Required Variables:**
- `DATABASE_URL`
- `REDIS_URL`
- `JWT_SECRET`
- `GROQ_API_KEY`
- `API_BASE_URL` (optional, defaults to http://localhost:5000)

#### "Cannot find module"
**Cause:** Missing dependencies

**Solution:**
```bash
cd backend
npm install
```

### Database Issues

#### "Database connection failed"
**Symptoms:**
- Test fails immediately
- Error: "Cannot reach database server"

**Solutions:**

1. **Check DATABASE_URL format:**
   ```
   postgresql://USER:PASSWORD@HOST:PORT/DATABASE
   ```

2. **Test connection:**
   ```bash
   psql $DATABASE_URL -c "SELECT 1"
   ```

3. **Verify Supabase status:**
   - Check Supabase dashboard
   - Verify database is not paused
   - Check connection pooling limits

4. **Check network access:**
   ```bash
   ping your-database-host.supabase.co
   ```

#### "No test user found"
**Cause:** Database has no users with enrollments

**Solution:**
```sql
-- Check existing users
SELECT "Id", "UserName", "Email" FROM "Users" LIMIT 5;

-- Check enrollments
SELECT * FROM "Enrollments" LIMIT 5;

-- Create test user if needed (adjust as needed)
INSERT INTO "Users" ("Id", "UserName", "Email", "PasswordHash", "Role")
VALUES (
  uuid_generate_v4(),
  'TestUser',
  'test@example.com',
  '$2a$10$example.hash.here',
  'Student'
);
```

#### "Insufficient questions"
**Cause:** Course/sections have too few questions

**Solution:**
1. Use a different course with more content
2. Reduce `questionCount` in test
3. Add more questions to database

### Redis Issues

#### "Redis not available"
**Symptoms:**
- Warning: "Cache may not be working"
- Service marked as "degraded"

**Solutions:**

1. **Check REDIS_URL:**
   ```bash
   echo $REDIS_URL
   # Should be: redis://[user]:[pass]@host:port
   ```

2. **Test connection:**
   ```bash
   redis-cli -u $REDIS_URL ping
   # Should return: PONG
   ```

3. **Check Upstash dashboard:**
   - Verify Redis instance is active
   - Check connection limits
   - Review rate limits

4. **Verify network access:**
   ```bash
   telnet your-redis-host.upstash.io 6379
   ```

**Note:** Tests can run without Redis but will show warnings and slower performance.

### API / Backend Issues

#### "Backend server not running"
**Symptoms:**
- Error: "ECONNREFUSED"
- Error: "connect ECONNREFUSED 127.0.0.1:5000"

**Solution:**
```bash
# Start backend server
cd backend
npm run dev

# Verify server is running
curl http://localhost:5000/api/health
```

#### "Request timeout"
**Cause:** Backend slow or unresponsive

**Solutions:**
1. Check backend logs for errors
2. Verify Groq API key is valid
3. Check database query performance
4. Increase timeout in test (if needed)

#### "Rate limit exceeded (429)"
**Cause:** Too many requests too quickly

**Solution:**
```bash
# Wait 60 seconds between test runs
sleep 60

# Or increase rate limits in code (for testing only)
# Edit backend/src/middleware/rateLimitMiddleware.js
```

### Authentication Issues

#### "JWT_SECRET missing"
**Cause:** JWT_SECRET not configured

**Solution:**
```bash
# Add to .env
echo "JWT_SECRET=$(openssl rand -base64 32)" >> backend/.env
```

#### "Invalid token format"
**Cause:** Malformed TEST_JWT_TOKEN

**Solution:**
1. Remove TEST_JWT_TOKEN from .env (let tests generate)
2. Or generate valid token:
   ```javascript
   import jwt from 'jsonwebtoken';
   const token = jwt.sign({ userId: 'test-id' }, process.env.JWT_SECRET);
   console.log(token);
   ```

### AI Service Issues

#### "Groq API error"
**Symptoms:**
- Error: "AI service unavailable"
- Error: "Invalid API key"

**Solutions:**

1. **Verify API key:**
   ```bash
   # Check key is set
   echo $GROQ_API_KEY

   # Test with curl
   curl -X POST https://api.groq.com/openai/v1/chat/completions \
     -H "Authorization: Bearer $GROQ_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"model":"llama-3.3-70b-versatile","messages":[{"role":"user","content":"test"}]}'
   ```

2. **Check rate limits:**
   - Groq has rate limits per minute
   - Wait between test runs
   - Check Groq dashboard for quota

3. **Fallback behavior:**
   - Some tests will use fallback logic
   - Warnings expected when AI unavailable

### Test-Specific Issues

#### Quiz Generation Tests

**"Insufficient IRT questions"**
- **Cause:** Questions missing ParamA, ParamB, ParamC
- **Solution:** Test will use difficulty-based fallback (warning expected)

**"User not enrolled"**
- **Cause:** Test user has no enrollment in test course
- **Solution:** Create enrollment or use different user

#### Chatbot Tests

**"SSE connection closed"**
- **Cause:** Normal behavior for streaming tests
- **Solution:** Warning expected, not a failure

**"Conversation memory not working"**
- **Cause:** Redis unavailable or session expired
- **Solution:** Ensure Redis is running

#### Recommendations Tests

**"No recommendations returned"**
- **Cause:** User has no enrollment history or AI couldn't generate
- **Solution:** Use user with enrollments, check AI service

### Performance Issues

#### "Response time too slow"
**Symptoms:**
- Warning: "Performance slower than target"
- Tests take minutes instead of seconds

**Solutions:**

1. **Check database performance:**
   - Review query execution plans
   - Ensure indexes exist
   - Check connection pool size

2. **Check network latency:**
   - Test database ping time
   - Test API ping time

3. **Check server resources:**
   - CPU usage
   - Memory available
   - Disk I/O

#### "Memory increase too high"
**Cause:** Potential memory leak

**Solutions:**
1. Review recent code changes
2. Check for unclosed connections
3. Verify timer cleanup
4. Run with `--expose-gc` flag for better GC

### CI/CD Specific Issues

#### "Tests pass locally but fail in CI"
**Common causes:**
1. Environment variable mismatch
2. Different Node.js version
3. Database state differences
4. Timing/race conditions

**Solutions:**
1. Match CI and local Node.js versions
2. Verify all secrets configured in CI
3. Use database seeding for consistent state
4. Add retry logic for timing issues

## Debug Mode

### Enable Verbose Logging
```javascript
// Add to test script
process.env.DEBUG = '*';
```

### Check Environment
```bash
# Print all environment variables
node -e "console.log(process.env)"

# Check specific variable
echo $GROQ_API_KEY | cut -c1-10  # Show first 10 chars only
```

### Database Query Logging
```javascript
// Add to prisma client
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});
```

## Getting More Help

If issues persist:
1. Check backend server logs
2. Review database logs
3. Check Redis logs
4. Review Groq API status page
5. Create issue with full error output

---
*Last Updated: 2026-02-12*
