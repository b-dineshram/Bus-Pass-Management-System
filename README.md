# 🚌 Bus Pass Management System

A Java-based full-stack web application designed to simplify and digitize the process of student bus-pass registration, application, and status tracking.

## 📌 Overview

The **Bus Pass Management System (BPMS)** is an academic project developed as part of the **Advanced Object-Oriented Programming** course.

The system is designed to provide a centralized platform where students can register, apply for bus passes, and track their application status, while administrators can manage bus-pass applications.

The project follows a **Java-based backend architecture** with Spring Boot, REST APIs, JDBC, and MySQL.

## ✨ Planned Features

- 👤 Student registration and profile management
- 🪪 Automatic Student ID generation
- 🚌 Bus-pass application
- 🔖 Application ID generation
- 📊 Pass application status tracking
- 🛠️ Admin-side application management
- 💳 Payment management
- 🗺️ Bus route and pass-type management
- 🔐 Role-based access for students and administrators

## 🏗️ Technology Stack

### Frontend
- React
- JSX
- CSS

### Backend
- Java
- Spring Boot
- REST APIs
- JDBC

### Database
- MySQL

### Development Tools
- IntelliJ IDEA
- Visual Studio Code
- Git & GitHub
- Maven

## 🔄 System Architecture

```text
┌─────────────────────────┐
│       React Frontend    │
│       JSX + CSS         │
└────────────┬────────────┘
             │
             │ REST API / HTTP
             ▼
┌─────────────────────────┐
│     Spring Boot         │
│       Backend           │
└────────────┬────────────┘
             │
             │ JDBC
             ▼
┌─────────────────────────┐
│        MySQL            │
│       Database          │
└─────────────────────────┘
```

## 📂 Project Structure

```text
Bus-Pass-Management-System/
│
├── Backend/
│   ├── src/
│   │   └── main/
│   │       ├── java/
│   │       │   └── BusPassManagementSystem/
│   │       │       ├── BackendApplication.java
│   │       │       ├── ApiController.java
│   │       │       └── DbTestController.java
│   │       │
│   │       └── resources/
│   │           └── application.properties
│   │
│   └── pom.xml
│
├── Frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── index.css
│   │
│   └── package.json
│
└── README.md
```

## 🗄️ Database

The application uses **MySQL** as its relational database.

The database currently includes the foundational tables required for the bus-pass management workflow, with entities such as:

- Users / Students
- Bus Routes
- Pass Types
- Pass Applications
- Payments
- Administrators

The database is designed using primary keys, foreign keys, constraints, and normalized relational structures.

## 🔌 JDBC Connectivity

The backend uses JDBC to communicate with MySQL.

The current JDBC implementation demonstrates:

```text
Spring Boot
     ↓
DataSource
     ↓
JDBC Connection
     ↓
PreparedStatement
     ↓
SQL Query
     ↓
ResultSet
     ↓
MySQL
```

A database connectivity endpoint is available through:

```text
GET /api/db-test
```

This verifies the database connection and retrieves the number of users stored in the `users` table.

## 🚀 Getting Started

### Prerequisites

Make sure the following are installed:

- Java JDK
- Maven
- MySQL
- Node.js and npm

### 1. Clone the repository

```bash
git clone <repository-url>
cd Bus-Pass-Management-System
```

### 2. Configure MySQL

Create the required database:

```sql
CREATE DATABASE bpms;
```

Update the database configuration in:

```text
Backend/src/main/resources/application.properties
```

Example:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/bpms
spring.datasource.username=root
spring.datasource.password=YOUR_PASSWORD
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
server.port=8080
```

### 3. Run the Backend

Navigate to the backend directory:

```bash
cd Backend
```

Run:

```bash
mvn spring-boot:run
```

The backend will start on:

```text
http://localhost:8080
```

### 4. Run the Frontend

Open another terminal:

```bash
cd Frontend
npm install
npm run dev
```

The frontend will then be available through the Vite development server.

## 🧪 Current Development Status

### Completed
- Spring Boot backend setup
- MySQL database configuration
- JDBC connectivity
- REST API foundation
- React frontend foundation
- Initial BPMS interface and navigation
- Database schema foundation

### In Progress
- Student registration workflow
- Bus-pass application workflow
- Application status tracking
- Backend CRUD operations
- Frontend-backend integration

### Planned
- Admin authentication and management
- Payment processing
- Bus route management
- Pass generation
- Role-based authorization
- Validation and error handling
- Improved security

## 👥 Team

**Bus Pass Management System Team**

Developed as an academic project for **Advanced Object-Oriented Programming** at **SRM Institute of Science and Technology**.

## 🎓 Academic Context

**Course:** Advanced Object-Oriented Programming  
**Project:** Bus Pass Management System  
**Institution:** SRM Institute of Science and Technology

---

> 🚧 **Project Status:** Under active development.
