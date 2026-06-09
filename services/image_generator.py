import io
import json
import logging
import os
from pathlib import Path

import google.auth
import requests
from google.auth.transport.requests import Request as GoogleAuthRequest
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageOps
from rembg import remove

OUTPUT_DIR = Path("outputs")
BASE_DIR = OUTPUT_DIR / "base"
EDITS_DIR = OUTPUT_DIR / "edits"
BACKGROUNDS_DIR = Path("assets/backgrounds")
LOGGER = logging.getLogger(__name__)

for _d in (OUTPUT_DIR, BASE_DIR, EDITS_DIR):
    _d.mkdir(parents=True, exist_ok=True)

BACKGROUND_EXTENSIONS = (".png", ".jpg", ".jpeg")
BACKGROUND_FALLBACK_ORDER = ("Instagram", "Poster")
OFFER_STRIP_Y_RATIO = 0.12
OFFER_STRIP_HEIGHT_RATIO = 0.11
OFFER_VEHICLE_GAP_RATIO = 0.06
VEHICLE_GROUND_Y_RATIO = 0.85
VEHICLE_MAX_WIDTH_RATIO = 0.68
VEHICLE_MAX_HEIGHT_RATIO = 0.48
TRANSLATION_SCOPE = "https://www.googleapis.com/auth/cloud-translation"
TRANSLATION_LANGUAGE_CODES = {
    "Hindi": "hi",
    "Kannada": "kn",
    "Gujarati": "gu",
    "Bengali": "bn",
    "Marathi": "mr",
    "Tamil": "ta",
    "Telugu": "te",
    "Malayalam": "ml",
    "Assamese": "as",
    "Punjabi": "pa",
    "Odia": "or",
}

BASE_FONT_CANDIDATES = (
    Path("/System/Library/Fonts/Helvetica.ttc"),
    Path("/System/Library/Fonts/HelveticaNeue.ttc"),
    Path("/System/Library/Fonts/MuktaMahee.ttc"),
    Path("/System/Library/Fonts/Supplemental/Arial Unicode.ttf"),
    Path("/Library/Fonts/Arial Unicode.ttf"),
)

SCRIPT_FONT_CANDIDATES = (
    (
        (0x0900, 0x097F),
        (
            Path("/System/Library/Fonts/Supplemental/Devanagari Sangam MN.ttc"),
            Path("/System/Library/Fonts/Supplemental/DevanagariMT.ttc"),
            Path("/System/Library/Fonts/Supplemental/ITFDevanagari.ttc"),
        ),
    ),
    (
        (0x0980, 0x09FF),
        (
            Path("/System/Library/Fonts/Supplemental/Bangla Sangam MN.ttc"),
            Path("/System/Library/Fonts/Supplemental/Bangla MN.ttc"),
            Path("/System/Library/Fonts/KohinoorBangla.ttc"),
        ),
    ),
    (
        (0x0A00, 0x0A7F),
        (
            Path("/System/Library/Fonts/Supplemental/Gurmukhi Sangam MN.ttc"),
            Path("/System/Library/Fonts/Supplemental/Gurmukhi MN.ttc"),
            Path("/System/Library/Fonts/Supplemental/Gurmukhi.ttf"),
        ),
    ),
    (
        (0x0A80, 0x0AFF),
        (
            Path("/System/Library/Fonts/Supplemental/Gujarati Sangam MN.ttc"),
            Path("/System/Library/Fonts/Supplemental/GujaratiMT.ttc"),
            Path("/System/Library/Fonts/KohinoorGujarati.ttc"),
        ),
    ),
    (
        (0x0B00, 0x0B7F),
        (
            Path("/System/Library/Fonts/NotoSansOriya.ttc"),
            Path("/System/Library/Fonts/Supplemental/Oriya Sangam MN.ttc"),
            Path("/System/Library/Fonts/Supplemental/Oriya MN.ttc"),
        ),
    ),
    (
        (0x0B80, 0x0BFF),
        (
            Path("/System/Library/Fonts/Supplemental/Tamil Sangam MN.ttc"),
            Path("/System/Library/Fonts/Supplemental/Tamil MN.ttc"),
        ),
    ),
    (
        (0x0C00, 0x0C7F),
        (
            Path("/System/Library/Fonts/Supplemental/Telugu Sangam MN.ttc"),
            Path("/System/Library/Fonts/Supplemental/Telugu MN.ttc"),
            Path("/System/Library/Fonts/KohinoorTelugu.ttc"),
        ),
    ),
    (
        (0x0C80, 0x0CFF),
        (
            Path("/System/Library/Fonts/NotoSansKannada.ttc"),
            Path("/System/Library/Fonts/Supplemental/Kannada Sangam MN.ttc"),
            Path("/System/Library/Fonts/Supplemental/Kannada MN.ttc"),
        ),
    ),
    (
        (0x0D00, 0x0D7F),
        (
            Path("/System/Library/Fonts/Supplemental/Malayalam Sangam MN.ttc"),
            Path("/System/Library/Fonts/Supplemental/Malayalam MN.ttc"),
        ),
    ),
)


class GenerationResult:
    def __init__(
        self,
        filename: str,
        url: str,
        prompt: str,
        base_filename: str = "",
        translated_offers: list | None = None,
    ):
        self.filename = filename
        self.url = url
        self.prompt = prompt
        self.base_filename = base_filename
        self.translated_offers = translated_offers or []


def find_color_asset(color_id: str, bike_id: str):
    segments_dir = Path("assets/segments")
    if not segments_dir.exists():
        return None
    for seg in sorted(segments_dir.iterdir()):
        if not seg.is_dir():
            continue
        colors_dir = seg / bike_id / "colors"
        if colors_dir.exists():
            for f in colors_dir.iterdir():
                if f.stem.lower() == color_id.lower():
                    return f
    return None


def _find_theme_dir(theme: str) -> Path | None:
    exact = BACKGROUNDS_DIR / theme
    if exact.is_dir():
        return exact

    normalized = theme.lower()
    theme_dirs = (
        sorted(BACKGROUNDS_DIR.iterdir(), key=lambda p: p.name.lower())
        if BACKGROUNDS_DIR.exists()
        else []
    )
    for theme_dir in theme_dirs:
        if theme_dir.is_dir() and theme_dir.name.lower() == normalized:
            return theme_dir
    return None


def _find_background_named(theme_dir: Path, image_name: str) -> Path | None:
    normalized = image_name.lower()
    for ext in BACKGROUND_EXTENSIONS:
        exact = theme_dir / f"{image_name}{ext}"
        if exact.exists():
            return exact

    for file_path in sorted(theme_dir.iterdir(), key=lambda p: p.name.lower()):
        if (
            file_path.is_file()
            and file_path.suffix.lower() in BACKGROUND_EXTENSIONS
            and file_path.stem.lower() == normalized
        ):
            return file_path
    return None


def get_platform_bg(theme: str, platform: str) -> Path | None:
    theme_dir = _find_theme_dir(theme)
    if not theme_dir:
        return None

    platform_background = _find_background_named(theme_dir, platform)
    if platform_background:
        return platform_background

    for fallback_name in BACKGROUND_FALLBACK_ORDER:
        fallback_background = _find_background_named(theme_dir, fallback_name)
        if fallback_background:
            return fallback_background

    for file_path in sorted(theme_dir.iterdir(), key=lambda p: p.name.lower()):
        if file_path.is_file() and file_path.suffix.lower() in BACKGROUND_EXTENSIONS:
            return file_path
    return None


def _load_background(theme: str, platform: str) -> tuple[Image.Image, Path]:
    background_path = get_platform_bg(theme, platform)
    if not background_path:
        raise FileNotFoundError(
            f"Background asset not found for theme '{theme}' and platform '{platform}'. "
            f"Expected assets/backgrounds/{theme}/{platform}.png|jpg|jpeg."
        )

    with Image.open(background_path) as bg_img:
        background = ImageOps.exif_transpose(bg_img).convert("RGBA")

    return background, background_path


def _has_useful_alpha(img: Image.Image) -> bool:
    alpha_min, alpha_max = img.getchannel("A").getextrema()
    return img.getbbox() is not None and alpha_max >= 160 and alpha_min < alpha_max


def _remove_near_white_background(img: Image.Image) -> Image.Image:
    rgba = img.convert("RGBA")
    pixels = rgba.load()
    width, height = rgba.size
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if r > 242 and g > 242 and b > 242:
                pixels[x, y] = (r, g, b, 0)
            else:
                pixels[x, y] = (r, g, b, a)
    return rgba


def _load_vehicle(vehicle_path: Path) -> Image.Image:
    vehicle_bytes = vehicle_path.read_bytes()
    with Image.open(io.BytesIO(vehicle_bytes)) as source_img:
        source = ImageOps.exif_transpose(source_img).convert("RGBA")

    cutout = remove(vehicle_bytes)
    if isinstance(cutout, bytes):
        with Image.open(io.BytesIO(cutout)) as vehicle_img:
            vehicle = ImageOps.exif_transpose(vehicle_img).convert("RGBA")
    else:
        vehicle = cutout.convert("RGBA")

    if not _has_useful_alpha(vehicle):
        source_alpha_min, source_alpha_max = source.getchannel("A").getextrema()
        vehicle = (
            source
            if source_alpha_min < source_alpha_max
            else _remove_near_white_background(source)
        )
    else:
        vehicle = _remove_near_white_background(vehicle)

    tight_box = vehicle.getbbox()
    return vehicle.crop(tight_box) if tight_box else vehicle


def _resize_vehicle_to_background(
    vehicle: Image.Image,
    bg_width: int,
    bg_height: int,
) -> Image.Image:
    offer_safe_bottom = bg_height * (
        OFFER_STRIP_Y_RATIO + OFFER_STRIP_HEIGHT_RATIO + OFFER_VEHICLE_GAP_RATIO
    )
    ground_y = bg_height * VEHICLE_GROUND_Y_RATIO
    max_vehicle_width = bg_width * VEHICLE_MAX_WIDTH_RATIO
    max_vehicle_height = min(bg_height * VEHICLE_MAX_HEIGHT_RATIO, ground_y - offer_safe_bottom)
    scale = min(max_vehicle_width / vehicle.width, max_vehicle_height / vehicle.height)
    new_size = (
        max(1, int(vehicle.width * scale)),
        max(1, int(vehicle.height * scale)),
    )
    return vehicle.resize(new_size, Image.Resampling.LANCZOS)


def _vehicle_position(
    bg_width: int,
    bg_height: int,
    vehicle_width: int,
    vehicle_height: int,
) -> tuple[int, int, int]:
    ground_y = int(bg_height * VEHICLE_GROUND_Y_RATIO)
    paste_x = (bg_width - vehicle_width) // 2
    paste_y = ground_y - vehicle_height
    return paste_x, paste_y, ground_y


def _add_vehicle_shadow(
    canvas: Image.Image,
    vehicle_width: int,
    vehicle_height: int,
    paste_x: int,
    paste_y: int,
) -> Image.Image:
    bg_width, bg_height = canvas.size
    shadow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(shadow)
    cx = paste_x + vehicle_width // 2
    contact_y = paste_y + vehicle_height
    shadow_w = int(vehicle_width * 0.78)
    shadow_h = max(8, int(bg_height * 0.018))
    blur_radius = max(15, min(25, int(bg_width * 0.018)))
    draw.ellipse(
        [
            cx - shadow_w // 2,
            contact_y - shadow_h // 2,
            cx + shadow_w // 2,
            contact_y + shadow_h // 2,
        ],
        fill=(0, 0, 0, 120),
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(blur_radius))
    return Image.alpha_composite(canvas, shadow)


def _font_candidates_for_text(text: str):
    for char in text:
        codepoint = ord(char)
        for (start, end), paths in SCRIPT_FONT_CANDIDATES:
            if start <= codepoint <= end:
                return (*paths, *BASE_FONT_CANDIDATES)
    return BASE_FONT_CANDIDATES


def _get_font(size: int, text: str = "") -> ImageFont.FreeTypeFont:
    for path in _font_candidates_for_text(text):
        if path.exists():
            return ImageFont.truetype(str(path), size)
    return ImageFont.load_default(size=size)


def _fit_font_for_width(draw, text: str, ideal_size: int, max_w: int) -> ImageFont.FreeTypeFont:
    size = ideal_size
    floor = max(ideal_size // 2, 18)
    while size > floor:
        font = _get_font(size, text)
        bbox = draw.textbbox((0, 0), text, font=font)
        if bbox[2] - bbox[0] <= max_w:
            return font
        size -= 2
    return _get_font(floor, text)


def _translation_target_code(language: str) -> str:
    return TRANSLATION_LANGUAGE_CODES.get(language, language.lower())


def _translate_offers(offers: list[str], language: str) -> list[str]:
    language = (language or "English").strip()
    if language == "English":
        return offers

    indexed_offers = [(index, offer) for index, offer in enumerate(offers) if offer.strip()]
    translatable = [offer for _, offer in indexed_offers]
    if not translatable:
        return offers

    target_code = _translation_target_code(language)
    try:
        credentials, detected_project = google.auth.default(scopes=[TRANSLATION_SCOPE])
        if not credentials.valid:
            credentials.refresh(GoogleAuthRequest())
        project = os.getenv("GOOGLE_CLOUD_PROJECT", "").strip() or detected_project
        if not project:
            raise RuntimeError("GOOGLE_CLOUD_PROJECT not set and no ADC project detected.")

        response = requests.post(
            "https://translation.googleapis.com/v3/projects/"
            f"{project}/locations/global:translateText",
            headers={"Authorization": f"Bearer {credentials.token}"},
            json={
                "contents": translatable,
                "mimeType": "text/plain",
                "sourceLanguageCode": "en",
                "targetLanguageCode": target_code,
            },
            timeout=30,
        )
        response.raise_for_status()
        translations = response.json().get("translations", [])
        if len(translations) != len(translatable):
            return offers

        translated_offers = list(offers)
        for (index, original), translated in zip(indexed_offers, translations):
            translated_offers[index] = translated.get("translatedText", original)
        return translated_offers
    except Exception as exc:
        LOGGER.warning(
            "Translation skipped: Google Cloud credentials not found or invalid. %s",
            exc,
        )
        return offers


def _apply_text_layers(
    canvas: Image.Image,
    offers: list,
    dealer_address: str,
    target_width: int,
    target_height: int,
) -> Image.Image:
    active_offers = [o.strip() for o in offers if o.strip()][:3]
    num_offers = len(active_offers)

    if num_offers > 0:
        strip_w = int(target_width * 0.88)
        strip_h = int(target_height * OFFER_STRIP_HEIGHT_RATIO)
        strip_x = (target_width - strip_w) // 2
        strip_y = int(target_height * OFFER_STRIP_Y_RATIO)

        strip_path = Path("assets/offers/strip.png")
        if strip_path.exists():
            with Image.open(strip_path) as s_img:
                s_resized = s_img.resize(
                    (strip_w, strip_h),
                    Image.Resampling.LANCZOS,
                ).convert("RGBA")
                alpha = s_resized.getchannel("A")
                alpha = alpha.point(lambda p: int(p * 0.90))
                s_resized.putalpha(alpha)
                strip_layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
                strip_layer.paste(s_resized, (strip_x, strip_y))
                canvas = Image.alpha_composite(canvas, strip_layer)
        else:
            s_layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
            ImageDraw.Draw(s_layer).rounded_rectangle(
                [(strip_x, strip_y), (strip_x + strip_w, strip_y + strip_h)],
                radius=int(strip_h * 0.2),
                fill=(240, 227, 192, 245),
            )
            canvas = Image.alpha_composite(canvas, s_layer)

        draw = ImageDraw.Draw(canvas)
        col_width = strip_w / num_offers

        for i, txt in enumerate(active_offers):
            cx = int(strip_x + (i + 0.5) * col_width)
            cy = strip_y + (strip_h // 2)

            parts = txt.split("\n")

            if len(parts) >= 2:
                title = parts[0]
                value = parts[1]
                fnt_title = _fit_font_for_width(
                    draw,
                    title,
                    int(strip_h * 0.18),
                    int(col_width * 0.85),
                )
                fnt_value = _fit_font_for_width(
                    draw,
                    value,
                    int(strip_h * 0.32),
                    int(col_width * 0.85),
                )
                draw.text(
                    (cx, cy - int(strip_h * 0.15)),
                    title,
                    fill=(0, 0, 0, 255),
                    font=fnt_title,
                    anchor="mm",
                )
                draw.text(
                    (cx, cy + int(strip_h * 0.18)),
                    value,
                    fill=(0, 0, 0, 255),
                    font=fnt_value,
                    anchor="mm",
                )
            else:
                fnt = _fit_font_for_width(
                    draw,
                    txt,
                    int(strip_h * 0.25),
                    int(col_width * 0.85),
                )
                draw.text(
                    (cx, cy),
                    txt,
                    fill=(0, 0, 0, 255),
                    font=fnt,
                    anchor="mm",
                )

    dealer_text = dealer_address.strip()
    if dealer_text:
        draw = ImageDraw.Draw(canvas)
        bottom_padding = max(32, int(target_height * 0.04))
        font_size = max(24, int(target_height * 0.027))
        font = _fit_font_for_width(
            draw,
            dealer_text,
            font_size,
            target_width - int(target_width * 0.08),
        )
        bbox = draw.multiline_textbbox((0, 0), dealer_text, font=font)
        text_width = bbox[2] - bbox[0]
        text_x = int((target_width - text_width) // 2)
        text_y = target_height - bottom_padding
        draw.multiline_text(
            (text_x, text_y),
            dealer_text,
            fill=(245, 245, 245, 255),
            font=font,
            align="center",
            stroke_width=2,
            stroke_fill=(0, 0, 0, 255),
        )

    return canvas


async def generate_image(
    bike_id: str, bike_name: str, color_id: str, color_name: str,
    festival: str, campaign_header: str,
    offers: list, dealer_address: str, platform_name: str,
    platform_width: int, platform_height: int, filename: str,
    language: str = "English",
) -> GenerationResult:
    bike_path = find_color_asset(color_id, bike_id)
    if not bike_path:
        raise FileNotFoundError(f"Bike color asset not found: {bike_id} / {color_id}")

    canvas_bg, background_path = _load_background(festival, platform_name)
    target_width, target_height = canvas_bg.size

    vehicle = _load_vehicle(bike_path)
    bike_scaled = _resize_vehicle_to_background(vehicle, target_width, target_height)
    bike_w, bike_h = bike_scaled.size
    paste_x, paste_y, ground_y = _vehicle_position(target_width, target_height, bike_w, bike_h)

    composite_canvas = _add_vehicle_shadow(canvas_bg, bike_w, bike_h, paste_x, paste_y)
    composite_canvas.paste(bike_scaled, (paste_x, paste_y), mask=bike_scaled)
    brief = f"Static background composite: {festival} / {platform_name} using {background_path}"

    logo_dir = Path("assets/logos")
    hero_logo_path = logo_dir / "hero_logo.png"
    bike_logo_path = logo_dir / f"{bike_name}.png"

    if hero_logo_path.exists():
        with Image.open(hero_logo_path) as hero_logo:
            lw = int(target_width * 0.15)
            lh = int(hero_logo.height * (lw / hero_logo.width))
            ls = hero_logo.resize((lw, lh), Image.Resampling.LANCZOS).convert("RGBA")
            composite_canvas.paste(
                ls,
                (int(target_width * 0.04), int(target_height * 0.03)),
                mask=ls,
            )

    if bike_logo_path.exists():
        with Image.open(bike_logo_path) as bike_logo:
            bw = int(target_width * 0.20)
            bh = int(bike_logo.height * (bw / bike_logo.width))
            bs = bike_logo.resize((bw, bh), Image.Resampling.LANCZOS).convert("RGBA")
            composite_canvas.paste(
                bs,
                (target_width - bw - int(target_width * 0.04), int(target_height * 0.03)),
                mask=bs,
            )

    stem = Path(filename).stem
    base_filename = f"{stem}.png"
    composite_canvas.save(str(BASE_DIR / base_filename), format="PNG")
    (BASE_DIR / f"{stem}.json").write_text(
        json.dumps(
            {
                "target_width": target_width,
                "target_height": target_height,
                "paste_y": paste_y,
                "ground_y": ground_y,
            }
        )
    )

    localized_offers = _translate_offers(offers, language)

    poster_canvas = composite_canvas.copy()
    poster_canvas = _apply_text_layers(
        poster_canvas,
        localized_offers,
        dealer_address,
        target_width,
        target_height,
    )

    out_path = OUTPUT_DIR / filename
    poster_canvas.convert("RGB").save(str(out_path), format="JPEG", quality=95, subsampling=0)

    return GenerationResult(
        filename=filename,
        url=f"/outputs/{filename}",
        prompt=brief,
        base_filename=base_filename,
        translated_offers=localized_offers,
    )


async def edit_image_text(
    base_filename: str,
    campaign_header: str,
    offers: list,
    dealer_address: str,
) -> GenerationResult:
    base_path = BASE_DIR / base_filename
    sidecar_path = BASE_DIR / (Path(base_filename).stem + ".json")

    if not base_path.exists() or not sidecar_path.exists():
        raise FileNotFoundError("Target base resources missing from filesystem.")

    with Image.open(base_path) as img:
        canvas = img.copy().convert("RGBA")

    meta = json.loads(sidecar_path.read_text())
    canvas = _apply_text_layers(
        canvas,
        offers,
        dealer_address,
        meta["target_width"],
        meta["target_height"],
    )

    edit_filename = f"{Path(base_filename).stem}_edit.jpeg"
    canvas.convert("RGB").save(
        str(EDITS_DIR / edit_filename),
        format="JPEG",
        quality=95,
        subsampling=0,
    )
    return GenerationResult(
        filename=edit_filename,
        url=f"/outputs/edits/{edit_filename}",
        prompt="Text adjustment.",
    )
