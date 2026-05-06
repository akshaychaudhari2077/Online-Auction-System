<<<<<<< HEAD
# 🛒 Online Auction System (MERN Stack)

## 📌 Overview

This is a basic **Online Auction System** built using Node.js and related technologies.
It allows users to register, login, and participate in auctions.

---

## 🚀 Features

* User Registration & Login
* JWT Authentication
* Secure Password Hashing
* Auction Listing (basic structure)
* Backend API with Node.js & Express

---

## 🛠️ Tech Stack

* Backend: Node.js, Express.js
* Database: MongoDB
* Authentication: JWT (jsonwebtoken)
* Environment Management: dotenv

---

## 📁 Project Structure

```
backend/
│── server.js
│── package.json
│── package-lock.json
│── node_modules/
│── .env
```

---

## ⚙️ Installation & Setup

### 1. Clone the repository

```
git clone <your-repo-link>
cd backend
```

### 2. Initialize project (if not already)

```
npm init -y
```

### 3. Install dependencies

```
npm install express mongoose dotenv bcryptjs jsonwebtoken cors
```

### 4. Create `.env` file

Create a `.env` file in the root directory and add:

```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/auctionDB
JWT_SECRET=your_secret_key
```

---

## ▶️ Running the Server

### Start with nodemon:

```
nodemon server.js
```

OR

### Start normally:

```
node server.js
```

---

## 🌐 Accessing on Mobile (Same WiFi)

1. Find your system IP:

```
ipconfig
```

2. Run server with:

```
app.listen(5000, '0.0.0.0')
```

3. Open on phone browser:

```
http://YOUR_IP:5000
```

---

## ⚠️ Common Errors & Fixes

### ❌ Cannot find module 'xyz'

👉 Install missing package:

```
npm install xyz
```

### ❌ Server not opening on phone

* Ensure same WiFi
* Use correct IP
* Disable firewall if needed

---

## 🔐 Notes

* Do not upload `.env` file to GitHub
* Use `.gitignore` for security

---

## 📌 Future Improvements

* Real-time bidding system
* Payment integration
* Frontend (React)
* Admin dashboard

---

## 👨‍💻 Author

Akshay Chaudhari
=======
# Online-Auction-System
A database-driven Online Auction System developed using Node.js and MongoDB. The project implements secure user authentication, auction listing management, and RESTful APIs, demonstrating backend development and database integration concepts.
>>>>>>> 5be3a47c654995d7bd6ec7bd626a559ea3458139
