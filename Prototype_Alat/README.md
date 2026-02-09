# Prototype Alat – Sistem Monitoring Ketinggian Air

Folder ini berisi file dan kode pendukung prototype alat pada sistem monitoring ketinggian air berbasis ESP32, yang digunakan sebagai referensi implementasi perangkat keras dan integrasi data logging.

## Quick Links

- Flowchart Sistem: [Flowchart Sistem](https://github.com/Entrind/Web-KP-PomJen/blob/main/Prototype_Alat/Flowchart_Alat.jpg)
- Wiring Diagram (Cirkit): [Ultrasonic Datalogger](https://app.cirkitdesigner.com/project/9e880aa9-8c99-4e46-a463-4da4de67c0db)
- Wiring Table: [Wiring Table](https://github.com/Entrind/Web-KP-PomJen/blob/main/Prototype_Alat/Wiring%20Table.pdf)
- Kode ESP32: [Kode_Prototype.ino](https://github.com/Entrind/Web-KP-PomJen/blob/main/Prototype_Alat/Kode_Prototype/Kode_Prototype.ino)
- Google Sheet Testing: https://docs.google.com/spreadsheets/d/1D9hhtOm1HAewYi0s_PXx1Q2AczKHHkBOS4gy7xt5PVE/edit
- Google Apps Script: [Apps_Script](https://github.com/Entrind/Web-KP-PomJen/blob/main/Prototype_Alat/Apps_Script)
- Panduan Google Sheets: https://randomnerdtutorials.com/esp32-datalogging-google-sheets/


## Flowchart Sistem

Flowchart berikut menggambarkan alur kerja utama prototype alat, mulai dari inisialisasi sistem, pembacaan sensor, penentuan status, hingga pencatatan dan pengiriman data.

[Flowchart Sistem](https://github.com/Entrind/Web-KP-PomJen/blob/main/Prototype_Alat/Flowchart_Alat.jpg)

## Wiring Diagram & Table

### Wiring Diagram
- Link Wiring Diagram di Cirkit Designer: [Ultrasonic Datalogger](https://app.cirkitdesigner.com/project/9e880aa9-8c99-4e46-a463-4da4de67c0db)
- File Gambar Wiring: [Wiring_Diagram.png](https://github.com/Entrind/Web-KP-PomJen/blob/main/Prototype_Alat/Ultrasonic%20Datalogger%20Wiring%20Diagram.png)
- File Cirkit Designer: [Wiring_Diagram.ckt](https://github.com/Entrind/Web-KP-PomJen/blob/main/Prototype_Alat/Ultrasonic%20Datalogger%20Wiring%20Diagram.ckt)

Cara Membuka File .ckt di Cirkit
1. Buka https://app.cirkitdesigner.com/
2. Klik Start From Scratch
3. Klik File > Import > Import Local Cirkit File > Add To Existing File
4. Upload File [Wiring_Diagram.ckt](https://github.com/Entrind/Web-KP-PomJen/blob/main/Prototype_Alat/Ultrasonic%20Datalogger%20Wiring%20Diagram.ckt)

### Wiring Table
Tabel pemetaan pin dan koneksi antar komponen tersedia pada: [Wiring Table](https://github.com/Entrind/Web-KP-PomJen/blob/main/Prototype_Alat/Wiring%20Table.pdf)

## Kode ESP32

Kode program prototype alat terdapat pada: [Kode_Prototype.ino](https://github.com/Entrind/Web-KP-PomJen/blob/main/Prototype_Alat/Kode_Prototype/Kode_Prototype.ino)

Kode ini mencakup:
- Pembacaan sensor ultrasonik A02YYUW (UART)
- Sinkronisasi waktu NTP ke RTC DS3231
- Logging data ke SD Card
- Pengiriman data ke Google Sheets melalui Webhook
- Interval logging dan pengiriman data adaptif
- Manajemen koneksi WiFi otomatis

## Google Sheets & Webhook
Google Sheet (Sementara / Testing) : https://docs.google.com/spreadsheets/d/1D9hhtOm1HAewYi0s_PXx1Q2AczKHHkBOS4gy7xt5PVE/edit
> Digunakan untuk pengujian pengiriman dan pencatatan data

### Panduan Setup Google Sheets
Referensi panduan pembuatan Google Sheets untuk data logging dengan ESP32: https://randomnerdtutorials.com/esp32-datalogging-google-sheets/

### Cara Menggunakan Kode Google Apps Script
1. Buka Google Sheets
2. Pilih Extensions → Apps Script
3. Hapus kode default
4. Salin kode dari file [Apps_Script](https://github.com/Entrind/Web-KP-PomJen/blob/main/Prototype_Alat/Apps_Script)
5. Masukkan **ID Google Sheet** yang digunakan ke dalam kode Apps Script.
   - ID Google Sheet dapat ditemukan pada URL Google Sheet
   - ID terletak di antara `/d/` dan `/edit`
   Contoh menggunakan URL Google Sheet Testing:
    ```
    URL Google Sheet: https://docs.google.com/spreadsheets/d/1D9hhtOm1HAewYi0s_PXx1Q2AczKHHkBOS4gy7xt5PVE/edit?gid=0#gid=0
    ID Google Sheet: 1D9hhtOm1HAewYi0s_PXx1Q2AczKHHkBOS4gy7xt5PVE
    ```
6. Simpan project
7. Pilih Deploy → New Deployment
8. Pilih tipe Web App
9. Atur:
    - Execute as: Me
    - Who has access: Anyone
10. Salin Web App URL
12. Masukkan URL tersebut ke variabel webhook pada [Kode_Prototype.ino](https://github.com/Entrind/Web-KP-PomJen/blob/main/Prototype_Alat/Kode_Prototype/Kode_Prototype.ino)

