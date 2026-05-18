# Agri-Manage 🌾

Agri-Manage is a comprehensive Smart Agriculture and Irrigation Management system. It features a React Native (Expo) mobile application integrated with an ESP32-based hardware setup to provide real-time monitoring, intelligent AI-driven recommendations, and remote automation of farm irrigation systems.

## 🌟 Features

- **Real-Time Monitoring:** Monitor soil moisture, temperature, and other environmental conditions directly from the app.
- **Smart Irrigation Control:** Remotely control water pumps via the ESP32 hardware integration.
- **AI Recommendations:** On-device machine learning (TensorFlow.js) offers intelligent crop and watering recommendations based on real-time sensor data.
- **Weather Integration:** View local weather forecasts to optimize your irrigation schedules.
- **Analytics & Visualizations:** Interactive charts to track moisture trends and water usage over time.
- **Push Notifications:** Get alerted about critical soil conditions or automated pump events.
- **Offline Support:** Local caching and data persistence (SQLite & AsyncStorage).

## 🛠️ Technology Stack

### Mobile Application
- **Framework:** React Native / Expo (with Expo Router)
- **Language:** TypeScript
- **Styling:** NativeWind (Tailwind CSS)
- **State Management:** Zustand
- **Backend/Database:** Firebase (Realtime Database / Firestore)
- **Machine Learning:** TensorFlow.js for React Native
- **Charts:** Victory Native & React Native Chart Kit

### Hardware
- **Microcontroller:** ESP32
- **Firmware:** Written in C++ (Arduino IDE)
- **Communication:** WiFi & Firebase Realtime Database integration

## 📂 Project Structure

```
agri-manage/
├── app/                  # Expo Router screens (Tabs, Onboarding, Analytics, etc.)
├── assets/               # Images, icons, and splash screens
├── esp32_firmware/       # C++ source code for the ESP32 microcontroller
├── src/
│   ├── components/       # Reusable UI components (WeatherCard, PumpControl, etc.)
│   ├── constants/        # App constants, colors, and static data
│   ├── database/         # SQLite schema and queries
│   ├── hooks/            # Custom React hooks (useSensor, useAI, useWeather)
│   ├── ml/               # TensorFlow.js models and local LLM/rules engine logic
│   ├── services/         # Firebase, ESP32, and other external service integrations
│   ├── store/            # Zustand state stores
│   └── utils/            # Helper functions (e.g., CSV Export)
├── package.json          # Dependencies and scripts
└── ...
```

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Arduino IDE](https://www.arduino.cc/en/software) (for flashing the ESP32)

### 1. Mobile App Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/Venkey-01/Agri-Manage.git
   cd agri-manage
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   - Create a `.env` file in the root directory.
   - Add your Firebase and Weather API credentials.
4. Run the app:
   ```bash
   npx expo start
   ```

### 2. Hardware Setup (ESP32)
1. Open the `esp32_firmware/irrigation_server.ino` file in the Arduino IDE.
2. Update the Wi-Fi credentials and Firebase config URL/Secrets in the code.
3. Flash the code to your ESP32 board.
4. Connect your soil moisture sensors and water pump relays to the designated GPIO pins.

## 🤝 Contributing
Contributions, issues, and feature requests are welcome!

## 📄 License
This project is licensed under the MIT License.
