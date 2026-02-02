#include <WiFi.h>
#include <HTTPClient.h>
#include <RTClib.h>
#include <HardwareSerial.h>
#include <time.h>
#include <Wire.h>
#include <SPI.h>
#include <SD.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// WIFI
const char* ssid = "Nama Wifi";
const char* password = "Password Wifi";

// GOOGLE WEBHOOK URL
String webhook = "https://script.google.com/macros/s/AKfycbwGwH1AjqtK4e-8KenG3521D3qmeJL7CLdkxfa22M7OPOgB_vIrsNwJi_KSP8MQzB_Z9g/exec";

// RTC & NTP
RTC_DS3231 rtc;
const char* ntpServer = "pool.ntp.org";
const char* timezone = "WITA-8"; // UTC+8

// A02YYUW UART
HardwareSerial US(2);
#define RXD2 16
#define TXD2 17

unsigned char frameBuf[4];
uint8_t frameIndex = 0;
float distance_cm = -1;               // -1 = belum ada data valid
unsigned long lastValidSensorMs = 0;  // waktu terakhir frame valid

// OLED
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);
bool oledOn = true;

// SD CARD
#define SD_CS 5
bool sdReady = false;
char fileName[32];

// LED & BUZZER
#define RED_PIN    14
#define GREEN_PIN  27
#define BLUE_PIN   26

#define BUZZER_PIN 13
#define BUZZER_FREQ_SAFE     0
#define BUZZER_FREQ_WARNING  1500
#define BUZZER_FREQ_DANGER   3000

// THRESHOLD STATUS 
float warnLevel = 30;   //default: 70; test: 30 & dist sensor to ground 80 cm
float dangerLevel = 20; //default: 30; test: 20 & dist sensor to ground 80 cm

String getStatus(float d) {
  if (d < 0) return "NO DATA";
  if (d <= dangerLevel) return "BAHAYA";
  if (d <= warnLevel) return "WASPADA";
  return "AMAN";
}

// INTERVAL ADAPTIF (ms)
// AMAN: 60s, WASPADA: 30s, BAHAYA: 15s
unsigned long logIntervalMs  = 60000;
unsigned long sendIntervalMs = 60000;
unsigned long nextLogMs  = 0;
unsigned long nextSendMs = 0;

void updateIntervalsByStatus(const String& status) {
  if (status == "BAHAYA") {
    logIntervalMs  = 15000;
    sendIntervalMs = 15000;
  } else if (status == "WASPADA") {
    logIntervalMs  = 30000;
    sendIntervalMs = 30000;
  } else {
    logIntervalMs  = 60000;
    sendIntervalMs = 60000;
  }
}

// BUTTONS
#define BTN_OLED   25 
int lastOledBtn = HIGH;
unsigned long lastOledToggleMs = 0;
const unsigned long DEBOUNCE_MS = 200;

// SCHEDULERS
const unsigned long OLED_INTERVAL_MS = 800;
const unsigned long WIFI_CHECK_MS    = 3000;
const unsigned long DATE_CHECK_MS    = 60000;
const unsigned long SENSOR_STALE_MS  = 4600;

unsigned long lastOLED = 0;
unsigned long lastWifiCheck = 0;
unsigned long lastDateCheck = 0;

int lastDay = -1;

// READ SENSOR A02YYUW
void readA02() {
  while (US.available()) {
    uint8_t b = US.read();

    if (frameIndex == 0 && b != 0xFF) continue;
    frameBuf[frameIndex++] = b;

    if (frameIndex == 4) {
      frameIndex = 0;

      uint8_t hb = frameBuf[1];
      uint8_t lb = frameBuf[2];
      uint8_t sum = frameBuf[3];

      if (((0xFF + hb + lb) & 0xFF) == sum) {
        uint16_t raw = (hb << 8) | lb;
        distance_cm = raw / 10.0;
        lastValidSensorMs = millis();
      }
    }
  }

  // jika terlalu lama tak ada data valid, tandai NO DATA
  if (lastValidSensorMs > 0 && (millis() - lastValidSensorMs) > SENSOR_STALE_MS) {
    distance_cm = -1;
  }
}

// NTP SYNC -> RTC
bool syncTime() {
  configTime(0, 0, ntpServer);
  setenv("TZ", timezone, 1);
  tzset();

  struct tm t;
  int retry = 0;
  while (!getLocalTime(&t) && retry < 30) {
    delay(200);
    retry++;
  }

  if (retry < 30) {
    rtc.adjust(DateTime(
      t.tm_year + 1900,
      t.tm_mon + 1,
      t.tm_mday,
      t.tm_hour,
      t.tm_min,
      t.tm_sec
    ));
    Serial.println("RTC updated from NTP.");
    return true;
  } else {
    Serial.println("NTP FAILED — using RTC only.");
    return false;
  }
}

// SD: FILE NAME PER DAY
void updateFileName() {
  if (!sdReady) return;

  DateTime now = rtc.now();
  sprintf(fileName, "/data_%04d-%02d-%02d.csv", now.year(), now.month(), now.day());

  if (!SD.exists(fileName)) {
    File f = SD.open(fileName, FILE_WRITE);
    if (f) {
      f.println("Tanggal,Jam,Distance,Status");
      f.close();
    }
  }
}

// SD INIT (lebih aman: set SPI pins eksplisit)
void initSD() {
  SPI.begin(18, 19, 23, SD_CS);              // SCK=18, MISO=19, MOSI=23
  sdReady = SD.begin(SD_CS, SPI, 4000000);   // 4 MHz lebih stabil untuk banyak modul

  if (!sdReady) {
    Serial.println("SD MOUNT FAILED!");
    return;
  }
  Serial.println("SD Ready.");
  updateFileName();
}

// LOG TO SD
void logToSD() {
  if (!sdReady) return;

  DateTime now = rtc.now();
  File f = SD.open(fileName, FILE_APPEND);
  if (!f) return;

  String status = getStatus(distance_cm);

  f.printf("%02d-%02d-%04d,%02d:%02d:%02d,%.2f,%s\n",
           now.day(), now.month(), now.year(),
           now.hour(), now.minute(), now.second(),
           distance_cm,
           status.c_str());

  f.close();
}

// SEND TO SHEETS
void sendToSheet() {
  if (WiFi.status() != WL_CONNECTED) return;
  if (webhook.length() == 0) return;

  DateTime now = rtc.now();

  char timestamp[32];
  sprintf(timestamp, "%02d-%02d-%04d %02d:%02d:%02d",
          now.day(), now.month(), now.year(),
          now.hour(), now.minute(), now.second());

  String status = getStatus(distance_cm);

  String json = "{";
  json += "\"timestamp\":\"" + String(timestamp) + "\",";
  json += "\"epoch\":" + String(now.unixtime()) + ",";
  json += "\"distance\":" + String(distance_cm) + ",";
  json += "\"status\":\"" + status + "\"";
  json += "}";

  HTTPClient http;
  http.begin(webhook);
  http.addHeader("Content-Type", "application/json");

  int code = http.POST(json);
  Serial.printf("POST %d\n", code);

  http.end();
}

// LED/Buzzer
void applyOutputsByStatus(const String& status) {
  if (status == "BAHAYA") {
    digitalWrite(RED_PIN, HIGH);
    digitalWrite(GREEN_PIN, LOW);
    digitalWrite(BLUE_PIN, LOW);
    ledcWriteTone(BUZZER_PIN, BUZZER_FREQ_DANGER);
  } else if (status == "WASPADA") {
    digitalWrite(RED_PIN, HIGH);
    digitalWrite(GREEN_PIN, HIGH);
    digitalWrite(BLUE_PIN, LOW);
    ledcWriteTone(BUZZER_PIN, BUZZER_FREQ_WARNING);
  } else if (status == "AMAN") {
    digitalWrite(RED_PIN, LOW);
    digitalWrite(GREEN_PIN, HIGH);
    digitalWrite(BLUE_PIN, LOW);
    ledcWriteTone(BUZZER_PIN, BUZZER_FREQ_SAFE);
  } else { // NO DATA
    digitalWrite(RED_PIN, LOW);
    digitalWrite(GREEN_PIN, LOW);
    digitalWrite(BLUE_PIN, HIGH);
    ledcWriteTone(BUZZER_PIN, 0);
  }
}

// OLED UPDATE
void updateOLED() {
  if (!oledOn) return;

  DateTime now = rtc.now();
  String status = getStatus(distance_cm);

  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);

  display.setCursor(0, 0);
  display.printf("Date: %02d-%02d-%04d", now.day(), now.month(), now.year());

  display.setCursor(0, 12);
  display.printf("Time: %02d:%02d:%02d", now.hour(), now.minute(), now.second());

  display.setCursor(0, 28);
  display.print("Status: ");
  display.print(status);

  display.setCursor(0, 44);
  if (distance_cm < 0) display.print("Dist: -- cm");
  else display.printf("Dist: %.2f cm", distance_cm);

  display.display();
}

// BUTTON HANDLING
void handleButtons() {
  int curOledBtn = digitalRead(BTN_OLED);
  if (lastOledBtn == LOW && curOledBtn == HIGH) {
    if (millis() - lastOledToggleMs > DEBOUNCE_MS) {
      lastOledToggleMs = millis();
      oledOn = !oledOn;

      if (oledOn) {
        display.ssd1306_command(SSD1306_DISPLAYON);
      } else {
        display.clearDisplay();
        display.display();
        display.ssd1306_command(SSD1306_DISPLAYOFF);
      }
    }
  }
  lastOledBtn = curOledBtn;
}

// SETUP
void setup() {
  Serial.begin(115200);
  Wire.begin(21, 22);

  // Button OLED
  pinMode(BTN_OLED, INPUT_PULLUP);

  // UART sensor
  US.begin(9600, SERIAL_8N1, RXD2, TXD2);

  // RTC
  if (!rtc.begin()) {
    Serial.println("RTC begin failed!");
  }

  // LED pins
  pinMode(RED_PIN, OUTPUT);
  pinMode(GREEN_PIN, OUTPUT);
  pinMode(BLUE_PIN, OUTPUT);

  // Buzzer LEDC (core 3.x)
  ledcAttach(BUZZER_PIN, 2000, 8);
  ledcWriteTone(BUZZER_PIN, 0);

  // OLED
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("OLED init failed!");
  } else {
    display.clearDisplay();
    display.display();
  }

  // WiFi connect
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.persistent(false);

  WiFi.begin(ssid, password);
  Serial.print("Connecting WiFi");
  int wifiTry = 0;
  while (WiFi.status() != WL_CONNECTED && wifiTry < 50) {
    delay(200);
    Serial.print(".");
    wifiTry++;
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("WiFi Connected");
    syncTime();
  } else {
    Serial.println("WiFi Failed to connect (RTC only).");
  }

  // SD
  initSD();

  // Init date tracking
  DateTime now = rtc.now();
  lastDay = now.day();
  updateFileName();

  // init adaptive scheduler due-time
  unsigned long nowMs = millis();
  nextLogMs  = nowMs + logIntervalMs;
  nextSendMs = nowMs + sendIntervalMs;
}

// LOOP
void loop() {
  handleButtons();

  // WiFi check
  if (millis() - lastWifiCheck >= WIFI_CHECK_MS) {
    lastWifiCheck = millis();
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("WiFi Lost! Reconnecting...");
      WiFi.begin(ssid, password);
    }
  }

  // baca sensor ultrasonik
  readA02();

  // hitung status & apply output LED/buzzer
  String status = getStatus(distance_cm);
  applyOutputsByStatus(status);

  // update OLED periodik
  unsigned long nowMs = millis();
  if (nowMs - lastOLED >= OLED_INTERVAL_MS) {
    updateOLED();
    lastOLED = nowMs;
  }

  // update fileName jika ganti hari
  if (nowMs - lastDateCheck >= DATE_CHECK_MS) {
    lastDateCheck = nowMs;
    DateTime now = rtc.now();
    if (now.day() != lastDay) {
      lastDay = now.day();
      updateFileName();
    }
  }

  // interval adaptif sesuai status saat ini
  updateIntervalsByStatus(status);

  // jadwalkan LOG
  if ((long)(nowMs - nextLogMs) >= 0) {
    logToSD();
    nextLogMs = nowMs + logIntervalMs;
  }

  // jadwalkan SEND
  if ((long)(nowMs - nextSendMs) >= 0) {
    sendToSheet();
    nextSendMs = nowMs + sendIntervalMs;
  }
}
