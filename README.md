# 🚀 LS-Reborn Community Portal

### Full Stack GTA V FiveM RP Management Platform

> A scalable community management platform built for the LS-Reborn GTA V FiveM roleplay server, automating player onboarding, role management, and server access workflows through a secure and production-ready system.

---

## 🌐 Live Platform

🔗 https://lsreborn.in
🔗 [Alternate](https://lsreborn-project.netlify.app)

---

## 📖 Overview

LS-Reborn Community Portal is a full-stack web platform developed to streamline and automate community operations for a GTA V FiveM roleplay server.

The platform centralizes player applications, authentication, role assignment, and onboarding workflows while integrating directly with Discord for secure community management.

Designed with scalability and automation in mind, the system reduces manual administrative overhead and improves the experience for both players and server staff.

---

## ✨ Core Features

- 🧾 Automated Player Application System  
- 🔐 Discord OAuth2 Authentication  
- 🛡️ Secure RBAC (Role-Based Access Control) System  
- ⚡ Real-Time Multi-Tier Priority Queue  
- 🤖 Discord Bot Integration for Workflow Automation  
- 🌐 Fully Responsive Frontend  
- 🚀 Production Deployment on VPS Infrastructure  

---

# 🏗️ System Architecture

The platform follows a modular full-stack architecture:

### Frontend
- React.js-based responsive user interface
- Dynamic dashboards and application workflows

### Backend
- Node.js + Express.js API server
- JWT authentication and secure session management
- Queue synchronization and application processing logic

### Database
- MySQL database for persistent storage and workflow management

### External Integrations
- Discord OAuth2 API for authentication
- Python-based Discord bot for automated onboarding and role handling

### Infrastructure
- VPS-hosted production deployment
- Domain configuration and server management

---

# 🛠️ Tech Stack

## Frontend
- React.js
- CSS / TailwindCSS (remove if not used)

## Backend
- Node.js
- Express.js

## Database
- MySQL

## Authentication & APIs
- Discord OAuth2 API
- JSON Web Tokens (JWT)

## Automation
- Python
- Discord Bot Integration

## Deployment & Infrastructure
- VPS Hosting
- Linux Server Management
- PM2 / Nginx (remove if not used)

---

# 🔐 Authentication Flow

1. User logs in using Discord OAuth2
2. Backend verifies authentication
3. JWT token is generated securely
4. Role-based access permissions are assigned
5. User gains access to application workflows and community systems

---

# ⚡ Real-Time Queue System

Implemented a multi-tier priority queue system that synchronizes frontend requests with backend processing logic using MySQL and Node.js.

This enables:
- Efficient application handling
- Dynamic prioritization
- Real-time workflow tracking
- Reduced manual moderation effort

---

# 🤖 Discord Automation

Integrated a Python-based Discord bot to automate:

- Application status updates
- Role assignment
- Community onboarding
- End-to-end application-to-server workflow

This significantly improved operational efficiency for the RP server ecosystem.

---

# 📸 Screenshots

> Add high-quality screenshots here

Suggested screenshots:
- Homepage / Landing Page
- Dashboard
- Application Queue System
- Discord Authentication Flow
- Admin Panel

---

# ⚙️ Getting Started

## Prerequisites

- Node.js
- MySQL
- Discord Developer Application
- Python (for bot integration)

---

## Installation

```bash
# Clone repository
git clone https://github.com/Pranav722/lsreborn-project.git

# Navigate into project
cd lsreborn-project

# Install dependencies
npm install
