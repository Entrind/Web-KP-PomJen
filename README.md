# Web-KP-PomJen

### Sistem Monitoring Ketinggian Air Berbasis ESP32 dengan Web Dashboard
Repositori ini merupakan implementasi sistem monitoring ketinggian air berbasis IoT yang terdiri dari dua komponen utama:
1. Prototype Alat (ESP32 + Sensor Ultrasonik)
2. Web Dashboard (React + Vite)

Sistem dirancang untuk melakukan:
- Pengukuran tinggi air
- Logging data ke SD Card
- Sinkronisasi waktu via NTP & RTC
- Pengiriman data ke Google Sheets melalui Webhook
- Visualisasi data melalui Web Dashboard
---

## Prototype Alat (Ringkasan)
Prototype menggunakan:
- ESP32
- Sensor Ultrasonik A02YYUW (UART)
- RTC DS3231
- SD Card Module
- WiFi untuk pengiriman data dan sinkronisasi waktu (NTP)

Fitur Utama:
- Logging interval adaptif
- Auto-reconnect WiFi
- Sinkronisasi waktu NTP
- Pengiriman data ke Google Sheets via Webhook

Detail wiring, flowchart, dan setup Google Sheets dapat dilihat di folder [Prototype_Alat](https://github.com/Entrind/Web-KP-PomJen/tree/main/Prototype_Alat)

---

## Web Dashboard
Web dashboard dibangun menggunakan:
- React
- Vite
- Chart/visualization library

Berfungsi untuk:
- Menampilkan data ketinggian air
- Menampilkan status kondisi
- Visualisasi grafik historis
---

## Cara Menjalankan Web Dashboard
1. Clone Repository

   ```
   git clone https://github.com/Entrind/Web-KP-PomJen.git
   cd Web-KP-PomJen
   ```
2. Install Dependency
   ```
   npm install
   ```
3. Jalankan Development Server
   ```
   npm run dev
   ```
4. Akses di Browser
   ```
   http://localhost:5173
   ```
---

## Integrasi Data (Google Sheets)
Prototype alat mengirim data ke Google Sheets menggunakan Google Apps Script (Webhook). <br>
Langkah setup lengkap tersedia [disini](https://github.com/Entrind/Web-KP-PomJen/blob/main/Prototype_Alat/README.md).<br>
Alur integrasi:
1. Buat Google Sheet
2. Tambahkan Apps Script
3. Deploy sebagai Web App
4. Masukkan Webhook URL ke kode ESP32
5. Data otomatis masuk ke Google Sheets jika ada WiFi
6. Web dashboard membaca data tersebut
---
