# 🚛 ITLASB – Intelligent Truck Load Assignment System

## 🧠 Overview

ITLASB is a high-performance logistics optimization system that intelligently assigns delivery workloads (“work”) to drivers and trucks using a **Backtracking-based optimization algorithm**.

The system is designed to simulate real-world logistics operations with:

* Automated decision-making
* Real-time delivery tracking
* Efficient resource utilization

---

## 🎯 Key Features

### ⚙️ Automated Assignment Engine

* Fully automated **Driver → Truck → Work** mapping
* No manual assignment
* Intelligent and continuous workflow

### 🧮 Backtracking Optimization (Core)

* Explores multiple assignment combinations
* Minimizes total cost:

```
Cost = distance(driver → truck)
     + distance(truck → source)
     + distance(source → destination)
```

* Uses pruning to eliminate inefficient paths
* Optimized using nearest-neighbor constraints

---

### 🗺️ Map-Centric Interface

* Live driver tracking
* Route visualization
* Source & destination selection via map
* Clean, modern UI

---

### ⏱️ Real-Time Simulation

* Delivery starts only after truck pickup
* Constant speed simulation (50 km/h)
* Live updates:

  * Driver location
  * Delivery progress
  * Work status

---

## 👥 User Roles

### 👑 Admin (Creator)

* Manage drivers
* Manage trucks
* View system dashboard
* Monitor assignments

### 👤 Customer

* Signup / Login
* Create work (map-based input)
* Track deliveries in real-time

---

## 🗄️ Database Design

### 📦 Logistics Database

**drivers**

* driver_id (PK)
* name
* current_lat
* current_lng
* status
* assigned_truck_id

**trucks**

* truck_id (PK)
* status

**work**

* work_id (PK)
* user_id
* source_lat
* source_lng
* destination_lat
* destination_lng
* status

**assignments**

* assignment_id (PK)
* driver_id
* truck_id
* work_id
* start_time
* end_time
* status

---

### 👤 Auth Database

**users**

* user_id (PK)
* username (unique)
* password

---

## 🔥 System Workflow

1. User creates work (source + destination via map)
2. System automatically:

   * Assigns driver + truck
   * Optimizes delivery sequence
3. Driver:

   * Moves to truck
   * Picks up truck
   * Starts delivery
4. Real-time tracking begins
5. On completion:

   * Work marked complete
   * Next assignment triggered

---

## 🧠 Assignment Logic

### Priority Rules

* Driver with truck → immediate assignment
* Driver without truck → nearest available truck
* Idle driver → moves toward nearest pending work
* No available driver → queued assignment

---

## 🚛 Dynamic Behavior

### Idle Handling

* Driver completes current work
* Becomes idle if no work exists
* Waits for next assignment

### Continuous Flow

* Work creation triggers assignment
* System maintains uninterrupted delivery pipeline

---

## ⚡ Tech Stack

### Frontend

* React.js
* Tailwind CSS
* Google Maps API / Leaflet

### Backend

* Node.js
* Express.js

### Database

* MySQL

### Real-Time

* WebSockets

---

## 📊 Dashboards

### Admin Dashboard

* Manage drivers and trucks
* View all work
* Monitor system activity

### Customer Dashboard

* Create work using map
* Track delivery progress

---

## 🧪 Simulation Details

* Speed: 50 km/h
* Tick interval: 2000 ms
* Distance-based delivery calculation

---

## 🚀 Getting Started

### 1. Clone Repository

```
git clone https://github.com/YOUR_USERNAME/ITLASB.git
cd ITLASB
```

### 2. Install Dependencies

```
npm run install:all
```

### 3. Setup Database

```
npm run setup:db
```

### 4. Run Application

```
npm run dev
```

---

## ⚠️ Constraints

* Work creation → ONLY user
* Assignment → ONLY algorithm
* Real-time → starts after truck pickup
* Backtracking → mandatory optimization logic

---

## 🧠 Future Enhancements

* AI-based predictive assignment
* Traffic-aware routing
* Multi-city scalability
* Driver performance analytics

---

## ⚔️ Reality Check

This is not a basic CRUD application.

This system demonstrates:

* Algorithmic problem solving
* Real-time system design
* Optimization techniques
* Scalable architecture thinking

---

## 👨‍💻 Author

* Sandeep Kumar
* Puranjey
Chennai, India

---

## 📜 License

MIT License
