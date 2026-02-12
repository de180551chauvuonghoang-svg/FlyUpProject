# Hướng Dẫn Tích Hợp AI Services cho Frontend Developer

> **Phiên bản:** 1.0
> **Ngày cập nhật:** 12/02/2026
> **Dành cho:** React/TypeScript Frontend Developers

---

## Mục Lục

1. [Tổng Quan](#1-tổng-quan)
2. [Setup & Configuration](#2-setup--configuration)
3. [API 1: Quiz Thích Ứng (CAT/IRT)](#3-api-1-quiz-thích-ứng-catirt)
4. [API 2: Gợi Ý Khóa Học](#4-api-2-gợi-ý-khóa-học)
5. [API 3: Chatbot với Bộ Nhớ](#5-api-3-chatbot-với-bộ-nhớ)
6. [API 4: Chatbot Streaming (SSE)](#6-api-4-chatbot-streaming-sse)
7. [Error Handling](#7-error-handling)
8. [UI/UX Best Practices](#8-uiux-best-practices)
9. [Code Examples](#9-code-examples)

---

## 1. Tổng Quan

### 1.1. APIs Có Sẵn

| API | Endpoint | Auth | Rate Limit | Mô tả |
|-----|----------|------|------------|-------|
| **Quiz Generation** | `POST /api/ai/quiz/generate` | ✅ JWT | 10/min | Tạo quiz thích ứng |
| **Quiz Health** | `GET /api/ai/quiz/health` | ❌ | - | Kiểm tra service |
| **Recommendations** | `GET /api/recommendations/:userId` | ✅ JWT | 10/min | Gợi ý khóa học |
| **Rec Health** | `GET /api/recommendations/health` | ❌ | - | Kiểm tra service |
| **Chatbot** | `POST /api/chatbot` | ❌ | 10/min | Chat bình thường |
| **Chatbot Stream** | `POST /api/chatbot/stream` | ❌ | 5/min | Chat real-time (SSE) |

### 1.2. Base URL

```typescript
// Development
const API_BASE_URL = 'http://localhost:3000';

// Production
const API_BASE_URL = 'https://api.flyup.vn';
```

---

## 2. Setup & Configuration

### 2.1. Axios Instance Setup

```typescript
// src/services/api/axiosConfig.ts

import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000',
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Thêm JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Xử lý lỗi
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/login';
    }

    if (error.response?.status === 429) {
      // Rate limit exceeded
      console.warn('Rate limit exceeded, please wait...');
    }

    return Promise.reject(error);
  }
);

export default api;
```

### 2.2. TypeScript Interfaces

```typescript
// src/types/ai-services.ts

// ==================== QUIZ GENERATION ====================

export interface QuizScope {
  type: 'entire_course' | 'specific_sections' | 'weak_areas';
  sectionIds?: string[];
  weakAreaThreshold?: number; // 0-1, default: 0.6
  includeZeroProgress?: boolean; // default: true
}

export interface GenerateQuizRequest {
  userId: string;
  courseId: string;
  scope: QuizScope;
  questionCount?: number; // 1-50, default: 10
  options?: Record<string, any>;
}

export interface QuizQuestion {
  id: string;
  content: string;
  choices: {
    id: string;
    content: string;
  }[];
  difficulty: 'easy' | 'medium' | 'hard';
  hasIRT: boolean;
  sectionId: string;
  sectionTitle: string;
}

export interface WeakArea {
  sectionId: string;
  sectionTitle: string;
  completionRate: number; // 0-1
  totalQuestions: number;
  correctAnswers: number;
}

export interface QuizMetadata {
  userTheta: number;
  difficultyMix: {
    easy: number;
    medium: number;
    hard: number;
  };
  selectionMethod: string;
  catQuestions: number;
  difficultyBasedQuestions: number;
  scope: string;
  weakAreas?: WeakArea[];
  generatedAt: string;
}

export interface GenerateQuizResponse {
  success: boolean;
  quizId: string;
  assignmentId: string;
  metadata: QuizMetadata;
  questions: QuizQuestion[];
  totalQuestions: number;
  duration: number; // minutes
}

// ==================== RECOMMENDATIONS ====================

export interface CourseRecommendation {
  courseId: string;
  title: string;
  description: string;
  price: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  instructor: string;
  category: string;
  rating: number | null;
  ratingCount: number;
  thumbnailUrl: string;
  learnerCount: number;
  score: number; // 0-1
  reasoning: string;
}

export interface RecommendationsResponse {
  success: boolean;
  userId: string;
  recommendations: CourseRecommendation[];
  cached: boolean;
  generatedAt: string;
  message?: string;
}

// ==================== CHATBOT ====================

export interface ChatRequest {
  message: string;
  sessionId?: string; // UUID v4
}

export interface ChatResponse {
  response: string;
  sessionId: string;
}

export interface ChatStreamEvent {
  type: 'start' | 'chunk' | 'complete' | 'error';
  sessionId?: string;
  text?: string;
  index?: number;
  fullText?: string;
  error?: string;
}

// ==================== ERROR TYPES ====================

export interface ApiError {
  success: false;
  error: string;
  message: string;
  details?: any;
  suggestion?: string;
  retryAfter?: number;
}
```

---

## 3. API 1: Quiz Thích Ứng (CAT/IRT)

### 3.1. Service Class

```typescript
// src/services/api/quizService.ts

import api from './axiosConfig';
import { GenerateQuizRequest, GenerateQuizResponse } from '@/types/ai-services';

export class QuizService {
  /**
   * Tạo quiz thích ứng
   */
  static async generateAdaptiveQuiz(
    request: GenerateQuizRequest
  ): Promise<GenerateQuizResponse> {
    const response = await api.post<GenerateQuizResponse>(
      '/api/ai/quiz/generate',
      request
    );
    return response.data;
  }

  /**
   * Kiểm tra health của service
   */
  static async checkHealth(): Promise<any> {
    const response = await api.get('/api/ai/quiz/health');
    return response.data;
  }
}
```

### 3.2. React Hook

```typescript
// src/hooks/useQuizGeneration.ts

import { useState } from 'react';
import { QuizService } from '@/services/api/quizService';
import { GenerateQuizRequest, GenerateQuizResponse, ApiError } from '@/types/ai-services';

export const useQuizGeneration = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [quiz, setQuiz] = useState<GenerateQuizResponse | null>(null);

  const generateQuiz = async (request: GenerateQuizRequest) => {
    setLoading(true);
    setError(null);

    try {
      const result = await QuizService.generateAdaptiveQuiz(request);
      setQuiz(result);
      return result;
    } catch (err: any) {
      const apiError: ApiError = err.response?.data || {
        success: false,
        error: 'UNKNOWN_ERROR',
        message: 'Failed to generate quiz'
      };
      setError(apiError);
      throw apiError;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setQuiz(null);
    setError(null);
  };

  return { quiz, loading, error, generateQuiz, reset };
};
```

### 3.3. Component Example

```typescript
// src/components/QuizGenerator.tsx

import React, { useState } from 'react';
import { useQuizGeneration } from '@/hooks/useQuizGeneration';
import { QuizScope } from '@/types/ai-services';

interface QuizGeneratorProps {
  userId: string;
  courseId: string;
}

export const QuizGenerator: React.FC<QuizGeneratorProps> = ({ userId, courseId }) => {
  const { quiz, loading, error, generateQuiz } = useQuizGeneration();
  const [scopeType, setScopeType] = useState<QuizScope['type']>('entire_course');
  const [questionCount, setQuestionCount] = useState(10);

  const handleGenerate = async () => {
    try {
      await generateQuiz({
        userId,
        courseId,
        scope: { type: scopeType },
        questionCount,
      });
    } catch (err) {
      console.error('Failed to generate quiz:', err);
    }
  };

  return (
    <div className="quiz-generator">
      <h2>Tạo Quiz Thích Ứng</h2>

      {/* Scope Selection */}
      <div className="form-group">
        <label>Phạm vi:</label>
        <select value={scopeType} onChange={(e) => setScopeType(e.target.value as any)}>
          <option value="entire_course">Toàn bộ khóa học</option>
          <option value="weak_areas">Điểm yếu (cần luyện tập)</option>
          <option value="specific_sections">Chọn sections cụ thể</option>
        </select>
      </div>

      {/* Question Count */}
      <div className="form-group">
        <label>Số câu hỏi: {questionCount}</label>
        <input
          type="range"
          min="5"
          max="50"
          step="5"
          value={questionCount}
          onChange={(e) => setQuestionCount(Number(e.target.value))}
        />
      </div>

      {/* Generate Button */}
      <button onClick={handleGenerate} disabled={loading}>
        {loading ? 'Đang tạo quiz...' : 'Tạo Quiz'}
      </button>

      {/* Error Display */}
      {error && (
        <div className="error">
          <p>{error.message}</p>
          {error.suggestion && <p className="suggestion">{error.suggestion}</p>}
        </div>
      )}

      {/* Quiz Display */}
      {quiz && (
        <div className="quiz-result">
          <h3>Quiz đã tạo!</h3>
          <p>Số câu hỏi: {quiz.totalQuestions}</p>
          <p>Thời gian: {quiz.duration} phút</p>
          <p>Trình độ của bạn: {quiz.metadata.userTheta.toFixed(2)}</p>

          {/* Weak Areas */}
          {quiz.metadata.weakAreas && (
            <div className="weak-areas">
              <h4>Điểm cần cải thiện:</h4>
              {quiz.metadata.weakAreas.map((area) => (
                <div key={area.sectionId}>
                  <strong>{area.sectionTitle}</strong>
                  <span> - {(area.completionRate * 100).toFixed(0)}% hoàn thành</span>
                </div>
              ))}
            </div>
          )}

          {/* Start Quiz Button */}
          <button onClick={() => window.location.href = `/quiz/${quiz.quizId}`}>
            Bắt đầu làm bài
          </button>
        </div>
      )}
    </div>
  );
};
```

### 3.4. Request Examples

#### **Example 1: Toàn bộ khóa học**

```typescript
const request = {
  userId: '550e8400-e29b-41d4-a716-446655440000',
  courseId: '660e8400-e29b-41d4-a716-446655440001',
  scope: {
    type: 'entire_course'
  },
  questionCount: 15
};

const quiz = await QuizService.generateAdaptiveQuiz(request);
```

#### **Example 2: Điểm yếu (Weak Areas)**

```typescript
const request = {
  userId: '550e8400-e29b-41d4-a716-446655440000',
  courseId: '660e8400-e29b-41d4-a716-446655440001',
  scope: {
    type: 'weak_areas',
    weakAreaThreshold: 0.6,  // Sections với < 60% completion
    includeZeroProgress: true // Bao gồm sections chưa học
  },
  questionCount: 10
};
```

#### **Example 3: Sections cụ thể**

```typescript
const request = {
  userId: '550e8400-e29b-41d4-a716-446655440000',
  courseId: '660e8400-e29b-41d4-a716-446655440001',
  scope: {
    type: 'specific_sections',
    sectionIds: [
      '770e8400-e29b-41d4-a716-446655440002',
      '770e8400-e29b-41d4-a716-446655440003'
    ]
  },
  questionCount: 20
};
```

---

## 4. API 2: Gợi Ý Khóa Học

### 4.1. Service Class

```typescript
// src/services/api/recommendationService.ts

import api from './axiosConfig';
import { RecommendationsResponse } from '@/types/ai-services';

export class RecommendationService {
  /**
   * Lấy gợi ý khóa học
   */
  static async getRecommendations(
    userId: string,
    limit: number = 5
  ): Promise<RecommendationsResponse> {
    const response = await api.get<RecommendationsResponse>(
      `/api/recommendations/${userId}`,
      { params: { limit } }
    );
    return response.data;
  }

  /**
   * Kiểm tra health
   */
  static async checkHealth(): Promise<any> {
    const response = await api.get('/api/recommendations/health');
    return response.data;
  }
}
```

### 4.2. React Hook

```typescript
// src/hooks/useRecommendations.ts

import { useState, useEffect } from 'react';
import { RecommendationService } from '@/services/api/recommendationService';
import { RecommendationsResponse, ApiError } from '@/types/ai-services';

export const useRecommendations = (userId: string, limit: number = 5) => {
  const [recommendations, setRecommendations] = useState<RecommendationsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchRecommendations = async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await RecommendationService.getRecommendations(userId, limit);
      setRecommendations(result);
    } catch (err: any) {
      const apiError: ApiError = err.response?.data || {
        success: false,
        error: 'UNKNOWN_ERROR',
        message: 'Failed to fetch recommendations'
      };
      setError(apiError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [userId, limit]);

  return { recommendations, loading, error, refetch: fetchRecommendations };
};
```

### 4.3. Component Example

```typescript
// src/components/CourseRecommendations.tsx

import React from 'react';
import { useRecommendations } from '@/hooks/useRecommendations';

interface CourseRecommendationsProps {
  userId: string;
}

export const CourseRecommendations: React.FC<CourseRecommendationsProps> = ({ userId }) => {
  const { recommendations, loading, error } = useRecommendations(userId, 5);

  if (loading) {
    return <div className="loading">Đang tìm khóa học phù hợp...</div>;
  }

  if (error) {
    return <div className="error">Lỗi: {error.message}</div>;
  }

  if (!recommendations || recommendations.recommendations.length === 0) {
    return <div>Chưa có gợi ý khóa học.</div>;
  }

  return (
    <div className="recommendations">
      <div className="header">
        <h2>Khóa Học Gợi Ý Cho Bạn</h2>
        {recommendations.cached && (
          <span className="badge">Cached</span>
        )}
      </div>

      <div className="course-grid">
        {recommendations.recommendations.map((course) => (
          <div key={course.courseId} className="course-card">
            <img src={course.thumbnailUrl} alt={course.title} />

            <div className="course-info">
              <h3>{course.title}</h3>
              <p className="instructor">{course.instructor}</p>
              <p className="category">{course.category}</p>

              {/* Rating */}
              <div className="rating">
                {course.rating ? (
                  <>
                    <span>⭐ {course.rating.toFixed(1)}</span>
                    <span>({course.ratingCount.toLocaleString()})</span>
                  </>
                ) : (
                  <span>Khóa học mới</span>
                )}
              </div>

              {/* Price */}
              <div className="price">
                {course.price.toLocaleString('vi-VN')} đ
              </div>

              {/* AI Reasoning */}
              <div className="reasoning">
                <strong>Tại sao phù hợp:</strong>
                <p>{course.reasoning}</p>
              </div>

              {/* Confidence Score */}
              <div className="confidence">
                Độ phù hợp: {(course.score * 100).toFixed(0)}%
              </div>

              {/* CTA */}
              <button onClick={() => window.location.href = `/courses/${course.courseId}`}>
                Xem chi tiết
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

## 5. API 3: Chatbot với Bộ Nhớ

### 5.1. Service Class

```typescript
// src/services/api/chatbotService.ts

import api from './axiosConfig';
import { ChatRequest, ChatResponse } from '@/types/ai-services';

export class ChatbotService {
  /**
   * Gửi tin nhắn tới chatbot
   */
  static async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    const response = await api.post<ChatResponse>('/api/chatbot', request);
    return response.data;
  }
}
```

### 5.2. React Hook

```typescript
// src/hooks/useChatbot.ts

import { useState, useRef } from 'react';
import { ChatbotService } from '@/services/api/chatbotService';
import { v4 as uuidv4 } from 'uuid';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const useChatbot = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const sessionIdRef = useRef<string>(uuidv4()); // Persist session ID

  const sendMessage = async (content: string) => {
    // Add user message
    const userMessage: Message = {
      role: 'user',
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      // Send to API
      const response = await ChatbotService.sendMessage({
        message: content,
        sessionId: sessionIdRef.current
      });

      // Add assistant response
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chatbot error:', error);

      // Add error message
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Xin lỗi, tôi gặp lỗi. Vui lòng thử lại sau.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    sessionIdRef.current = uuidv4(); // Reset session
  };

  return { messages, loading, sendMessage, clearChat };
};
```

### 5.3. Component Example

```typescript
// src/components/Chatbot.tsx

import React, { useState, useRef, useEffect } from 'react';
import { useChatbot } from '@/hooks/useChatbot';

export const Chatbot: React.FC = () => {
  const { messages, loading, sendMessage, clearChat } = useChatbot();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    sendMessage(input);
    setInput('');
  };

  return (
    <div className="chatbot">
      <div className="chatbot-header">
        <h3>Trợ lý AI FlyUp</h3>
        <button onClick={clearChat}>Xóa lịch sử</button>
      </div>

      <div className="chatbot-messages">
        {messages.length === 0 && (
          <div className="welcome">
            Xin chào! Tôi có thể giúp bạn tìm khóa học phù hợp.
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            <div className="message-content">{msg.content}</div>
            <div className="message-time">
              {msg.timestamp.toLocaleTimeString('vi-VN')}
            </div>
          </div>
        ))}

        {loading && (
          <div className="message assistant">
            <div className="typing-indicator">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form className="chatbot-input" onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Nhập câu hỏi của bạn..."
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()}>
          Gửi
        </button>
      </form>
    </div>
  );
};
```

---

## 6. API 4: Chatbot Streaming (SSE)

### 6.1. Service Class

```typescript
// src/services/api/chatbotStreamService.ts

import { ChatRequest, ChatStreamEvent } from '@/types/ai-services';

export class ChatbotStreamService {
  /**
   * Stream messages từ chatbot (Server-Sent Events)
   */
  static async streamMessage(
    request: ChatRequest,
    onChunk: (event: ChatStreamEvent) => void,
    onComplete: (fullText: string) => void,
    onError: (error: string) => void
  ): Promise<void> {
    const baseURL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

    try {
      const response = await fetch(`${baseURL}/api/chatbot/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Stream failed');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No reader available');
      }

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6); // Remove 'data: ' prefix

            try {
              const event: ChatStreamEvent = JSON.parse(data);

              if (event.type === 'chunk') {
                onChunk(event);
              } else if (event.type === 'complete') {
                onComplete(event.fullText || '');
              } else if (event.type === 'error') {
                onError(event.error || 'Unknown error');
              }
            } catch (e) {
              console.warn('Failed to parse SSE data:', data);
            }
          }
        }
      }
    } catch (error: any) {
      onError(error.message);
    }
  }
}
```

### 6.2. React Hook

```typescript
// src/hooks/useChatbotStream.ts

import { useState, useRef } from 'react';
import { ChatbotStreamService } from '@/services/api/chatbotStreamService';
import { v4 as uuidv4 } from 'uuid';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  streaming?: boolean;
}

export const useChatbotStream = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const sessionIdRef = useRef<string>(uuidv4());
  const currentStreamRef = useRef<string>('');

  const sendMessage = async (content: string) => {
    // Add user message
    const userMessage: Message = {
      role: 'user',
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    // Add placeholder for assistant response
    const assistantMessage: Message = {
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      streaming: true
    };
    setMessages(prev => [...prev, assistantMessage]);
    setLoading(true);
    currentStreamRef.current = '';

    try {
      await ChatbotStreamService.streamMessage(
        {
          message: content,
          sessionId: sessionIdRef.current
        },
        // onChunk
        (event) => {
          if (event.text) {
            currentStreamRef.current += event.text;
            setMessages(prev => {
              const updated = [...prev];
              updated[updated.length - 1].content = currentStreamRef.current;
              return updated;
            });
          }
        },
        // onComplete
        (fullText) => {
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1].content = fullText;
            updated[updated.length - 1].streaming = false;
            return updated;
          });
          setLoading(false);
        },
        // onError
        (error) => {
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1].content = `Lỗi: ${error}`;
            updated[updated.length - 1].streaming = false;
            return updated;
          });
          setLoading(false);
        }
      );
    } catch (error) {
      console.error('Stream error:', error);
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    sessionIdRef.current = uuidv4();
  };

  return { messages, loading, sendMessage, clearChat };
};
```

### 6.3. Component Example

```typescript
// src/components/ChatbotStream.tsx

import React, { useState, useRef, useEffect } from 'react';
import { useChatbotStream } from '@/hooks/useChatbotStream';

export const ChatbotStream: React.FC = () => {
  const { messages, loading, sendMessage, clearChat } = useChatbotStream();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    sendMessage(input);
    setInput('');
  };

  return (
    <div className="chatbot-stream">
      <div className="chatbot-header">
        <h3>💬 Trợ lý AI (Real-time)</h3>
        <button onClick={clearChat}>🗑️ Xóa</button>
      </div>

      <div className="chatbot-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            <div className="message-content">
              {msg.content}
              {msg.streaming && <span className="cursor">|</span>}
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      <form className="chatbot-input" onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Nhập câu hỏi..."
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()}>
          {loading ? '⏳' : '➤'}
        </button>
      </form>
    </div>
  );
};
```

---

## 7. Error Handling

### 7.1. Error Types

```typescript
// Common error codes
const ERROR_CODES = {
  // Quiz Generation
  MISSING_REQUIRED_FIELDS: 'Thiếu thông tin bắt buộc',
  INVALID_SCOPE: 'Scope không hợp lệ',
  INSUFFICIENT_QUESTIONS: 'Không đủ câu hỏi',
  NOT_ENROLLED: 'Chưa đăng ký khóa học',
  NO_SECTIONS: 'Khóa học chưa có sections',
  QUIZ_GENERATION_FAILED: 'Tạo quiz thất bại',

  // Recommendations
  USER_NOT_FOUND: 'Không tìm thấy user',
  NO_RECOMMENDATIONS: 'Chưa có gợi ý',

  // Common
  UNAUTHORIZED: 'Chưa đăng nhập',
  FORBIDDEN: 'Không có quyền truy cập',
  RATE_LIMIT_EXCEEDED: 'Vượt quá giới hạn request',
  SERVICE_UNAVAILABLE: 'Service tạm thời không khả dụng',
};
```

### 7.2. Error Handling Component

```typescript
// src/components/ErrorDisplay.tsx

import React from 'react';
import { ApiError } from '@/types/ai-services';

interface ErrorDisplayProps {
  error: ApiError;
  onRetry?: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onRetry }) => {
  const getErrorIcon = () => {
    switch (error.error) {
      case 'RATE_LIMIT_EXCEEDED':
        return '⏱️';
      case 'SERVICE_UNAVAILABLE':
        return '🔧';
      case 'UNAUTHORIZED':
      case 'FORBIDDEN':
        return '🔒';
      default:
        return '❌';
    }
  };

  return (
    <div className={`error-display ${error.error.toLowerCase()}`}>
      <div className="error-icon">{getErrorIcon()}</div>
      <div className="error-message">{error.message}</div>

      {error.suggestion && (
        <div className="error-suggestion">
          💡 {error.suggestion}
        </div>
      )}

      {error.retryAfter && (
        <div className="retry-info">
          Vui lòng thử lại sau {error.retryAfter} giây
        </div>
      )}

      {onRetry && !error.retryAfter && (
        <button onClick={onRetry} className="retry-button">
          Thử lại
        </button>
      )}
    </div>
  );
};
```

---

## 8. UI/UX Best Practices

### 8.1. Loading States

```typescript
// Quiz Generation Loading
<div className="loading-quiz">
  <div className="spinner"></div>
  <p>Đang phân tích trình độ của bạn...</p>
  <p className="subtext">Có thể mất 2-3 giây</p>
</div>

// Recommendations Loading
<div className="loading-recommendations">
  {[1, 2, 3].map(i => (
    <div key={i} className="skeleton-card">
      <div className="skeleton-image"></div>
      <div className="skeleton-text"></div>
    </div>
  ))}
</div>

// Chatbot Streaming
<div className="message assistant streaming">
  <div className="content">{currentText}<span className="cursor">|</span></div>
</div>
```

### 8.2. Empty States

```typescript
// No recommendations
<div className="empty-state">
  <div className="icon">📚</div>
  <h3>Chưa có gợi ý khóa học</h3>
  <p>Hãy đăng ký và hoàn thành một khóa học để nhận gợi ý phù hợp!</p>
  <button onClick={() => navigate('/courses')}>
    Khám phá khóa học
  </button>
</div>

// No weak areas (good thing!)
<div className="empty-state success">
  <div className="icon">🎉</div>
  <h3>Tuyệt vời!</h3>
  <p>Bạn không có điểm yếu nào cần cải thiện</p>
</div>
```

### 8.3. Success Feedback

```typescript
// Quiz created
<div className="success-toast">
  <div className="icon">✅</div>
  <div>
    <strong>Quiz đã tạo!</strong>
    <p>{quiz.totalQuestions} câu hỏi phù hợp với trình độ của bạn</p>
  </div>
</div>

// Recommendations loaded
<div className="success-banner">
  <p>✨ Tìm thấy {recommendations.length} khóa học phù hợp với bạn</p>
</div>
```

---

## 9. Code Examples

### 9.1. Complete Quiz Flow

```typescript
// src/pages/QuizGenerationPage.tsx

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuizGeneration } from '@/hooks/useQuizGeneration';
import { QuizScope } from '@/types/ai-services';

export const QuizGenerationPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { quiz, loading, error, generateQuiz } = useQuizGeneration();

  const [scope, setScope] = useState<QuizScope>({ type: 'entire_course' });
  const [questionCount, setQuestionCount] = useState(10);

  const handleGenerate = async () => {
    if (!user || !courseId) return;

    try {
      const result = await generateQuiz({
        userId: user.id,
        courseId,
        scope,
        questionCount
      });

      // Navigate to quiz page after 2 seconds
      setTimeout(() => {
        navigate(`/quiz/${result.quizId}`);
      }, 2000);
    } catch (err) {
      // Error is handled by hook
    }
  };

  return (
    <div className="quiz-generation-page">
      <h1>Tạo Bài Kiểm Tra Thích Ứng</h1>

      {/* Configuration */}
      <div className="quiz-config">
        <div className="scope-selector">
          <h3>Phạm vi:</h3>
          <div className="options">
            <label>
              <input
                type="radio"
                checked={scope.type === 'entire_course'}
                onChange={() => setScope({ type: 'entire_course' })}
              />
              Toàn bộ khóa học
            </label>
            <label>
              <input
                type="radio"
                checked={scope.type === 'weak_areas'}
                onChange={() => setScope({ type: 'weak_areas', weakAreaThreshold: 0.6 })}
              />
              Điểm yếu (cần luyện tập)
            </label>
          </div>
        </div>

        <div className="question-count">
          <h3>Số câu hỏi: {questionCount}</h3>
          <input
            type="range"
            min="5"
            max="50"
            step="5"
            value={questionCount}
            onChange={(e) => setQuestionCount(Number(e.target.value))}
          />
        </div>

        <button
          className="generate-btn"
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? 'Đang tạo...' : 'Tạo Quiz'}
        </button>
      </div>

      {/* Error */}
      {error && <ErrorDisplay error={error} onRetry={handleGenerate} />}

      {/* Success */}
      {quiz && (
        <div className="quiz-success">
          <h2>✅ Quiz đã tạo thành công!</h2>
          <div className="stats">
            <div className="stat">
              <span className="label">Số câu:</span>
              <span className="value">{quiz.totalQuestions}</span>
            </div>
            <div className="stat">
              <span className="label">Thời gian:</span>
              <span className="value">{quiz.duration} phút</span>
            </div>
            <div className="stat">
              <span className="label">Trình độ:</span>
              <span className="value">
                {quiz.metadata.userTheta < -1 ? 'Beginner' :
                 quiz.metadata.userTheta < 0.5 ? 'Intermediate' : 'Advanced'}
              </span>
            </div>
          </div>
          <p>Đang chuyển đến trang làm bài...</p>
        </div>
      )}
    </div>
  );
};
```

### 9.2. Complete Recommendations Flow

```typescript
// src/pages/RecommendationsPage.tsx

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRecommendations } from '@/hooks/useRecommendations';
import { CourseCard } from '@/components/CourseCard';

export const RecommendationsPage: React.FC = () => {
  const { user } = useAuth();
  const { recommendations, loading, error, refetch } = useRecommendations(user?.id || '', 8);

  if (!user) {
    return <div>Vui lòng đăng nhập</div>;
  }

  return (
    <div className="recommendations-page">
      <header>
        <h1>Khóa Học Gợi Ý Cho Bạn</h1>
        <button onClick={refetch} disabled={loading}>
          🔄 Làm mới
        </button>
      </header>

      {loading && <LoadingSkeleton count={8} />}

      {error && <ErrorDisplay error={error} onRetry={refetch} />}

      {recommendations && (
        <>
          {recommendations.cached && (
            <div className="cache-notice">
              ⚡ Đã lưu trong cache - cập nhật mới nhất: {
                new Date(recommendations.generatedAt).toLocaleString('vi-VN')
              }
            </div>
          )}

          <div className="course-grid">
            {recommendations.recommendations.map((course) => (
              <CourseCard
                key={course.courseId}
                course={course}
                showReasoning={true}
                showConfidence={true}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
```

---

## 10. Testing

### 10.1. Unit Tests (Jest + React Testing Library)

```typescript
// src/hooks/__tests__/useQuizGeneration.test.ts

import { renderHook, act } from '@testing-library/react-hooks';
import { useQuizGeneration } from '../useQuizGeneration';
import { QuizService } from '@/services/api/quizService';

jest.mock('@/services/api/quizService');

describe('useQuizGeneration', () => {
  it('should generate quiz successfully', async () => {
    const mockQuiz = {
      success: true,
      quizId: 'test-quiz-id',
      questions: [],
      metadata: {},
    };

    (QuizService.generateAdaptiveQuiz as jest.Mock).mockResolvedValue(mockQuiz);

    const { result } = renderHook(() => useQuizGeneration());

    await act(async () => {
      await result.current.generateQuiz({
        userId: 'user-1',
        courseId: 'course-1',
        scope: { type: 'entire_course' },
      });
    });

    expect(result.current.quiz).toEqual(mockQuiz);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle errors', async () => {
    const mockError = {
      response: {
        data: {
          success: false,
          error: 'INSUFFICIENT_QUESTIONS',
          message: 'Not enough questions',
        },
      },
    };

    (QuizService.generateAdaptiveQuiz as jest.Mock).mockRejectedValue(mockError);

    const { result } = renderHook(() => useQuizGeneration());

    await act(async () => {
      try {
        await result.current.generateQuiz({
          userId: 'user-1',
          courseId: 'course-1',
          scope: { type: 'entire_course' },
        });
      } catch (e) {
        // Expected error
      }
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.quiz).toBeNull();
  });
});
```

---

## 11. Performance Optimization

### 11.1. Debouncing Chatbot Input

```typescript
import { debounce } from 'lodash';

const debouncedSend = debounce((message: string) => {
  sendMessage(message);
}, 500);
```

### 11.2. Memoization

```typescript
import { useMemo } from 'react';

const sortedRecommendations = useMemo(() => {
  return recommendations?.recommendations.sort((a, b) => b.score - a.score);
}, [recommendations]);
```

### 11.3. Lazy Loading

```typescript
import React, { lazy, Suspense } from 'react';

const ChatbotStream = lazy(() => import('@/components/ChatbotStream'));

<Suspense fallback={<div>Loading chatbot...</div>}>
  <ChatbotStream />
</Suspense>
```

---

## 12. FAQs

**Q: SessionId có bắt buộc không?**
A: Không. Nếu không cung cấp, server sẽ tự động tạo UUID mới. Nhưng để có bộ nhớ hội thoại, bạn nên persist sessionId.

**Q: Làm sao biết quiz đã cached?**
A: Kiểm tra response time. Cached < 500ms, uncached ~2s.

**Q: Recommendations có tự động cập nhật không?**
A: Cache 1 giờ. Invalidate khi user enroll khóa mới.

**Q: SSE có hoạt động trên mọi browser?**
A: Có, tất cả modern browsers. Fallback về polling nếu cần.

**Q: Rate limit 429 xử lý thế nào?**
A: Hiển thị `error.retryAfter` và disable button trong thời gian đó.

---

## 13. Checklist Integration

- [ ] Setup Axios với JWT interceptor
- [ ] Tạo TypeScript interfaces
- [ ] Implement Quiz Generation service + hook
- [ ] Implement Recommendations service + hook
- [ ] Implement Chatbot service + hook
- [ ] Implement SSE Streaming service + hook
- [ ] Error handling components
- [ ] Loading states
- [ ] Empty states
- [ ] Success feedback
- [ ] Unit tests
- [ ] Integration tests
- [ ] Performance optimization
- [ ] Accessibility (a11y)

---

**🎉 Chúc bạn tích hợp thành công!**

Nếu có câu hỏi, vui lòng liên hệ Backend Team.
