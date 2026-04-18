# Gam Express Driver

Driver-facing Android app for **Gam Express Taxi** — a taxi service operating in Banjul, The Gambia.

Built with **React Native + Expo** (TypeScript), targeting Android only, for a fleet of 5 drivers.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Expo SDK 54 + expo-router |
| Language | TypeScript |
| Backend | Supabase (Auth + Database + Realtime) |
| State | Zustand |
| Maps | react-native-maps |
| GPS | expo-location |
| Notifications | expo-notifications |
| Auth storage | expo-secure-store |

---

## Prerequisites

- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- EAS CLI (for APK builds): `npm install -g eas-cli`
- Android device or emulator
- Supabase project with the schema migration applied

---

## Running Locally

### 1. Clone and install

```bash
git clone <repo>
cd gam-express-driver
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and fill in your Supabase URL and anon key from the Supabase Dashboard → Project Settings → API.

### 3. Apply the database migration

Open the Supabase SQL Editor and paste the contents of:

```
supabase/migrations/001_driver_schema.sql
```

Run it. This creates the `drivers` table, extends `bookings`, and sets up RLS policies.

### 4. Start the development server

```bash
npm run android
```

Or with Expo Go:

```bash
npx expo start
```

Scan the QR code with the **Expo Go** app on your Android phone.

---

## Building the APK (Production)

We use **EAS Build** (Expo's cloud build service — free tier available).

### First time setup

```bash
eas login
eas build:configure
```

This creates `eas.json` in the project root.

### Build a debug APK (for testing, no Play Store needed)

```bash
eas build --platform android --profile preview
```

When complete, EAS gives you a download link for the `.apk` file. Install directly on any Android phone.

### Build a release AAB (for Google Play Store)

```bash
eas build --platform android --profile production
```

### Recommended `eas.json`

```json
{
  "cli": { "version": ">= 5.0.0" },
  "build": {
    "preview": {
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleRelease"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

---

## Adding a New Driver

Drivers authenticate with Supabase Auth using the format:

```
email = <phone_digits>@gamexpress.gm
```

For example, driver with phone `+220 772 1234` → email `2207721234@gamexpress.gm`.

### Step 1 — Create the Auth user

In **Supabase Dashboard → Authentication → Users → Add user**:

- Email: `2207721234@gamexpress.gm`
- Password: choose a secure password
- Email confirmed: ✅ (toggle on)

Note the generated UUID.

### Step 2 — Insert the driver profile

In **Supabase SQL Editor**:

```sql
INSERT INTO public.drivers (id, full_name, phone, vehicle_plate, vehicle_model)
VALUES (
  '<auth-user-uuid>',
  'Ousman Jallow',
  '+220 772 1234',
  'BJL 5678',
  'Toyota Corolla 2020'
);
```

### Step 3 — Share credentials with driver

Send the driver their phone number and password. They log in with:
- **Phone**: `+220 772 1234`
- **Password**: the one you set

---

## How the Booking Flow Works

```
Customer PWA                    Supabase                    Driver App
──────────────────────────────────────────────────────────────────────
Customer submits ride request
        │
        ├──► INSERT bookings (status='pending', driver_id=NULL)
        │                           │
        │                    Realtime broadcast
        │                           │
        │                           └──► Driver app receives INSERT
        │                                Driver sees IncomingRideModal
        │                                        │
        │                              Driver ACCEPTS (15s timer)
        │                                        │
        │                    ◄── UPDATE bookings (driver_id=<id>, status='accepted')
        │
Customer PWA listens for
bookings UPDATE on their row
        │
        └──► Customer sees "Driver accepted" / driver location

                                                Driver navigates to pickup
                                                        │
                                          UPDATE status='arrived'
                                                        │
                                          UPDATE status='en_route'
                                                        │
                                          UPDATE status='completed'
                                                        │
                              Driver collects cash / mobile money manually
```

### Status lifecycle

| Status | Meaning |
|--------|---------|
| `pending` | Booking created, no driver yet |
| `accepted` | Driver claimed the ride, heading to pickup |
| `arrived` | Driver at pickup location |
| `en_route` | Trip in progress |
| `completed` | Trip done, fare collected |
| `cancelled` | Cancelled by customer or admin |

---

## Project Structure

```
app/
├── _layout.tsx           Root layout — font loading, auth restore
├── index.tsx             Auth guard — redirect to login or home
├── (auth)/
│   ├── _layout.tsx
│   └── login.tsx         Phone + password login
└── (driver)/
    ├── _layout.tsx       Bottom tab navigator
    ├── home.tsx          Online/offline toggle + incoming rides
    ├── active-ride.tsx   Map + ride progress + customer contact
    ├── history.tsx       Completed trips + earnings summary
    └── profile.tsx       Edit profile + logout

components/
├── IncomingRideModal.tsx  Bottom sheet with 15s countdown
└── TripCard.tsx           History list item

lib/
├── supabase.ts            Supabase client + types + helpers
└── location.ts            GPS broadcast service

store/
└── driverStore.ts         Zustand global state

supabase/
└── migrations/
    └── 001_driver_schema.sql
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon (public) key |

---

## Notes for Low-End Android Devices

- Targets Android 8+ (API 26)
- No routing API calls — straight line drawn between pickup/dropoff on map
- GPS broadcast every 15 seconds (not continuous) to conserve battery/data
- `PROVIDER_DEFAULT` used for maps (works without Google Maps API key on most devices)
- All UI uses React Native's built-in `StyleSheet` — no heavy UI libraries

---

## Currency

All fares are in **Gambian Dalasi (D / GMD)**. No in-app payment processing — drivers confirm cash or mobile money manually after each trip.

## Communication

WhatsApp is the primary communication channel in The Gambia. The Active Ride screen shows a prominent **WhatsApp button** that opens a direct chat with the customer via `wa.me/<number>`.
