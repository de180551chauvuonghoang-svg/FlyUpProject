# Project Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- **Groq Client Memory Leak**: Added `clearTimeout` in `finally` block to prevent timeout timer accumulation in `generateCompletion`.
- **Redis Client Memory Leak**: Applied `clearTimeout` cleanup pattern to `safeGet` and `safeSet` functions to prevent timer accumulation.

### Added
- **Chatbot Rate Limiting**: Implemented per-IP rate limits for chatbot endpoints:
  - Standard Chat: 10 requests per minute.
  - Streaming Chat: 5 requests per minute.

## [0.1.0] - 2026-02-12

### Added
- Initial project structure.
- User authentication (JWT + OAuth).
- Course management system.
- Shopping cart and checkout flow.
- AI Chatbot integration (Groq + SSE Streaming).
- Redis caching layer.
- BullMQ for background jobs.
- Comprehensive project documentation.

---
*Last Updated: 2026-02-12*
