# Financial Analysis Tool

## Overview

This is a full-stack financial analysis application built with React, TypeScript, and Express. The application provides financial modeling capabilities, focusing on investment analysis with NPV (Net Present Value) and IRR (Internal Rate of Return) calculations. It features a modern UI built with shadcn/ui components and Tailwind CSS, with PostgreSQL database integration using Drizzle ORM.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript in SPA (Single Page Application) mode
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and CSS variables
- **State Management**: TanStack Query (React Query) for server state management
- **Forms**: React Hook Form with Zod validation via @hookform/resolvers
- **Build Tool**: Vite with hot module replacement and development tooling

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with `/api` prefix routing
- **Middleware**: Custom logging middleware for request/response tracking
- **Error Handling**: Centralized error handling with status code management
- **Development**: Custom Vite integration for SSR-like development experience

### Data Storage Solutions
- **Database**: PostgreSQL with connection via Neon serverless driver
- **ORM**: Drizzle ORM for type-safe database operations and migrations
- **Schema**: Shared TypeScript schema definitions between client and server
- **Validation**: Zod schemas for runtime type validation and data parsing
- **Migrations**: Drizzle Kit for database schema migrations

### Database Schema Design
- **Users Table**: Basic user management with username/password authentication
- **Financial Analysis Table**: Stores investment calculations including cost, revenue, contract periods, NPV, and IRR results
- **Shared Types**: TypeScript interfaces generated from Drizzle schema for type safety

### Authentication and Authorization
- **Session Management**: PostgreSQL-backed sessions using connect-pg-simple
- **Storage Interface**: Abstracted storage layer with in-memory implementation for development
- **User Management**: CRUD operations for user creation and retrieval by ID/username

### Development and Build Process
- **Development Server**: Concurrent client/server development with Vite middleware
- **Build Process**: Separate client (Vite) and server (esbuild) build pipelines
- **Type Checking**: Shared TypeScript configuration across client, server, and shared modules
- **Code Organization**: Monorepo structure with clear separation of concerns

### Financial Calculation Engine
- **Core Calculations**: NPV and IRR computation with configurable parameters (WACC, tax rates, depreciation)
- **Projection Models**: Multi-year financial projections with revenue, OPEX, and cash flow analysis
- **Business Logic**: Investment viability assessment with profit/loss and cash flow tables
- **Formatting**: Indonesian Rupiah currency formatting and percentage display utilities

## External Dependencies

### Database and ORM
- **@neondatabase/serverless**: Serverless PostgreSQL driver for Neon database
- **drizzle-orm**: Type-safe ORM with PostgreSQL dialect support
- **drizzle-kit**: Database migration and schema management tools

### UI and Styling
- **@radix-ui/***: Comprehensive set of unstyled, accessible UI primitives
- **tailwindcss**: Utility-first CSS framework with custom configuration
- **class-variance-authority**: Component variant management for consistent styling
- **clsx**: Conditional className utility for dynamic styling

### State Management and API
- **@tanstack/react-query**: Powerful data synchronization for server state
- **react-hook-form**: Performant forms with minimal re-renders
- **@hookform/resolvers**: Form validation resolvers for various schema libraries

### Development Tools
- **@replit/vite-plugin-runtime-error-modal**: Development error overlay
- **@replit/vite-plugin-cartographer**: Replit-specific development tooling
- **tsx**: TypeScript execution for development server

### Utilities and Helpers
- **date-fns**: Modern JavaScript date utility library
- **nanoid**: URL-safe unique string ID generator
- **cmdk**: Command palette component for enhanced UX
- **embla-carousel-react**: Touch-friendly carousel component