# 🌞 DigiShakti: CME & Geomagnetic Storm Detection System

> **SIH (Smart India Hackathon) Presentation Phased Project**

DigiShakti is a comprehensive system designed to detect, analyze, and predict Coronal Mass Ejections (CMEs) and Geomagnetic Storms using real-time data from NASA/NOAA satellites. It provides a phased dashboard for visualizing space weather events and their potential impact on Earth.

![Project Status](https://img.shields.io/badge/Status-Development-orange)
![Python](https://img.shields.io/badge/Backend-FastAPI-blue)
![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-cyan)
![Docker](https://img.shields.io/badge/Docker-Ready-blue)

## 🚀 Features

The application is visualized in 5 distinct phases:

*   **Phase 1: Live CME Detection** 📡
    *   Real-time monitoring of solar activity.
    *   Halo CME classification using machine learning.
    *   Interactive dashboard with solar imagery.

*   **Phase 2: CME Prediction (Arrival & Impact)** 🎯
    *   Predicts the arrival time of CMEs.
    *   Determines the direction and potential impact radius.
    *   Visual forecast timeline.

*   **Phase 3: Live Geomagnetic Storm Monitoring** 🌪️
    *   Real-time tracking of geomagnetic indices (Kp, Dst).
    *   Current storm intensity visualization.

*   **Phase 4: Storm Prediction** 🔮
    *   Time-series regression models for forecasting storm intensity.
    *   Future timeline of geomagnetic disturbances.

*   **Phase 5: Visualizations & Media** 🎬
    *   Generated animations of CME propagation.
    *   Video and image exports for scientific analysis.

---

## 🛠️ Tech Stack

### Backend
*   **Framework**: FastAPI (Python)
*   **Data Processing**: Pandas, NumPy, SciPy
*   **Machine Learning**: Scikit-learn
*   **Data Sources**: NASA/NOAA APIs, SOHO/LASCO imagery
*   **Database**: PostgreSQL (optional/configured for localized storage)

### Frontend
*   **Framework**: React (Vite)
*   **Styling**: Tailwind CSS / Custom CSS
*   **Visualization**: Chart.js / Recharts
*   **State Management**: React Hooks

---

## ⚙️ Installation & Setup

### Prerequisites
*   Python 3.10+
*   Node.js 18+
*   Git

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/deepaksinghh12/Cme-detection-.git
cd Cme-detection-
```

### 2️⃣ Backend Setup
Navigate to the backend directory and set up the Python environment.

```bash
cd backend
python -m venv venv
# Windows
.\venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
python main.py
```
*The backend runs on `http://localhost:8000`*

### 3️⃣ Frontend Setup
Navigate to the frontend directory and install dependencies.

```bash
cd ../frontend
npm install
npm run dev
```
*The frontend runs on `http://localhost:5173`*

---

## 🐳 Docker Deployment

The project is fully containerized.

### Run with Docker Compose (Optional)
If a `docker-compose.yml` is present:
```bash
docker-compose up --build
```

### Manual Docker Build
**Backend:**
```bash
cd backend
docker build -t cme-backend .
docker run -p 8000:8000 cme-backend
```

**Frontend:**
```bash
cd frontend
docker build -t cme-frontend .
docker run -p 80:80 cme-frontend
```

---

## 🤝 Contribution
Contributions are welcome! Please fork the repository and create a pull request.

## 📄 License
MIT License
