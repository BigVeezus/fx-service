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
   git clone https://github.com/BigVeezus/fx-service.git
   cd fx-service
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
   JWT_SECRET=fx_test
   JWT_EXPIRATION=86400

   # Email
   MAIL_HOST=smtp.gmail.com
   MAIL_PORT=587
   MAIL_SECURE=false
   MAIL_USER=your_email@gmail.com
   MAIL_PASS=your_email_app_password
   MAIL_FROM_NAME=FX
   MAIL_FROM_EMAIL=your_email@gmail.com
   MAIL_FROM="Your App Name <your_gmail_address@gmail.com>"

   # FX API integration
   EXCHANGE_RATE_API_URL=https://api.exchangerate-api.com/v4/latest
   EXCHANGE_RATE_API_KEY=your_api_key
   ```

5. **Start the application**

   ```bash
   # Development mode
   npm run start:dev

   # Production mode
   npm run build
   npm run start:prod
   ```

6. **To run tests**
   npm run test
   (tests for wallet service and fx service complete)

7. **Access the API**
   The API will be available at `http://localhost:3000`, The Doc are available at `http://localhost:3000/docs`

## Key Assumptions

1. **User Authentication**

   - Users must register and authenticate before accessing trading features
   - JWT-based authentication with refresh token mechanism
   - Role-based access control (regular users, admin users)

2. **Wallet Management**

   - Users can have multiple currency wallets and have 4 wallets on creation
   - System prevents overdrafts (transactions are rejected if insufficient funds)
   - Wallet balances are updated atomically during transactions

3. **FX Trading**

   - Exchange rates are sourced from an external provider API
   - Exchange rates are cached with a configurable TTL

4. **Notifications**

   - Email notifications for significant events (account creation, large transactions)
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
│  │ Auth    │  │ User    │  │ Wallet  │  │ FX      │  │ Admin  │
│  │ Routes  │  │ Routes  │  │ Routes  │  │ Routes  │  │ Routes │
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
│  │ Auth    │  │ User    │  │ Wallet  │  │ FX      │  │ Admin  │
│  │ Service │  │ Service │  │ Service │  │ Service │  │Service │
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
┌─────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ Client │ │ Auth │ │ Auth │ │ User │ │ Wallet │ │ Notif. │
│ │ │ Controller │ │ Service │ │ Service │ │ Service │ │ Service │
└────┬────┘ └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └──────┬──────┘
│ │ │ │ │ │
│ Register Request │ │ │ │ │
│ ─────────────────> │ │ │ │ │
│ │ │ │ │ │
│ │ register(dto) │ │ │ │
│ │ ─────────────────────> │ │ │
│ │ │ │ │ │
│ │ │ findByEmail() │ │ │
│ │ │ ─────────────────────> │ │
│ │ │ │ │ │
│ │ │ <───────────────────── │ │
│ │ │ │ │ │
│ │ │ create(user, otp) │ │ │
│ │ │ ─────────────────────> │ │
│ │ │ │ │ │
│ │ │ <───────────────────── │ │
│ │ │ │ │ │
│ │ │ sendOtpEmail() │ │ │
│ │ │ ───────────────────────────────────────────────────────────────────>
│ │ │ │ │ │
│ │ <───────────────────── │ │ │
│ │ │ │ │ │
│ Registration │ │ │ │ │
│ Success │ │ │ │ │
│ <───────────────────────────────────────────────────────────────────────────────────────── │
│ │ │ │ │ │
│ Verify OTP Request │ │ │ │ │
│ ─────────────────> │ │ │ │ │
│ │ │ │ │ │
│ │ verifyOtp(dto) │ │ │ │
│ │ ─────────────────────> │ │ │
│ │ │ │ │ │
│ │ │ findByEmail() │ │ │
│ │ │ ─────────────────────> │ │
│ │ │ │ │ │
│ │ │ <───────────────────── │ │
│ │ │ │ │ │
│ │ │ update(verified) │ │ │
│ │ │ ─────────────────────> │ │
│ │ │ │ │ │
│ │ │ <───────────────────── │ │
│ │ │ │ │ │
│ │ │ createDefaultWallets() │ │
│ │ │ ─────────────────────────────────────────────> │
│ │ │ │ │ │
│ │ │ <───────────────────────────────────────────── │
│ │ │ │ │ │
│ │ <───────────────────── │ │ │
│ │ │ │ │ │
│ JWT Token │ │ │ │ │
│ <───────────────────────────────────────────────────────────────────────────────────────── │
│ │ │ │ │ │
│ Login Request │ │ │ │ │
│ ─────────────────> │ │ │ │ │
│ │ │ │ │ │
│ │ login(dto) │ │ │ │
│ │ ─────────────────────> │ │ │
│ │ │ │ │ │
│ │ │ findByEmail() │ │ │
│ │ │ ─────────────────────> │ │
│ │ │ │ │ │
│ │ │ <───────────────────── │ │
│ │ │ │ │ │
│ │ <───────────────────── │ │ │
│ │ │ │ │ │
│ JWT Token │ │ │ │ │
│ <───────────────────────────────────────────────────────────────────────────────────────── │
│ │ │ │ │ │
│ Resend OTP Request │ │ │ │ │
│ ─────────────────> │ │ │ │ │
│ │ │ │ │ │
│ │ resendOtp(email) │ │ │ │
│ │ ─────────────────────> │ │ │
│ │ │ │ │ │
│ │ │ findByEmail() │ │ │
│ │ │ ─────────────────────> │ │
│ │ │ │ │ │
│ │ │ <───────────────────── │ │
│ │ │ │ │ │
│ │ │ update(new OTP) │ │ │
│ │ │ ─────────────────────> │ │
│ │ │ │ │ │
│ │ │ <───────────────────── │ │
│ │ │ │ │ │
│ │ │ sendOtpEmail() │ │ │
│ │ │ ───────────────────────────────────────────────────────────────────>
│ │ │ │ │ │
│ │ <───────────────────── │ │ │
│ │ │ │ │ │
│ OTP Sent Success │ │ │ │ │
│ <───────────────────────────────────────────────────────────────────────────────────────── │
│ │ │ │ │ │
┌────┴────┐ ┌──────┴──────┐ ┌──────┴──────┐ ┌──────┴──────┐ ┌──────┴──────┐ ┌──────┴──────┐
│ Client │ │ Auth │ │ Auth │ │ User │ │ Wallet │ │ Notif. │
│ │ │ Controller │ │ Service │ │ Service │ │ Service │ │ Service │
└─────────┘ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
```

### FX Trading Flow

```
┌─────────┐        ┌─────────────┐        ┌─────────────┐        ┌────────────────┐        ┌─────────────┐
│  Client │        │  FX         │        │  Cache      │        │  External FX   │        │  Database   │
│         │        │  Service    │        │  Manager     │        │  API           │        │  (Exchange  │
└────┬────┘        └──────┬──────┘        └──────┬──────┘        └──────┬──────────┘        │  Rates)     │
     │                    │                      │                      │                    └────┬──────┘
     │ Convert Request    │                      │                      │                         │
     │ ─────────────────> │                      │                      │                         │
     │                    │ Check Cache          │                      │                         │
     │                    │ ─────────────────────>                      │                         │
     │                    │                      │                      │                         │
     │                    │ <────── Cache Hit ────                      │                         │
     │                    │      or Cache Miss                          │                         │
     │                    │                      │                      │                         │
     │                    │ ┌──────────────────────────────────────────>│                         │
     │                    │ │ Fetch Rates From External API             │                         │
     │                    │ │                                           │                         │
     │                    │ │ <─────────────────────────────────────────┘                         │
     │                    │ │                                           │                         │
     │                    │ └────── Store in DB (Background) ───────────────────────────────────> │
     │                    │                                           │                         │
     │                    │                                           │                         │
     │                    │          or API Failed                    │                         │
     │                    │ ───────> Get Fallback From DB ─────────────────────────────────────> │
     │                    │                                           │                         │
     │                    │ <────────────────────────────────────────────────────────────────────┘
     │                    │                                           │
     │                    │ Perform Conversion                        │
     │                    │ ────────────────────────────────────────────────────────────────────▶
     │                    │                                           │
     │                    │ Return { convertedAmount, rate }         │
     │ <──────────────────┘                                           │
     │
```

### Wallet Management Flow

```
┌─────────┐        ┌─────────────┐        ┌─────────────┐        ┌─────────────┐        ┌─────────────┐
│  Client │        │  Wallet     │        │  Wallet     │        │  Transaction│        │  Event      │
│         │        │  Controller │        │  Service    │        │  Service    │        │  Emitter    │
└────┬────┘        └──────┬──────┘        └──────┬──────┘        └──────┬──────┘        └──────┬──────┘
     │                    │                      │                      │                      │
     │ Create Default     │                      │                      │                      │
     │ Wallets            │                      │                      │                      │
     │ ─────────────────> │                      │                      │                      │
     │                    │                      │                      │                      │
     │                    │ createDefaultWallets │                      │                      │
     │                    │ ─────────────────────>                      │                      │
     │                    │                      │                      │                      │
     │                    │                      │ Create Wallets       │                      │
     │                    │                      │ For All Currencies   │                      │
     │                    │                      │ ───────────────────> │                      │
     │                    │                      │                      │                      │
     │                    │                      │ <───────────────────                       │
     │                    │ <─────────────────────                      │                      │
     │ Wallets Created    │                      │                      │                      │
     │ <─────────────────────────────────────────                      │                      │
     │                    │                      │                      │                      │
     │ Fund Wallet        │                      │                      │                      │
     │ ─────────────────> │                      │                      │                      │
     │                    │                      │                      │                      │
     │                    │ fundWallet           │                      │                      │
     │                    │ ─────────────────────>                      │                      │
     │                    │                      │                      │                      │
     │                    │                      │ Validate & Update    │                      │
     │                    │                      │ Wallet Balance       │                      │
     │                    │                      │                      │                      │
     │                    │                      │ Create Transaction   │                      │
     │                    │                      │ ───────────────────> │                      │
     │                    │                      │                      │                      │
     │                    │                      │ <───────────────────                       │
     │                    │                      │                      │                      │
     │                    │                      │ Emit wallet.funded   │                      │
     │                    │                      │ ─────────────────────────────────────────> │
     │                    │                      │                      │                      │
     │                    │ <─────────────────────                      │                      │
     │ Funding Successful │                      │                      │                      │
     │ <─────────────────────────────────────────                      │                      │
     │                    │                      │                      │                      │
     │ Convert Currency   │                      │                      │                      │
     │ ─────────────────> │                      │                      │                      │
     │                    │                      │                      │                      │
     │                    │ convertCurrency      │                      │                      │
     │                    │ ─────────────────────>                      │                      │
     │                    │                      │                      │                      │
     │                    │                      │ Check Balances &     │                      │
     │                    │                      │ Get Exchange Rate    │                      │
     │                    │                      │                      │                      │
     │                    │                      │ Update Both Wallets  │                      │
     │                    │                      │                      │                      │
     │                    │                      │ Create Transaction   │                      │
     │                    │                      │ ───────────────────> │                      │
     │                    │                      │                      │                      │
     │                    │                      │ <───────────────────                       │
     │                    │                      │                      │                      │
     │                    │                      │ Emit Conversion Event│                      │
     │                    │                      │ ─────────────────────────────────────────> │
     │                    │                      │                      │                      │
     │                    │ <─────────────────────                      │                      │
     │ Conversion Success │                      │                      │                      │
     │ <─────────────────────────────────────────                      │                      │
     │                    │                      │                      │                      │
     │ Trade Currency     │                      │                      │                      │
     │ ─────────────────> │                      │                      │                      │
     │                    │                      │                      │                      │
     │                    │ tradeCurrency        │                      │                      │
     │                    │ ─────────────────────>                      │                      │
     │                    │                      │                      │                      │
     │                    │                      │ Validate NGN Req &   │                      │
     │                    │                      │ Check Balances       │                      │
     │                    │                      │                      │                      │
     │                    │                      │ Get Exchange Rate    │                      │
     │                    │                      │                      │                      │
     │                    │                      │ Update Both Wallets  │                      │
     │                    │                      │                      │                      │
     │                    │                      │ Create Transaction   │                      │
     │                    │                      │ ───────────────────> │                      │
     │                    │                      │                      │                      │
     │                    │                      │ <───────────────────                       │
     │                    │                      │                      │                      │
     │                    │                      │ Emit Trade Event     │                      │
     │                    │                      │ ─────────────────────────────────────────> │
     │                    │                      │                      │                      │
     │                    │ <─────────────────────                      │                      │
     │ Trade Successful   │                      │                      │                      │
     │ <─────────────────────────────────────────                      │                      │
┌────┴────┐        ┌──────┴──────┐        ┌──────┴──────┐        ┌──────┴──────┐        ┌──────┴──────┐
│  Client │        │  Wallet     │        │  Wallet     │        │  Transaction│        │  Event      │
│         │        │  Controller │        │  Service    │        │  Service    │        │  Emitter    │
└─────────┘        └─────────────┘        └─────────────┘        └─────────────┘        └─────────────┘
```
