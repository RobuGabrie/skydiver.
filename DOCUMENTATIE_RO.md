# Skydiver Monitor - Documentatie in romana (stil student)

## 1. Ce este proiectul

Pe scurt, proiectul monitorizeaza un skydiver in timp real:

- Device-ul ESP32-C3 (wearable) citeste senzori (IMU, puls, SpO2, temperatura, baterie).
- Trimite datele prin BLE catre aplicatia mobila.
- Aplicatia mobila afiseaza date live, genereaza alerte si sincronizeaza in Supabase.
- Dashboard-ul web citeste din Supabase si arata instructorului situatia live + analiza AI.

Practic este un sistem complet: firmware + mobile + baza de date + web.

## 2. Arhitectura generala

Sistemul are 5 blocuri:

1. ESP firmware (folder ESP-C-)
2. Mobile app Expo (folder mobile)
3. Shared contracte de date (folder packages/shared)
4. Supabase (folder supabase/migrations)
5. Web dashboard Next.js (folder web)

Fluxul principal de date:

1. ESP citeste senzori.
2. ESP publica 2 tipuri de pachete BLE:
- FAST la ~50 Hz (orientare + IMU)
- SLOW la ~4 Hz (vitals + baterie + status)
3. Mobile decodifica pachetele, combina cu GPS de telefon si calculeaza vertical speed.
4. Mobile pune evenimentele in coada locala SQLite (siguranta offline) si incearca upload imediat in Supabase.
5. Web asculta realtime din Supabase si actualizeaza dashboard-ul.

## 3. Ce face fiecare parte

### 3.1 ESP firmware

Rol:

- Citeste senzori hardware.
- Ruleaza fuziune IMU (roll, pitch, yaw, quaternion).
- Detecteaza stare de miscare/stationar.
- Expune un server BLE cu service + caracteristici.

Protocol BLE (foarte important):

- Service UUID: 12345678-1234-1234-1234-123456789abc
- FAST char: ...9001 (IMU, orientare)
- SLOW char: ...9002 (vitals, baterie, flags)
- CMD char: ...9003 (comenzi START/STOP/RESET de la telefon)

Logica esentiala:

- FAST packet este pentru date rapide de miscare.
- SLOW packet este pentru date biomedicale/energetice.
- Bitii din flags includ si canopy motion (estimare on-device bazata pe gyro + stationary).

Comenzi primite prin BLE:

- START: porneste timer intern
- STOP: opreste timer
- RESET: reseteaza timer

### 3.2 Mobile app (Expo)

Rol:

- Face scan BLE, connect/disconnect la wearable.
- Decodeaza pachetele BLE.
- Afiseaza live pe tab-uri (Dashboard, Vitals, Connect, Settings).
- Colecteaza locatie telefon (GPS).
- Sincronizeaza datele in Supabase robust (cu queue locala + retry).

Componente logice cheie:

- BleContext:
  - Scan + connect
  - Subscribe la FAST/SLOW
  - Creeaza sesiune per conectare
  - Produce evenimente telemetry + alert
- telemetryQueue:
  - SQLite local, status pending/sending/sent/failed
- syncWorker:
  - Bootstrapping sesiune in DB
  - Upload cu upsert si retry
  - Inchide sesiunea la disconnect
- telemetryMapper:
  - Transformare event mobile -> rand DB
- usePhoneLocation:
  - GPS la ~1s

Detaliu foarte important de workflow:

- sequence din DB este app-level monotonic (nu seq-ul BLE de 8 biti care se reseteaza/face wrap).
- event_id este UUID valid (obligatoriu pentru coloanele uuid din DB).

Generare alerte in mobile:

- abnormal_pulse (HR mare)
- low_oxygen
- high_stress
- low_battery
- uncontrolled_fall (vertical speed extrem)
- excessive_rotation

Alertele au cooldown (30 secunde) ca sa nu faca spam.

### 3.3 Shared package

Rol:

- Defineste tipuri comune intre mobile si web.
- Include contractele de insert pentru telemetry_events si alert_events.

Avantaj:

- Evita mismatch intre frontend-uri si schema DB.

### 3.4 Supabase (baza de date + realtime)

Tabele principale:

- devices
- sessions
- telemetry_events
- alert_events
- skydiver_profiles
- ai_jobs

Functii/logica DB:

- upsert_device_and_session(device_id, session_id):
  - creeaza/actualizeaza device
  - creeaza sesiune
  - inchide sesiuni vechi deschise pentru acelasi device
- view current_skydivers:
  - returneaza starea live per device activ
  - calculeaza status (freefall/canopy_open/landed/standby)
  - calculeaza parachute_open din vertical speed + altitude + stationary + semnale IMU

RLS:

- Activat pe toate tabelele.
- Policy-uri permit insert/select pentru anon (proiect demo/prototip).

Realtime:

- Publicat pe telemetry_events, alert_events, sessions.
- Web-ul se actualizeaza instant prin subscriptions.

### 3.5 Web dashboard (Next.js)

Rol:

- Monitorizare instructor in timp real.
- Pagini: Dashboard, Skydivers, AI Analytics, Alerts.
- Ack pentru alerte.
- Analiza AI locala + optional Gemini API route.

Hook principal de date:

- useSkydivers
  - Initial load din current_skydivers + alert_events
  - Realtime pe sessions, telemetry_events, alert_events
  - Marcheaza automat offline dupa prag de inactivitate
  - Mentine istoric local pentru grafice

Mod de simulare:

- Sidebar are Mock Data toggle.
- Cand e ON, web combina live + date simulate pentru demo/test UX.

AI in web:

- use-ai-analysis face:
  - detectie pericole
  - flag-uri fiziologice
  - predictii
  - anomalii statistice (z-score)
  - trenduri (regresie simpla)
- /api/ai/gemini:
  - compara analiza locala cu Gemini
  - are fallback local daca lipseste API key sau apare eroare upstream

## 4. Workflow complet (end-to-end)

### Pas 1 - Pornire wearable

- ESP boot, init senzori, init BLE.
- Incepe sa notifice FAST/SLOW cand exista client conectat.

### Pas 2 - Conectare din mobile

- User intra pe tab Connect.
- Face scan dupa device-uri cu prefix skywatch sau service UUID tinta.
- La connect:
  - se creeaza sessionId
  - porneste sync worker
  - se face bootstrap in Supabase (device + session)

### Pas 3 - Streaming si detectie

- Mobile primeste FAST + SLOW.
- Le combina cu GPS telefon.
- Calculeaza vertical speed din altitudini consecutive.
- Produce evenimente telemetry si eventual alert.

### Pas 4 - Persistenta robusta

- Fiecare eveniment intra in SQLite queue.
- Se incearca upload imediat.
- Daca upload pica, ramane failed/pending si se retrimite.

### Pas 5 - Vizualizare instructor pe web

- Web ia initial state din current_skydivers.
- Apoi primeste realtime insert/update.
- Instructor vede:
  - status, vitals, altitudine, viteza verticala
  - alerte active
  - analiza AI si predictii

### Pas 6 - Disconnect

- La disconnect din mobile:
  - sync worker cere closeSession (seteaza ended_at)
  - web scoate sportivul din lista activa

## 5. Logica de business explicata simplu

### 5.1 Status jump

Status este derivat din combinatii de:

- stationary
- altitude_m
- vertical_speed_ms
- gyro/accel

Exemple:

- vertical speed foarte negativa -> freefall
- viteza moderat negativa + gyro mic + accel aproape 1g -> canopy_open
- stationary + altitudine mica -> landed

### 5.2 Parachute detection

Nu e un singur senzor. Este regula compusa:

- vertical_speed in interval canopy
- altitudine intr-un interval valid
- nu e stationary
- miscare angulara mica (gyro)
- optional accel aproape 1g

### 5.3 Alerte

Sunt 2 surse:

1. Mobile threshold-based in timp real
2. Web AI analysis (suprastrat de analiza)

Alert lifecycle:

- insert in alert_events
- apare in dashboard
- instructor poate face acknowledge

## 6. Cum rulezi proiectul (practic)

### 6.1 Web

Din folderul web:

1. npm install
2. npm run dev

Necesita variabile NEXT_PUBLIC_SUPABASE_URL si NEXT_PUBLIC_SUPABASE_ANON_KEY.

### 6.2 Mobile

Din folderul mobile:

1. npm install
2. npm run start
3. Pentru Android: npm run android

Necesita supabaseUrl + supabaseAnonKey in app.json extra.

### 6.3 Firmware ESP

Din folderul ESP-C- (PlatformIO):

1. Build/upload pentru env esp32-c3-supermini
2. Monitor serial la 115200

## 7. Scenariu de utilizare (student friendly)

Scenariul clasic la un antrenament:

1. Pornesti wearable-ul.
2. Deschizi aplicatia mobila pe Connect si faci pairing BLE.
3. Verifici in Vitals ca datele curg live.
4. In timpul sariturii, mobilul trimite date in cloud.
5. Instructorul urmareste pe web Dashboard + Alerts + Analytics.
6. Daca apare alerta critica, instructorul intervine conform procedurii.
7. La final, disconnect inchide sesiunea automat in DB.

## 8. Probleme tipice si ce inseamna

1. Pe mobil vezi date BLE, dar pe web nu apare nimic.
- Verifica credentialele Supabase din mobile.
- Verifica daca event_id este UUID valid.
- Verifica daca sesiunea a fost bootstrap-ata (upsert_device_and_session).

2. Apare doar partial statusul parachute.
- Verifica daca GPS altitudine vine constant.
- Fara vertical_speed bun, detectia canopy scade in acuratete.

3. Device conectat, dar datele vin rar.
- Verifica calitatea semnalului BLE (RSSI).
- Verifica daca FAST/SLOW notifications sunt active.

## 9. Concluzie

Proiectul este bine gandit pe pipeline complet:

- colectare edge (ESP)
- transport BLE
- buffer robust pe mobil
- persistenta cloud cu idempotenta
- dashboard realtime pentru instructor
- analiza AI pentru suport decizional

Pentru un student, ideea centrala este:

Datele brute de senzori devin decizii de siguranta printr-un lant clar de procesare, iar fiecare modul are un rol precis in acest lant.