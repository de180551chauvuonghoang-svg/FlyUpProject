# Recommendations API Integration Guide

## Endpoint

**GET** `/api/recommendations/:userId`

## Authentication

Required. Include JWT token in `Authorization` header.

```javascript
headers: {
  'Authorization': `Bearer ${accessToken}`
}
```

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `userId` | UUID | Yes | - | User ID to get recommendations for |
| `limit` | Number | No | 5 | Number of recommendations (1-10) |

## Response Format

```typescript
interface RecommendationResponse {
  success: boolean;
  userId: string;
  recommendations: CourseRecommendation[];
  cached: boolean;
  generatedAt: string; // ISO 8601 timestamp
  message?: string; // Only if no courses available
}

interface CourseRecommendation {
  courseId: string;
  title: string;
  description: string;
  price: number; // VND
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  instructor: string;
  category: string;
  rating: number | null; // 0-5, null if new course
  ratingCount: number;
  thumbnailUrl: string;
  learnerCount: number;
  score: number; // 0-1, recommendation confidence
  reasoning: string; // Why this course was recommended
}
```

## Example Request (React)

```javascript
import { useQuery } from '@tanstack/react-query';

function useRecommendations(userId, limit = 5) {
  return useQuery({
    queryKey: ['recommendations', userId, limit],
    queryFn: async () => {
      const response = await fetch(
        `${API_BASE_URL}/api/recommendations/${userId}?limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${getAccessToken()}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }

      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 30, // 30 minutes
  });
}

// Usage in component
function RecommendationsSection() {
  const { user } = useAuth();
  const { data, isLoading, error } = useRecommendations(user.id);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div className="recommendations">
      <h2>Recommended for You</h2>
      {data.recommendations.map(course => (
        <CourseCard key={course.courseId} course={course} />
      ))}
    </div>
  );
}
```

## Error Handling

| Status | Error | Meaning | Action |
|--------|-------|---------|--------|
| 400 | Bad Request | Invalid limit parameter | Use 1-10 |
| 401 | Unauthorized | Missing/invalid JWT | Re-authenticate |
| 403 | Forbidden | Accessing other user's data | Use own userId |
| 404 | Not Found | User doesn't exist | Verify userId |
| 429 | Rate Limit | Too many requests | Wait & retry |
| 503 | Service Unavailable | AI service down | Retry later |

## Best Practices

1. **Caching:** Backend caches for 1 hour. Frontend can cache for 5-30 minutes.
2. **Loading States:** AI generation takes 2-5s first time. Show loading indicator.
3. **Error Fallback:** If error, show trending courses instead.
4. **Invalidation:** Clear cache when user enrolls in new course.
5. **Rate Limiting:** Max 10 requests/minute per user.

## Cache Invalidation

Backend auto-invalidates cache when user enrolls in new course. No action needed from frontend.

## Health Check

**GET** `/api/recommendations/health` (no auth required)

Use for monitoring service availability.

```javascript
const checkHealth = async () => {
  const res = await fetch(`${API_BASE_URL}/api/recommendations/health`);
  const data = await res.json();
  return data.status === 'healthy';
};
```

## Example Responses

### Success (200 OK)

```json
{
  "success": true,
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "recommendations": [
    {
      "courseId": "660e8400-e29b-41d4-a716-446655440001",
      "title": "Advanced React Patterns",
      "description": "Master advanced React concepts...",
      "price": 499000,
      "level": "Advanced",
      "instructor": "John Doe",
      "category": "Web Development",
      "rating": 4.8,
      "ratingCount": 124,
      "thumbnailUrl": "https://...",
      "learnerCount": 1523,
      "score": 0.95,
      "reasoning": "Perfect progression from React Basics you completed"
    }
  ],
  "cached": true,
  "generatedAt": "2026-02-12T15:30:00.000Z"
}
```

### Error - Rate Limit (429)

```json
{
  "success": false,
  "error": "Too many requests. Please try again in 45 seconds.",
  "code": "RATE_LIMIT_EXCEEDED"
}
```

### Error - AI Unavailable (503)

```json
{
  "success": false,
  "error": "Service temporarily unavailable",
  "message": "AI service is currently unavailable. Please try again later.",
  "code": "AI_TIMEOUT"
}
```
