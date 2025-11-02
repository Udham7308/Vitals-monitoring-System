# IV Monitoring Backend

Backend API for the IV Monitoring System - provides real-time patient vitals, alerts, and threshold management.

## 🚀 Quick Setup

### Prerequisites
- Node.js (v16+)
- MongoDB (v4.4+)

### Installation

1. **Install dependencies:**
\`\`\`bash
npm install
\`\`\`

2. **Start MongoDB:**
\`\`\`bash
# Option 1: System service
sudo systemctl start mongod

# Option 2: Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Option 3: MongoDB Atlas (cloud)
# Update MONGODB_URI in .env with your Atlas connection string
\`\`\`

3. **Start the server:**
\`\`\`bash
npm run dev
\`\`\`

Server will start on http://localhost:5000

## 🔗 API Endpoints

### Patients
- `GET /api/patients` - Get all patients with current vitals
- `GET /api/patients/:patientId` - Get single patient
- `POST /api/patients` - Create new patient
- `PUT /api/patients/:patientId` - Update patient
- `DELETE /api/patients/:patientId` - Delete patient

### Vitals
- `GET /api/vitals/:patientId` - Get latest vitals
- `GET /api/vitals/:patientId/history` - Get vitals history
- `POST /api/vitals/:patientId` - Add new vitals

### Alerts
- `GET /api/alerts/:patientId` - Get patient alerts
- `POST /api/alerts/:patientId` - Create alert
- `PUT /api/alerts/:alertId/dismiss` - Dismiss alert

### Thresholds
- `GET /api/thresholds/global` - Get global thresholds
- `PUT /api/thresholds/global` - Update global thresholds
- `GET /api/thresholds/:patientId` - Get patient thresholds
- `PUT /api/thresholds/:patientId` - Update patient thresholds
- `DELETE /api/thresholds/:patientId` - Delete patient thresholds

## 🎭 Mock Data System

The backend automatically generates realistic sensor data:
- Updates every 3 seconds (matches frontend)
- Creates alerts based on threshold violations
- Simulates realistic vital sign variations
- IV bag levels gradually decrease over time

## 🔧 Frontend Integration

Your Next.js frontend will automatically work with this backend. The API responses match exactly what your frontend expects.

## 📊 Features

✅ **Real-time vitals generation**
✅ **Automatic alert creation**
✅ **Threshold-based monitoring**
✅ **Patient management**
✅ **Historical data tracking**
✅ **CORS enabled for frontend**
✅ **Error handling & logging**
✅ **MongoDB integration**

## 🚨 Troubleshooting

**MongoDB Connection Issues:**
\`\`\`bash
# Check if MongoDB is running
sudo systemctl status mongod

# Start MongoDB
sudo systemctl start mongod

# Check connection
mongo --eval "db.adminCommand('ismaster')"
\`\`\`

**Port 5000 in use:**
\`\`\`bash
# Kill process on port 5000
sudo lsof -ti:5000 | xargs kill -9

# Or change port in .env
PORT=5001
\`\`\`

The backend is production-ready and will work seamlessly with your existing frontend! 🎉
