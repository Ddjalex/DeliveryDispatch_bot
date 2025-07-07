# Delivery Assignment System

## Overview

This is a full-stack delivery assignment system built with modern web technologies. It's designed to automatically assign food delivery orders to the closest available drivers and notify them via Telegram. The system provides a real-time dashboard for monitoring orders, drivers, and assignments.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Components**: Radix UI primitives with shadcn/ui styling system
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Real-time Updates**: WebSocket connection for live data updates

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Development**: Vite for fast development with HMR
- **Build**: ESBuild for production bundling
- **WebSocket**: ws library for real-time communication

### Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM
- **Schema**: Strongly typed database schema with Zod validation
- **Connection**: Neon serverless database for cloud hosting
- **Migrations**: Drizzle Kit for database schema management
- **Fallback**: In-memory storage implementation for development/testing

## Key Components

### Database Schema
- **Drivers Table**: Stores driver information, location, availability status
- **Orders Table**: Stores order details, restaurant/delivery locations, status
- **Assignments Table**: Links orders to drivers with assignment metadata

### Assignment Engine
- **Algorithm**: Distance-based assignment using Euclidean distance calculation
- **Features**: Automatic driver selection, distance optimization
- **Real-time Processing**: Processes new orders immediately

### Telegram Integration
- **Bot Service**: Sends order notifications to drivers
- **Mock Mode**: Graceful fallback when Telegram token not configured
- **Message Formatting**: Rich markdown formatting for order details

### Real-time Dashboard
- **Live Statistics**: Active orders, available drivers, assignment metrics
- **Order Management**: View pending orders and track status changes
- **Driver Monitoring**: Real-time driver status and location tracking
- **Assignment History**: Recent assignments with detailed information

## Data Flow

1. **Order Creation**: New orders are created via API endpoints
2. **Assignment Processing**: Assignment engine finds closest available driver
3. **Driver Notification**: Telegram bot sends order details to assigned driver
4. **Status Updates**: Order and driver statuses are updated in real-time
5. **Dashboard Updates**: WebSocket broadcasts changes to connected clients

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection
- **drizzle-orm**: Type-safe database ORM
- **node-telegram-bot-api**: Telegram bot integration
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI component primitives

### Development Tools
- **Vite**: Development server and build tool
- **TypeScript**: Type safety and development experience
- **Tailwind CSS**: Utility-first CSS framework
- **ESLint/Prettier**: Code quality and formatting

## Deployment Strategy

### Development Environment
- **Hot Reload**: Vite development server with instant updates
- **Database**: Local PostgreSQL or Neon cloud database
- **Telegram**: Mock mode for testing without bot token

### Production Build
- **Frontend**: Static files built with Vite, served by Express
- **Backend**: Bundled with ESBuild for Node.js runtime
- **Database**: PostgreSQL with connection pooling
- **Environment**: Environment variables for configuration

### Environment Configuration
- **DATABASE_URL**: PostgreSQL connection string
- **TELEGRAM_BOT_TOKEN**: Bot token for Telegram integration
- **NODE_ENV**: Environment mode (development/production)

## Changelog

- July 07, 2025. Initial setup with complete delivery assignment system
- July 07, 2025. Connected real Telegram bot using user's BotFather token
- July 07, 2025. Successfully tested real Telegram message delivery to user @Alemesegedw (chat ID: 383870190)
- July 07, 2025. Added comprehensive driver registration system with Telegram Mini App integration
- July 07, 2025. Implemented document upload functionality for driver licenses, kebele IDs, and vehicle registration
- July 07, 2025. Created multi-step registration form with location capture and photo upload features

## User Preferences

Preferred communication style: Simple, everyday language.