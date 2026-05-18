#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include <LiquidCrystal.h>
#include "addons/TokenHelper.h"
#include "addons/RTDBHelper.h"

/**
 * AgriManage IoT Firmware
 * Hardware: ESP32 + L298N + Capacitive Moisture Sensor + LCD 16x2
 * Syncs with: AgriManage React Native App
 */

// ---------------- WIFI ----------------
#define WIFI_SSID "Venkey"
#define WIFI_PASSWORD "venkey_01"

// ---------------- FIREBASE (Verified via MCP) ----------------
#define API_KEY "AIzaSyB-rybqD4lxDk9m_GSxV0Co11IkVLZpd2M"
#define DATABASE_URL "https://agri-manage-smart-irrigation-default-rtdb.firebaseio.com/"

// ---------------- LCD ----------------
LiquidCrystal lcd(14, 12, 27, 26, 25, 33);

// ---------------- SOIL SENSOR ----------------
#define SENSOR_PIN 34

// ---------------- MOTOR DRIVER ----------------
#define IN1 18
#define IN2 19

// ---------------- FIREBASE OBJECTS ----------------
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

bool signupOK = false;

// ---------------- SETUP ----------------
void setup() {
  Serial.begin(115200);

  pinMode(IN1, OUTPUT);
  pinMode(IN2, OUTPUT);
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, LOW);

  lcd.begin(16, 2);
  lcd.print("AgriManage IoT");

  // WiFi Connectivity
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  lcd.setCursor(0, 1);
  lcd.print("Connecting...");

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  lcd.clear();
  lcd.print("WiFi Connected");
  Serial.println("WiFi Connected");

  // Firebase Configuration
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;

  Serial.println("Signing up anonymously...");
  if (Firebase.signUp(&config, &auth, "", "")) {
    Serial.println("Signup OK");
    signupOK = true;
  } else {
    Serial.printf("Signup error: %s\n", config.signer.signupError.message.c_str());
  }

  config.token_status_callback = tokenStatusCallback;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
}

// ---------------- LOOP ----------------
void loop() {
  if (Firebase.ready() && signupOK) {
    
    // -------- READ SOIL MOISTURE --------
    int raw = analogRead(SENSOR_PIN);
    // Calibration: 3500 (Dry) to 1200 (Wet)
    int moisture = map(raw, 3500, 1200, 0, 100);
    moisture = constrain(moisture, 0, 100);

    Serial.printf("Raw: %d | Moisture: %d%%\n", raw, moisture);

    // -------- SYNC WITH CLOUD SETTINGS --------
    String pumpAction = "OFF";
    int mode = 0; // 0: Auto, 1: Manual
    int threshold = 30;

    if (Firebase.RTDB.getString(&fbdo, "/irrigation/pump_command/action")) {
      pumpAction = fbdo.stringData();
    }

    if (Firebase.RTDB.getInt(&fbdo, "/irrigation/mode")) {
      mode = fbdo.intData();
    }

    if (Firebase.RTDB.getInt(&fbdo, "/irrigation/threshold")) {
      threshold = fbdo.intData();
    }

    // -------- PUMP DECISION LOGIC --------
    bool shouldPump = false;
    if (mode == 1) {
      // Manual Mode: Follow the App switch
      shouldPump = (pumpAction == "ON");
    } else {
      // Auto Mode: Follow the Threshold from App
      shouldPump = (moisture < threshold);
    }

    // -------- ACTUATOR CONTROL --------
    if (shouldPump) {
      digitalWrite(IN1, HIGH);
      digitalWrite(IN2, LOW);
    } else {
      digitalWrite(IN1, LOW);
      digitalWrite(IN2, LOW);
    }

    // -------- UPLOAD DATA TO DASHBOARD --------
    Firebase.RTDB.setInt(&fbdo, "/irrigation/sensor_data/moisture", moisture);
    Firebase.RTDB.setString(&fbdo, "/irrigation/sensor_data/status", shouldPump ? "ON" : "OFF");
    Firebase.RTDB.setBool(&fbdo, "/irrigation/online", true);

    // -------- LCD REFRESH --------
    lcd.setCursor(0, 0);
    lcd.print(mode == 1 ? "MODE: CLOUD   " : "MODE: AUTO    ");

    lcd.setCursor(0, 1);
    lcd.print("M: ");
    lcd.print(moisture);
    lcd.print("%  ");
    lcd.print(shouldPump ? " [PUMP]" : "       ");
  }

  delay(2000);
}
