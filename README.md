# 📦 B2B Inventory Ordering Platform for Supermarkets
MERN Stack • JWT Auth • Role Management • Admin Approval System
This project is a Business-to-Business (B2B) inventory ordering platform designed to streamline communication between Supermarkets and Suppliers.
The system eliminates manual order collection and enables fully digital inventory ordering using a centralized platform.

## 🚀 Features
#### 🔐 Authentication & Role Management
User roles: Admin, Supplier, Supermarket

Login using JWT (JSON Web Tokens)

Secure password hashing using bcrypt

Admins cannot register through frontend → Admin accounts are created manually

Suppliers & Supermarkets must be approved by Admin before login

#### 🧑‍💼 Admin Panel
Dashboard with live statistics

Approve / Reject pending user accounts

Manage suppliers (CRUD)

Manage supermarkets (CRUD)

Orders report + charts & data visualization

System-wide analytics

#### 🛒 Supermarket Panel
Place orders to suppliers

View supplier listings

Track order status (pending, approved, completed)

#### 🚚 Supplier Panel
View received orders from supermarkets

Update order status

Manage product inventory (optional extension)

## 🛠️ Tech Stack
#### Frontend
React (CRA)

React Router DOM (Protected Routes)

Axios (API calls)

Recharts (Charts for analytics)

CSS (simple & clean UI)

#### Backend
Node.js + Express.js

MongoDB + Mongoose

JWT Authentication

bcrypt password hashing

Modular architecture (routes, controllers, middleware) 

# ⚙️ Installation & Setup

### 1️⃣ Clone the repository
```bash
git clone https://github.com/your-username/B2B-Inventory-Ordering-Platform.git
cd B2B-Inventory-Ordering-Platform
```
### 🖥️ Backend Setup
``bash
cd backend
npm install
``

### Create a .env file:
### Start backend: 
```bash
npm start
```

### 🌐 Frontend Setup
```bash
cd frontend
npm install
npm start
```

## 🔌 API Endpoints Overview
| Method | Endpoint             | Description                   |
| ------ | -------------------- | ----------------------------- |
| POST   | `/api/auth/register` | Register supplier/supermarket |
| POST   | `/api/auth/login`    | User login                    |
| GET    | `/api/auth/me`       | Get logged-in user            |



