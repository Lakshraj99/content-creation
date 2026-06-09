import io
import os
from pathlib import Path
from PIL import Image
from google import genai
from google.genai import types

_ASPECT_MAP = {
    "Instagram": "1:1",
    "WhatsApp":  "9:16",
    "Facebook":  "4:3",
    "Poster":    "3:4",
}

_FESTIVAL_CUES = {
    "Diwali":           "A premium, high-fidelity 4K digital photograph of a traditional Diwali celebration in an upscale Indian neighborhood. The background is a beautifully blurred tapestry of golden festive lights, flickering diyas, and celebratory fireworks.",
    "Holi":             "vibrant clouds of coloured powder in magenta pink blue yellow green, joyful festival atmosphere, bright natural daylight, colourful confetti and flower petals",
    "Dhanteras":        "golden marigold flower garlands, clay oil lamps, gleaming gold coins and jewellery, auspicious red and gold textiles, warm amber evening glow, prosperity symbolism",
    "Independence Day": "Indian tricolour saffron white green flag motifs, confetti in orange white green, dramatic blue sky with clouds, proud patriotic atmosphere, kite flying in background",
    "Lohri":            "crackling open bonfire with orange red sparks flying upward, winter night sky, folk harvest festival atmosphere, sesame seeds and sugarcane, warm fire glow on dark background",
    "IPL":              "packed cricket stadium with floodlights blazing, crowd waving team colours, electric blue and green neon glow, sports energy, dramatic night sky, celebration confetti",
}

_MIME_MAP = {
    ".png":  "image/png",
    ".jpg":  "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
}

def _get_client():
    project  = os.getenv("GOOGLE_CLOUD_PROJECT",  "").strip()
    location = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1").strip()
    if not project:
        raise RuntimeError("GOOGLE_CLOUD_PROJECT not set in .env")
    return genai.Client(vertexai=True, project=project, location=location)


async def generate_brief(
    bike_model: str,
    festival: str,
    platform_name: str,
    bike_image_path,          
    brand_guidelines: str = "" # ── FIXED: Now expects 5 arguments
) -> str:
    client    = _get_client()
    cues      = _FESTIVAL_CUES.get(festival, festival)
    bike_path = Path(bike_image_path)
    mime_type = _MIME_MAP.get(bike_path.suffix.lower(), "image/png")

    print("[AI PIPELINE] Reading bike image for Gemini Vision analysis …")
    with open(bike_path, "rb") as f:
        image_bytes = f.read()

    image_part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
    
    guideline_text = f"  • Brand Guidelines to follow: {brand_guidelines}\n" if brand_guidelines else ""
    text_part  = types.Part.from_text(text=(
        f"You are a master creative director at a premium automotive marketing agency.\n\n"
        f"Step 1 — Study this motorcycle image carefully:\n"
        f"  • Note its EXACT primary and secondary colours\n"
        f"  • Identify its style: sporty / commuter / scooter / adventure / premium\n"
        f"  • Capture its energy and visual personality\n\n"
        f"Step 2 — Write a highly detailed, ULTRA-REALISTIC BACKGROUND scene description for "
        f"an AI image generator (Imagen 3). This scene sits BEHIND this exact bike "
        f"in a Hero MotoCorp {festival} marketing poster for {platform_name}.\n\n"
        f"Festival atmosphere cues: {cues}\n\n"
        f"CRITICAL Scene Requirements:\n"
        f"  • Must be an ultra-realistic, hyper-detailed, 4K resolution commercial photography background.\n"
        f"  • Color-match the scene's lighting and tones to COMPLEMENT the bike's actual colours.\n"
        f"  • VEHICLE PREPARATION SPACE: You MUST leave a large, clear, flat, and realistic ground surface (e.g., paved street, studio floor, clean asphalt) in the lower-center of the image.\n"
        f"  • Keep this lower-center parking area completely empty and vacant.\n"
        f"{guideline_text}"
        f"  • Cinematic depth of field, dramatic professional lighting, and extreme photorealism.\n\n"
        f"Output: ONLY the Imagen scene prompt text (150-180 words). No headings, no explanation, no quotes."
    ))

    print("[AI PIPELINE] Sending bike image + festival brief to Gemini 2.5 Flash Vision …")
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[image_part, text_part],
    )
    brief = response.text.strip()
    print(f"[AI PIPELINE] Vision brief ready ({len(brief.split())} words)")
    return brief


async def generate_background(
    brief: str, platform_name: str, target_width: int, target_height: int, negative_prompt: str = "" # ── FIXED: Also updated here for Imagen
) -> Image.Image:
    client       = _get_client()
    aspect_ratio = _ASPECT_MAP.get(platform_name, "1:1")
    model_id = "imagen-3.0-generate-001"
    
    # ── FIXED: Passes the negative prompt mathematically to prevent extra bikes!
    core_bans = "motorcycle, scooter, bike, car, vehicle, person, people, human, text, watermark, logo, typography"
    final_negative_prompt = f"{negative_prompt}, {core_bans}" if negative_prompt else core_bans

    try:
        print(f"[AI PIPELINE] Trying {model_id} with Negative Prompts …")
        response = client.models.generate_images(
            model=model_id,
            prompt=brief,
            config=types.GenerateImagesConfig(
                number_of_images=1,
                aspect_ratio=aspect_ratio,
                negative_prompt=final_negative_prompt, 
            ),
        )
        img_bytes = response.generated_images[0].image.image_bytes
        img = Image.open(io.BytesIO(img_bytes))
        print(f"[AI PIPELINE] Background generated with {model_id}")
        return img.resize((target_width, target_height), Image.Resampling.LANCZOS).convert("RGBA")
    except Exception as exc:
        print(f"[AI PIPELINE] {model_id} failed: {exc}")
        raise RuntimeError("Imagen model failed to generate background.")


def _to_png_bytes(img: Image.Image) -> bytes:
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


async def inpaint_ground_contact(
    composite: Image.Image,
    mask: Image.Image,
    festival: str,
    target_width: int,
    target_height: int,
) -> Image.Image:
    client = _get_client()

    api_size = 1024
    scale    = api_size / max(target_width, target_height)
    api_w, api_h = int(target_width * scale), int(target_height * scale)

    comp_small = composite.convert("RGB").resize((api_w, api_h), Image.Resampling.LANCZOS)
    mask_small = mask.resize((api_w, api_h), Image.Resampling.NEAREST)

    comp_bytes = _to_png_bytes(comp_small)
    mask_bytes = _to_png_bytes(mask_small)

    prompt = (
        f"Photorealistic motorcycle tyre contact shadows and ground surface lighting. "
        f"In the white masked areas only: paint dark tyre-shaped contact shadow patches "
        f"exactly where the tyres press against the ground surface. "
        f"Add subtle specular ground reflections and light pooling consistent with the "
        f"{festival} festival lighting already visible in the scene. "
        f"The motorcycle must look heavy and firmly grounded — not floating. "
        f"Keep all colours and textures outside the masked area completely unchanged."
    )

    try:
        response = client.models.edit_image(
            model="imagen-3.0-capability-001",
            prompt=prompt,
            reference_images=[
                types.RawReferenceImage(
                    reference_id=1,
                    reference_image=types.Image(image_bytes=comp_bytes),
                ),
                types.MaskReferenceImage(
                    reference_id=2,
                    reference_image=types.Image(image_bytes=mask_bytes),
                    config=types.MaskReferenceConfig(
                        mask_mode="MASK_MODE_USER_PROVIDED",
                    ),
                ),
            ],
            config=types.EditImageConfig(
                edit_mode="EDIT_MODE_INPAINT_INSERTION",
                number_of_images=1,
            ),
        )

        inpainted_bytes = response.generated_images[0].image.image_bytes
        inpainted_small = Image.open(io.BytesIO(inpainted_bytes)).convert("RGBA")

        inpainted_full = inpainted_small.resize(
            (target_width, target_height), Image.Resampling.LANCZOS
        )

        mask_full  = mask.resize((target_width, target_height), Image.Resampling.LANCZOS).convert("L")
        comp_rgba  = composite.convert("RGBA")
        result     = Image.composite(inpainted_full, comp_rgba, mask_full)

        print("[AI PIPELINE] Ground contact inpainting applied")
        return result

    except Exception as exc:
        print(f"[AI PIPELINE] Inpainting skipped (PIL-only fallback): {exc}")
        return composite