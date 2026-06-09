# Hero Studio

Hero Studio is a full-stack poster generation application for composing Hero vehicle creatives from static brand assets, platform-specific backgrounds, offers, dealer text, and localized copy.

## Architecture

- Frontend: React, Vite, Tailwind-style utility classes, and Bun for package management.
- Backend: FastAPI, Pillow for image compositing, rembg for vehicle cutouts, and Google Cloud Translation for localized offer text.
- Static assets: Served by FastAPI from `assets/`.
- Generated output: Saved by FastAPI into `outputs/` and served from `/outputs`.

## Environment Setup (Backend)

Run these commands from the project root.

### macOS / Linux

```bash
python -m venv venv
source venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### Windows PowerShell

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### Windows Command Prompt

```bat
python -m venv venv
venv\Scripts\activate.bat
python -m pip install --upgrade pip
pip install -r requirements.txt
```

## Environment Setup (Frontend)

Run these commands from the `frontend/` directory.

```bash
cd frontend
bun install
bun run dev
```

By default, the Vite dev server starts at `http://localhost:5173`. If another process is using that port, Vite may choose the next available port.

## Configuration (.env)

The backend loads environment variables from a `.env` file in the project root via `python-dotenv`.

Create a backend `.env` file in the project root:

```bash
GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/google-service-account.json
GOOGLE_CLOUD_PROJECT=your-google-cloud-project-id
```

Notes:

- `GOOGLE_APPLICATION_CREDENTIALS` is the standard Google Application Default Credentials pattern. The Google auth libraries automatically detect this value.
- `GOOGLE_CLOUD_PROJECT` is recommended when the project cannot be detected from the credentials.
- If Google Cloud credentials are not configured locally, poster generation still works. Offer translation is skipped and the original English offer text is used.

Create a frontend `.env` file in `frontend/`:

```bash
VITE_API_BASE_URL=http://localhost:8000
```

All frontend API calls use `import.meta.env.VITE_API_BASE_URL`. Do not hardcode backend URLs inside React components.

## Asset Structure

Hero Studio expects static assets to exist before running generation. The app reads these folders directly from `assets/`.

### Backgrounds

Backgrounds are grouped by theme. Each theme folder should contain one image per platform.

Supported image extensions: `.png`, `.jpg`, `.jpeg`.

Required platform filenames:

- `Poster`
- `Instagram`
- `WhatsApp`
- `Facebook`

Example:

```text
assets/
  backgrounds/
    Diwali/
      Poster.png
      Instagram.png
      WhatsApp.png
      Facebook.png
    Holi/
      Poster.jpg
      Instagram.jpg
      WhatsApp.jpg
      Facebook.jpg
```

The backgrounds API scans theme directories and uses `Instagram.*` or `Poster.*` as the preferred UI thumbnail when available.

### Vehicle Segments

Vehicles are grouped by segment, then model. Each model should have a `colors/` folder containing vehicle color images.

Example:

```text
assets/
  segments/
    100CC/
      Splendor Plus/
        Splendor Plus.png
        colors/
          Black.png
          Red.png
    Scooter/
      Xoom 125/
        Xoom 125.png
        colors/
          Matte Storm Grey.png
          Pearl White.png
```

Notes:

- The model folder name is used as the model ID and display name.
- Color image filenames are used as color IDs and display names.
- Vehicle color assets should be high-quality product images. The backend applies `rembg` to isolate the vehicle and preserve transparency.

### Logos and Offer Strip

Optional logo and offer assets:

```text
assets/
  logos/
    hero_logo.png
    Splendor Plus.png
    Xoom 125.png
  offers/
    strip.png
```

Notes:

- `assets/logos/hero_logo.png` is placed at the top-left of the generated poster when present.
- `assets/logos/{bike_name}.png` is placed at the top-right when present.
- `assets/offers/strip.png` is used as the offer strip background when present. If missing, the backend draws a rounded fallback strip.

## Run Instructions

Start the backend from the project root:

```bash
source venv/bin/activate
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

On Windows, activate the environment first:

```powershell
.\venv\Scripts\Activate.ps1
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

Start the frontend from the `frontend/` directory:

```bash
cd frontend
bun run dev
```

Open the frontend in a browser and confirm it is using the backend configured by `VITE_API_BASE_URL`.

## Quick Verification

Backend health check:

```bash
curl http://localhost:8000/healthz
```

Asset checks:

```bash
curl http://localhost:8000/api/assets/segments
curl http://localhost:8000/api/assets/backgrounds
```

Expected result: both asset endpoints should return arrays. Empty arrays usually mean the required `assets/` folder structure is missing or incomplete.
