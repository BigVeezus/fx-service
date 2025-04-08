# FX Trading Service

A robust foreign exchange trading platform built with NestJS, offering currency exchange, wallet management, real-time notifications, and secure user authentication.

## Table of Contents

- [Overview](#overview)
- [Setup Instructions](#setup-instructions)
- [Key Assumptions](#key-assumptions)
- [Architectural Decision Summary](#architectural-decision-summary)
- [System Architecture](#system-architecture)
- [Flow Diagrams](#flow-diagrams)

## Overview

This FX Trading Service provides a comprehensive platform for currency exchange operations, with features including:

- User authentication and authorization
- Multi-currency wallet management
- Real-time exchange rate tracking
- Transaction history and reporting
- Notifications via email alerts

## Setup Instructions

### Prerequisites

- Node.js (v20.x or later)
- PostgreSQL (v14.x or later)
- npm or yarn

### Installation Steps

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/fx-trading-service.git
   cd fx-trading-service
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up PostgreSQL database**

   ```bash
   # Create database
   psql -U postgres
   CREATE DATABASE fx_trading;
   \q
   ```

4. **Configure environment variables**
   Create a `.env` file in the project root with the following variables:

   ```
   # Application
   NODE_ENV=development
   PORT=3000

   # Database
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=password
   DB_DATABASE=fx_trading

   # JWT
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRATION=86400

   # Email
   MAIL_HOST=smtp.gmail.com
   MAIL_PORT=587
   MAIL_USER=your-email@gmail.com
   MAIL_PASSWORD=your-app-password
   MAIL_FROM=your-email@gmail.com

   # FX API integration
   FX_API_KEY=your_fx_api_key
   FX_API_URL=https://api.fxprovider.com
   ```

5. **Start the application**

   ```bash
   # Development mode
   npm run start:dev

   # Production mode
   npm run build
   npm run start:prod
   ```

6. **Access the API**
   The API will be available at `http://localhost:3000`

## Key Assumptions

1. **User Authentication**

   - Users must register and authenticate before accessing trading features
   - JWT-based authentication with refresh token mechanism
   - Role-based access control (regular users, admin users)

2. **Wallet Management**

   - Users can have multiple currency wallets
   - System prevents overdrafts (transactions are rejected if insufficient funds)
   - Wallet balances are updated atomically during transactions

3. **FX Trading**

   - Exchange rates are sourced from an external provider API
   - Exchange rates are cached with a configurable TTL
   - Transactions include a spread/fee component configurable by admin

4. **Notifications**

   - Email notifications for significant events (account creation, large transactions)
   - In-app notifications for all transaction activities
   - Event-driven architecture for notification delivery

5. **Data Persistence**
   - PostgreSQL is used for structured data storage
   - Transactions use proper isolation levels to ensure data consistency
   - Regular database backups are recommended

## Architectural Decision Summary

1. **Framework: NestJS**

   - Chosen for its modular architecture and TypeScript support
   - Dependency injection for better testability and maintenance
   - Strong ecosystem of modules for common functionalities

2. **Database: PostgreSQL with TypeORM**

   - Relational database for transactional integrity
   - TypeORM for type-safe database interactions
   - Migrations for database version control

3. **Modular Architecture**

   - Separate modules for distinct functional areas (auth, user, wallet, etc.)
   - Clear separation of concerns between controllers, services, and repositories
   - Common utilities shared across modules

4. **API Rate Limiting**

   - Implemented via NestJS Throttler to prevent abuse
   - Configurable limits based on API endpoints

5. **Authentication & Security**

   - JWT-based authentication for stateless API security
   - Password hashing for secure credential storage
   - CORS configuration for frontend integration

6. **Email Notifications**

   - Handlebars templating for consistent email formatting
   - Asynchronous email delivery via event emitters

7. **Event-Driven Communication**
   - Event emitter for loose coupling between services
   - Facilitates real-time updates and notifications

## System Architecture

The system follows a modular, layered architecture:

```
┌───────────────────────────────────────────────────────────────┐
│                                                               │
│                         Client Applications                   │
│                                                               │
└───────────────────────────────────────────────────────────────┘
                              ▲
                              │
                              ▼
┌───────────────────────────────────────────────────────────────┐
│                         API Gateway                           │
│                                                               │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────┐  │
│  │ Auth    │  │ User    │  │ Wallet  │  │ FX      │  │ ...  │  │
│  │ Routes  │  │ Routes  │  │ Routes  │  │ Routes  │  │     │  │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────┘  │
│                                                               │
└───────────────────────────────────────────────────────────────┘
                              ▲
                              │
                              ▼
┌───────────────────────────────────────────────────────────────┐
│                                                               │
│                        Business Logic Layer                   │
│                                                               │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────┐  │
│  │ Auth    │  │ User    │  │ Wallet  │  │ FX      │  │     │  │
│  │ Service │  │ Service │  │ Service │  │ Service │  │ ... │  │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────┘  │
│                                                               │
└───────────────────────────────────────────────────────────────┘
                              ▲
                              │
                              ▼
┌───────────────────────────────────────────────────────────────┐
│                                                               │
│                         Data Access Layer                     │
│                                                               │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────┐  │
│  │ Auth    │  │ User    │  │ Wallet  │  │ FX      │  │     │  │
│  │ Repo    │  │ Repo    │  │ Repo    │  │ Repo    │  │ ... │  │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────┘  │
│                                                               │
└───────────────────────────────────────────────────────────────┘
                              ▲
                              │
                              ▼
┌───────────────────────────────────────────────────────────────┐
│                                                               │
│                        PostgreSQL Database                    │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

## Flow Diagrams

### User Authentication Flow

```
┌─────────┐        ┌─────────────┐        ┌─────────────┐        ┌─────────────┐
│  Client │        │  Auth       │        │  User       │        │  Email      │
│         │        │  Controller │        │  Service    │        │  Service    │
└────┬────┘        └──────┬──────┘        └──────┬──────┘        └──────┬──────┘
     │                    │                      │                      │
     │ Register Request   │                      │                      │
     │ ─────────────────> │                      │                      │
     │                    │                      │                      │
     │                    │ Create User          │                      │
     │                    │ ─────────────────────>                      │
     │                    │                      │                      │
     │                    │                      │ Store User Data      │
     │                    │                      │ ─────────────────────>
     │                    │                      │                      │
     │                    │                      │ <─────────────────────
     │                    │                      │                      │
     │                    │ <─────────────────────                      │
     │                    │                      │                      │
     │                    │ Send Welcome Email   │                      │
     │                    │ ─────────────────────────────────────────────>
     │                    │                      │                      │
     │ Response with      │                      │                      │
     │ JWT Token          │                      │                      │
     │ <─────────────────────────────────────────────────────────────────
     │                    │                      │                      │
     │ Login Request      │                      │                      │
     │ ─────────────────> │                      │                      │
     │                    │                      │                      │
     │                    │ Validate Credentials │                      │
     │                    │ ─────────────────────>                      │
     │                    │                      │                      │
     │                    │ <─────────────────────                      │
     │                    │                      │                      │
     │ JWT Token          │                      │                      │
     │ <─────────────────────────────────────────────────────────────────
     │                    │                      │                      │
┌────┴────┐        ┌──────┴──────┐        ┌──────┴──────┐        ┌──────┴──────┐
│  Client │        │  Auth       │        │  User       │        │  Email      │
│         │        │  Controller │        │  Service    │        │  Service    │
└─────────┘        └─────────────┘        └─────────────┘        └─────────────┘
```

### FX Trading Flow

```
┌─────────┐        ┌─────────────┐        ┌─────────────┐        ┌─────────────┐        ┌─────────────┐
│  Client │        │  FX         │        │  Wallet     │        │  External   │        │  Notif.     │
│         │        │  Controller │        │  Service    │        │  FX API     │        │  Service    │
└────┬────┘        └──────┬──────┘        └──────┬──────┘        └──────┬──────┘        └──────┬──────┘
     │                    │                      │                      │                      │
     │ Exchange Request   │                      │                      │                      │
     │ ─────────────────> │                      │                      │                      │
     │                    │                      │                      │                      │
     │                    │ Get Exchange Rate    │                      │                      │
     │                    │ ───────────────────────────────────────────> │                      │
     │                    │                      │                      │                      │
     │                    │ <───────────────────────────────────────────                      │
     │                    │                      │                      │                      │
     │                    │ Check Source Wallet  │                      │                      │
     │                    │ ─────────────────────>                      │                      │
     │                    │                      │                      │                      │
     │                    │ <─────────────────────                      │                      │
     │                    │                      │                      │                      │
     │                    │ Debit Source Wallet  │                      │                      │
     │                    │ ─────────────────────>                      │                      │
     │                    │                      │                      │                      │
     │                    │ <─────────────────────                      │                      │
     │                    │                      │                      │                      │
     │                    │ Credit Target Wallet │                      │                      │
     │                    │ ─────────────────────>                      │                      │
     │                    │                      │                      │                      │
     │                    │ <─────────────────────                      │                      │
     │                    │                      │                      │                      │
     │                    │ Record Transaction   │                      │                      │
     │                    │ ─────────────────────>                      │                      │
     │                    │                      │                      │                      │
     │                    │ <─────────────────────                      │                      │
     │                    │                      │                      │                      │
     │                    │ Send Notification    │                      │                      │
     │                    │ ───────────────────────────────────────────────────────────────────>
     │                    │                      │                      │                      │
     │ Exchange Response  │                      │                      │                      │
     │ <─────────────────────────────────────────────────────────────────                      │
     │                    │                      │                      │                      │
┌────┴────┐        ┌──────┴──────┐        ┌──────┴──────┐        ┌──────┴──────┐        ┌──────┴──────┐
│  Client │        │  FX         │        │  Wallet     │        │  External   │        │  Notif.     │
│         │        │  Controller │        │  Service    │        │  FX API     │        │  Service    │
└─────────┘        └─────────────┘        └─────────────┘        └─────────────┘        └─────────────┘
```

### Wallet Management Flow

```
┌─────────┐        ┌─────────────┐        ┌─────────────┐        ┌─────────────┐
│  Client │        │  Wallet     │        │  Transaction│        │  Notif.     │
│         │        │  Controller │        │  Service    │        │  Service    │
└────┬────┘        └──────┬──────┘        └──────┬──────┘        └──────┬──────┘
     │                    │                      │                      │
     │ Create Wallet      │                      │                      │
     │ ─────────────────> │                      │                      │
     │                    │                      │                      │
     │                    │ Create Wallet        │                      │
     │                    │ ─────────────────────>                      │
     │                    │                      │                      │
     │                    │ <─────────────────────                      │
     │                    │                      │                      │
     │ Wallet Created     │                      │                      │
     │ <─────────────────────────────────────────                      │
     │                    │                      │                      │
     │ Deposit Request    │                      │                      │
     │ ─────────────────> │                      │                      │
     │                    │                      │                      │
     │                    │ Process Deposit      │                      │
     │                    │ ─────────────────────>                      │
     │                    │                      │                      │
     │                    │ Record Transaction   │                      │
     │                    │ ─────────────────────>                      │
     │                    │                      │                      │
     │                    │ <─────────────────────                      │
     │                    │                      │                      │
     │                    │ Send Notification    │                      │
     │                    │ ───────────────────────────────────────────> │
     │                    │                      │                      │
     │ Deposit Confirmed  │                      │                      │
     │ <─────────────────────────────────────────────────────────────────
     │                    │                      │                      │
     │ Withdrawal Request │                      │                      │
     │ ─────────────────> │                      │                      │
     │                    │                      │                      │
     │                    │ Check Balance        │                      │
     │                    │ ─────────────────────>                      │
     │                    │                      │                      │
     │                    │ Process Withdrawal   │                      │
     │                    │ ─────────────────────>                      │
     │                    │                      │                      │
     │                    │ Record Transaction   │                      │
     │                    │ ─────────────────────>                      │
     │                    │                      │                      │
     │                    │ <─────────────────────                      │
     │                    │                      │                      │
     │                    │ Send Notification    │                      │
     │                    │ ───────────────────────────────────────────> │
     │                    │                      │                      │
     │ Withdrawal Confirmed                      │                      │
     │ <─────────────────────────────────────────────────────────────────
     │                    │                      │                      │
┌────┴────┐        ┌──────┴──────┐        ┌──────┴──────┐        ┌──────┴──────┐
│  Client │        │  Wallet     │        │  Transaction│        │  Notif.     │
│         │        │  Controller │        │  Service    │        │  Service    │
└─────────┘        └─────────────┘        └─────────────┘        └─────────────┘
```
