# -*- coding: utf-8 -*-
"""Sunset PIPELINE V3 — prepare / generate / composite menu asset jobs.

Modes:
  prepare   — install BGs, build alpha masks, write per-item job packages
  generate  — local SD1.5 inpaint (diffusers, low-VRAM) → gen/raw.png
  status    — show what is ready / missing
  composite — rembg cutout + seat on locked BG
  qa        — outside-mask MAE vs base

Usage (PowerShell):
  python scripts/sunset_v3_hot_batch.py prepare
  python scripts/sunset_v3_hot_batch.py generate
  python scripts/sunset_v3_hot_batch.py generate --force --steps 28 --infer-size 512
  python scripts/sunset_v3_hot_batch.py status
  python scripts/sunset_v3_hot_batch.py composite
  python scripts/sunset_v3_hot_batch.py qa

Local deps (CUDA laptop):
  pip install torch torchvision --index-url https://download.pytorch.org/whl/cu124
  pip install diffusers transformers accelerate safetensors
  pip install xformers   # optional
"""
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import sys
import time
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, str(Path(__file__).resolve().parent))

from sunset_vessel_system import (  # noqa: E402
    ASSETS,
    BG_45,
    BG_TOP,
    MASTER_DIR,
    REPO,
    SIZE,
    USER_ASSETS,
    VESSEL_CY,
    VESSEL_FRAC,
    VESSEL_MAP,
    bg_path_for,
    target_diameter_px,
)

MANIFEST = Path(__file__).resolve().parent / "sunset_v3_hot_manifest.json"
SYSTEM_PROMPT = REPO / "gemini-code-1785848380021.md"
TPL = REPO / "Assets" / "sunset_templates"
BATCH_ROOT = REPO / "scripts" / "menu_photos" / "sunset_v3_hot_batch"
OUT_DIR = ASSETS  # final PILOT / production candidates

# User-attached clean plates from this chat (absolute Cursor asset paths)
NEW_BG_45 = USER_ASSETS / (
    "c__Users_sxclipse_AppData_Roaming_Cursor_User_workspaceStorage_"
    "c898333788977c6ec68420474be99ea8_images_45_gradusov-9a72c9d0-a85e-4735-89fd-b274ab24a34a.png"
)
NEW_BG_TOP = USER_ASSETS / (
    "c__Users_sxclipse_AppData_Roaming_Cursor_User_workspaceStorage_"
    "c898333788977c6ec68420474be99ea8_images_top-down-aa3f81a5-8203-4bbf-9404-b62f4efe21e8.png"
)

DISHWARE_REF = {
    ("V1", "45"): MASTER_DIR / "locked_V1_45.png",
    ("V1", "top"): MASTER_DIR / "locked_V1_top.png",
    ("V2", "45"): MASTER_DIR / "locked_V2_45.png",
    ("V3", "45"): MASTER_DIR / "locked_V3_45.png",
    ("C1", "45"): MASTER_DIR / "locked_C1_45.png",
}


def install_backgrounds(force: bool = True) -> None:
    TPL.mkdir(parents=True, exist_ok=True)
    bak = TPL / "_bak_pre_v3"
    bak.mkdir(exist_ok=True)
    pairs = [
        (NEW_BG_45, BG_45, "45_gradusov.png"),
        (NEW_BG_TOP, BG_TOP, "top_down.png"),
    ]
    for src, dst, alias_name in pairs:
        if not src.exists():
            print(f"WARN missing new BG: {src}")
            continue
        if dst.exists() and not (bak / dst.name).exists():
            shutil.copy2(dst, bak / dst.name)
            print(f"backed up {dst.name}")
        if force or not dst.exists():
            shutil.copy2(src, dst)
            shutil.copy2(src, TPL / alias_name)
            im = Image.open(dst)
            print(f"installed {dst.name} {im.size}")


def make_ellipse_mask(
    vessel: str,
    angle: str,
    size: int = SIZE,
    diameter_boost: float = 1.06,
) -> Image.Image:
    """Soft alpha mask: white = editable (center), black = locked."""
    frac = VESSEL_FRAC[vessel] * diameter_boost
    # Slightly taller ellipse for 45° foreshortening
    rx = int(size * frac / 2)
    ry = int(rx * (0.72 if angle == "45" else 1.0))
    cx = size // 2
    cy = int(size * VESSEL_CY[vessel])
    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((cx - rx, cy - ry, cx + rx, cy + ry), fill=255)
    # Soft feather so inpainting edge blends
    mask = mask.filter(ImageFilter.GaussianBlur(radius=10))
    return mask


def write_masks() -> dict[str, Path]:
    out: dict[str, Path] = {}
    for vessel, angle in (("V1", "45"), ("V2", "45"), ("V1", "top")):
        p = TPL / f"mask_{vessel}_{angle}.png"
        make_ellipse_mask(vessel, angle).save(p)
        out[f"{vessel}_{angle}"] = p
        print(f"mask {p.name}")
    return out


def dishware_for(vessel: str, angle: str) -> Path | None:
    p = DISHWARE_REF.get((vessel, angle))
    if p and p.exists():
        return p
    # fall back to cutouts
    cut = MASTER_DIR / f"cutout_{vessel}_{angle}.png"
    return cut if cut.exists() else None


def prepare_jobs() -> None:
    install_backgrounds()
    write_masks()
    data = load_manifest()
    system_txt = SYSTEM_PROMPT.read_text(encoding="utf-8") if SYSTEM_PROMPT.exists() else ""
    BATCH_ROOT.mkdir(parents=True, exist_ok=True)
    (BATCH_ROOT / "SYSTEM_PROMPT.md").write_text(system_txt, encoding="utf-8")

    for item in data["items"]:
        stem = item["stem"]
        vessel = item["vessel"]
        angle = item["angle"]
        job = BATCH_ROOT / stem
        job.mkdir(parents=True, exist_ok=True)
        (job / "gen").mkdir(exist_ok=True)
        (job / "out").mkdir(exist_ok=True)

        bg = BG_45 if angle == "45" else BG_TOP
        shutil.copy2(bg, job / "base.png")

        mask = make_ellipse_mask(vessel, angle)
        mask.save(job / "mask.png")
        # RGBA preview: base with red tint in editable zone
        base = Image.open(bg).convert("RGBA").resize((SIZE, SIZE))
        overlay = Image.new("RGBA", (SIZE, SIZE), (220, 40, 40, 0))
        a = np.array(mask)
        ov = np.array(overlay)
        ov[..., 3] = (a * 0.35).astype(np.uint8)
        preview = Image.alpha_composite(base, Image.fromarray(ov))
        preview.convert("RGB").save(job / "mask_preview.jpg", quality=90)

        ref = dishware_for(vessel, angle)
        if ref:
            shutil.copy2(ref, job / "dishware_ref.png")

        subject = item["subject"]
        (job / "subject.txt").write_text(subject, encoding="utf-8")

        negative = (
            "watermarks, text, logos, human hands, extra cutlery, secondary plates, "
            "floating garnishes, scattered spices outside the dish, blurred textures, "
            "glossy plates, white/transparent dishware, rustic clay pot, ketsi, "
            "yellow artificial lighting, oversaturation, altered background, "
            "shifted napkins, regenerated table texture"
        )
        (job / "negative.txt").write_text(negative, encoding="utf-8")

        user_prompt = f"""TASK: Inpaint ONLY inside the white/alpha mask region of the provided base template.

BASE: Sunset restaurant table — angle={angle} ({'perspective 45°' if angle == '45' else 'top-down'}).
DISHWARE: Match dishware_ref exactly — Matte Graphite {vessel}, zero gloss on the vessel.
FOOD SUBJECT: {subject}
SCALE: Dish + food occupy 70–75% of the central frame. Never crop the top of the food.
SHADOWS: Soft contact shadow under the dishware; match napkin shadow intensity/direction on the base.
IMMUTABLE: Do not change any pixel outside the mask (napkin, cutlery, herbs, table texture, sofa).
STYLE: Photoreal food photography for a dark-mode mobile menu (393px). Appetizing food, matte plate/bowl.
"""
        (job / "user_prompt.txt").write_text(user_prompt.strip() + "\n", encoding="utf-8")

        meta = {
            **item,
            "base": "base.png",
            "mask": "mask.png",
            "dishware_ref": "dishware_ref.png" if ref else None,
            "expected_diameter_px": target_diameter_px(vessel),
            "vessel_frac": VESSEL_FRAC[vessel],
            "cy": VESSEL_CY[vessel],
            "bg_canonical": str(bg_path_for(stem)),
            "vessel_map_check": VESSEL_MAP.get(stem),
            "status": "prepared_awaiting_gen",
            "drop_gen_here": "gen/raw.png",
            "final_name": f"{stem.replace('-', '_')}_V3.png",
        }
        (job / "META.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"JOB {stem}  vessel={vessel} angle={angle}  → {job}")

    # root README for operator
    readme = f"""# Sunset Hot V3 batch — {data['batch']}

## Plan (execution order)
1. **prepare** (done by this script) — BG lock templates + masks + job packages
2. **generate** (external) — for each job folder, run mask-aware inpainting with:
   - `base.png` + `mask.png` + `dishware_ref.png` + `user_prompt.txt` + `SYSTEM_PROMPT.md`
   - save raw model output to `gen/raw.png`
3. **composite** — `python scripts/sunset_v3_hot_batch.py composite`
   - rembg cutout, seat on locked BG at vessel scale, soft napkin-matched shadow
4. **qa** — outside-mask MAE must be ~0 vs base; reject drift
5. **publish** — only after visual OK (existing upload_sunset_* scripts)

## Items ({len(data['items'])})
""" + "\n".join(
        f"- `{i['stem']}` — {i['ru']} ({i['vessel']}/{i['angle']})" for i in data["items"]
    )
    (BATCH_ROOT / "README.md").write_text(readme + "\n", encoding="utf-8")
    print(f"\nPrepared {len(data['items'])} jobs → {BATCH_ROOT}")


def status() -> None:
    items = discover_jobs()
    print(f"Batch root: {BATCH_ROOT}")
    print(f"BG_45 exists: {BG_45.exists()}  BG_TOP exists: {BG_TOP.exists()}")
    print(f"Jobs: {len(items)}")
    for item in items:
        stem = item["stem"]
        job = BATCH_ROOT / stem
        gen = job / "gen" / "raw.png"
        out = job / "out" / f"{stem.replace('-', '_')}_V3.png"
        flags = []
        flags.append("pkg" if (job / "META.json").exists() else "NO-PKG")
        flags.append("gen" if gen.exists() else "no-gen")
        flags.append("out" if out.exists() else "no-out")
        label = item.get("ru") or item.get("en") or ""
        print(f"  {stem:32s} {' '.join(flags)}  | {label}")


def qa_stem(stem: str, max_mae: float = 2.5) -> bool:
    job = BATCH_ROOT / stem
    base = Image.open(job / "base.png").convert("RGB").resize((SIZE, SIZE))
    mask = Image.open(job / "mask.png").convert("L").resize((SIZE, SIZE))
    candidates = list((job / "out").glob("*_V3.png"))
    raw = job / "gen" / "raw.png"
    if raw.exists():
        candidates.append(raw)
    if not candidates:
        print("NO OUTPUT", stem)
        return False
    cand = Image.open(candidates[0]).convert("RGB").resize((SIZE, SIZE))
    b = np.asarray(base, dtype=np.float32)
    c = np.asarray(cand, dtype=np.float32)
    m = np.asarray(mask, dtype=np.float32) / 255.0
    locked = m < 0.15
    if not locked.any():
        print("bad mask")
        return False
    mae = np.abs(b[locked] - c[locked]).mean()
    ok = mae <= max_mae
    print(f"{stem}: outside-mask MAE={mae:.3f}  {'PASS' if ok else 'FAIL'} (max {max_mae})")
    return ok

# Local SD 1.5 inpainting (low VRAM) — no external APIs
LOCAL_INPAINT_MODEL = "runwayml/stable-diffusion-inpainting"
INFER_SIZE_DEFAULT = 512  # SD1.5 native; 1024 would OOM on many laptop GPUs
STEPS_DEFAULT = 28
GUIDANCE_DEFAULT = 7.5
NEGATIVE_DEFAULT = (
    "text, watermark, logo, banner, label, typography, purple sky, sunset sky, "
    "ocean, sea, beach, mountains, landscape, neon, cartoon, anime, blurry, "
    "human hands, extra cutlery, second plate, floating garnish, white ceramic plate, "
    "glossy plate, clay pot, ketsi, oversaturated"
)

VESSEL_WARE = {
    "V1": "flat plate",
    "V2": "deep bowl",
    "V3": "small ramekin",
    "C1": "cup and saucer",
}

# Brand / project / UI leak tokens — stripped before any model call
PROMPT_BANNED = [
    r"mesti\s*delivery",
    r"mestidelivery",
    r"mestigo",
    r"luizastan",
    r"sunset",
    r"restaurants?",
    r"\bui\b",
    r"pipeline\s*v\d+",
    r"gemini(?:[-\s]?code)?",
    r"stability(?:\s*ai)?",
    r"replicate",
    r"fal\.?ai",
    r"393\s*px",
    r"viewport",
    r"dark[-\s]?mode",
    r"native\s+mobile(?:\s+app)?",
    r"mobile\s+app",
    r"menu\s+grid",
    r"system\s+prompt",
    r"alpha[-\s]?mask",
    r"base\s+template",
    r"inpainting\s+pipeline",
]

_PIPE = None  # lazy singleton StableDiffusionInpaintPipeline


def load_dotenv_file(path: Path) -> None:
    """Load KEY=VALUE from .env into os.environ (no overwrite if already set)."""
    if not path.exists():
        return
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        key = key.strip()
        val = val.strip().strip("'").strip('"')
        if key and key not in os.environ:
            os.environ[key] = val


def load_manifest() -> dict:
    return json.loads(MANIFEST.read_text(encoding="utf-8"))


def discover_jobs(stem: str = "") -> list[dict]:
    """All prepared job folders under BATCH_ROOT (supports ~80 autonomous items)."""
    items: list[dict] = []
    if not BATCH_ROOT.exists():
        return items
    for d in sorted(BATCH_ROOT.iterdir()):
        if not d.is_dir():
            continue
        meta_p = d / "META.json"
        if not meta_p.exists():
            continue
        try:
            meta = json.loads(meta_p.read_text(encoding="utf-8"))
        except Exception:
            continue
        meta.setdefault("stem", d.name)
        if stem and meta["stem"] != stem:
            continue
        items.append(meta)
    if items:
        return items
    # Fallback to manifest if packages not expanded yet
    data = load_manifest()
    items = list(data.get("items") or [])
    if stem:
        items = [i for i in items if i.get("stem") == stem]
    return items


def sanitize_prompt_text(text: str) -> str:
    """Hard scrub brand / project / UI leaks from any prompt fragment."""
    if not text:
        return ""
    out = text
    for pat in PROMPT_BANNED:
        out = re.sub(pat, " ", out, flags=re.IGNORECASE)
    out = re.sub(r"\bsunset[-\s_]?\d+\b", " ", out, flags=re.IGNORECASE)
    out = re.sub(r"[ \t]{2,}", " ", out)
    out = re.sub(r"\n{3,}", "\n\n", out)
    return out.strip(" \t,;:-")


def _dish_phrase(job: Path, item: dict) -> str:
    """Dry English dish description — no brands, no UI language."""
    en = sanitize_prompt_text(item.get("en") or "")
    subject_raw = ""
    subject_p = job / "subject.txt"
    if subject_p.exists():
        subject_raw = subject_p.read_text(encoding="utf-8")
    elif item.get("subject"):
        subject_raw = item["subject"]
    subject = sanitize_prompt_text(subject_raw)

    if subject:
        subject = re.sub(
            r"(?:,?\s*)?(?:served\s+(?:on|in)\s+[^.]*|"
            r"on a (?:matte\s+)?(?:graphite\s+)?(?:flat\s+)?plate|"
            r"in a (?:deep\s+)?(?:matte\s+)?(?:graphite\s+)?bowl|"
            r"matte\s+graphite|zero gloss|absolutely matte|"
            r"plate stays fully matte|bowl (?:is )?completely matte(?:\s+charcoal)?|"
            r"no clay pot|no rustic clayware|no extra sides)\.?",
            "",
            subject,
            flags=re.IGNORECASE,
        )
        subject = re.sub(r"\b(?:flat plate|deep bowl)\b", "", subject, flags=re.IGNORECASE)
        subject = re.sub(r"\s+,", ",", subject)
        subject = re.sub(r"[ \t]{2,}", " ", subject)
        subject = re.sub(r"\.\s*\.", ".", subject).strip(" ,;.")
        if len(subject) > 280:
            subject = subject[:280].rsplit(" ", 1)[0]
        if en and subject.lower().startswith(en.lower()):
            return subject
        if en and subject and subject.lower() != en.lower():
            return f"{en} — {subject}"
        return subject or en
    return en or "fresh cooked food"


def build_inpaint_prompt(job: Path, item: dict) -> str:
    """Strict dry prompt: dishware + food only. No system / project docs."""
    ware = VESSEL_WARE.get(item.get("vessel", "V1"), "flat plate")
    dish = sanitize_prompt_text(_dish_phrase(job, item))
    prompt = (
        f"A single dark charcoal Matte Graphite {ware} inside the center, containing {dish}. "
        "Realistic fresh cooked food with natural specular highlights on sauce and meat. "
        "Absolute matte plate surface, neutral lighting, photoreal food photography."
    )
    prompt = sanitize_prompt_text(prompt)
    if re.search(r"sunset|restaurant|mesti|\bui\b", prompt, flags=re.IGNORECASE):
        dish = sanitize_prompt_text(item.get("en") or "cooked dish")
        prompt = (
            f"A single dark charcoal Matte Graphite {ware} inside the center, containing {dish}. "
            "Realistic fresh cooked food with natural specular highlights on sauce and meat. "
            "Absolute matte plate surface, neutral lighting, photoreal food photography."
        )
    return prompt


def _hard_mask_image(mask_path: Path, size: int) -> Image.Image:
    """Binary L mask: white=inpaint, black=preserve."""
    m = Image.open(mask_path).convert("L").resize((size, size), Image.Resampling.NEAREST)
    arr = np.asarray(m)
    return Image.fromarray(((arr >= 128) * 255).astype(np.uint8), mode="L")


def _lock_outside_mask(base: Image.Image, painted: Image.Image, mask_l: Image.Image) -> Image.Image:
    """Force every non-mask pixel to stay identical to the locked base."""
    b = np.asarray(base.convert("RGB"), dtype=np.float32)
    p = np.asarray(painted.convert("RGB").resize(base.size, Image.Resampling.LANCZOS), dtype=np.float32)
    m = np.asarray(mask_l.convert("L").resize(base.size, Image.Resampling.NEAREST), dtype=np.float32) / 255.0
    m = m[..., None]
    out = b * (1.0 - m) + p * m
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), mode="RGB")


def require_cuda() -> None:
    """Hard-fail unless a CUDA-enabled PyTorch build is active. Never fall back to CPU."""
    try:
        import torch
    except ImportError as exc:
        raise SystemExit(
            "CRITICAL ERROR: PyTorch is not installed.\n"
            "Uninstall any CPU build, then install CUDA torch (Python 3.10–3.12):\n"
            "  pip uninstall -y torch torchvision torchaudio xformers\n"
            "  py -3.12 -m pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121\n"
            f"Original error: {exc}"
        ) from exc

    if not torch.cuda.is_available():
        ver = getattr(torch, "__version__", "?")
        py = f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
        raise SystemExit(
            "CRITICAL ERROR: torch.cuda.is_available() is False — refusing CPU inference.\n"
            f"  torch={ver}  python={py}\n"
            "This usually means a CPU-only PyTorch wheel is installed (common on Python 3.14).\n"
            "Fix (PowerShell):\n"
            "  pip uninstall -y torch torchvision torchaudio xformers\n"
            "  # Use Python 3.12 (CUDA wheels are not published for 3.14 yet)\n"
            "  py -3.12 -m pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121\n"
            "  py -3.12 -m pip install diffusers transformers accelerate safetensors\n"
            "  py -3.12 -m pip install xformers\n"
            '  py -3.12 -c "import torch; print(torch.__version__, torch.cuda.is_available(), torch.cuda.get_device_name(0))"\n'
            "Then re-run:\n"
            "  py -3.12 scripts/sunset_v3_hot_batch.py generate --force"
        )
    print(
        f"CUDA OK: {torch.cuda.get_device_name(0)}  "
        f"VRAM={torch.cuda.get_device_properties(0).total_memory / (1024**3):.1f} GB  "
        f"torch={torch.__version__}",
        flush=True,
    )


def get_inpaint_pipe():
    """Load SD1.5 inpaint once on CUDA with low-VRAM opts. Never uses CPU."""
    global _PIPE
    if _PIPE is not None:
        return _PIPE

    require_cuda()

    try:
        import torch
        from diffusers import StableDiffusionInpaintPipeline
    except ImportError as exc:
        raise SystemExit(
            "CRITICAL ERROR: Missing diffusers stack.\n"
            "  pip install diffusers transformers accelerate safetensors\n"
            f"Original error: {exc}"
        ) from exc

    dtype = torch.float16
    print(f"Loading {LOCAL_INPAINT_MODEL} dtype={dtype} on CUDA …", flush=True)
    pipe = StableDiffusionInpaintPipeline.from_pretrained(
        LOCAL_INPAINT_MODEL,
        torch_dtype=dtype,
        safety_checker=None,
        requires_safety_checker=False,
    )

    # Explicit GPU residency
    pipe = pipe.to("cuda")
    print("  + pipe.to('cuda')", flush=True)

    # Low-VRAM optimizations
    try:
        pipe.enable_attention_slicing()
        print("  + attention_slicing", flush=True)
    except Exception as exc:
        print(f"  ! attention_slicing unavailable: {exc}", flush=True)

    try:
        pipe.enable_vae_slicing()
        print("  + vae_slicing", flush=True)
    except Exception:
        pass

    try:
        # Inactive modules on CPU RAM; active compute stays on the discrete GPU
        pipe.enable_model_cpu_offload()
        print("  + model_cpu_offload", flush=True)
    except Exception as exc:
        print(f"  ! model_cpu_offload unavailable (staying fully on CUDA): {exc}", flush=True)
        pipe = pipe.to("cuda")

    try:
        pipe.enable_xformers_memory_efficient_attention()
        print("  + xformers", flush=True)
    except Exception as exc:
        print(f"  ! xformers skipped: {exc}", flush=True)

    _PIPE = pipe
    return pipe


def inpaint_job(
    job: Path,
    item: dict,
    *,
    steps: int = STEPS_DEFAULT,
    guidance: float = GUIDANCE_DEFAULT,
    infer_size: int = INFER_SIZE_DEFAULT,
    seed: int | None = None,
) -> Path:
    """Local SD1.5 inpaint → gen/raw.png (background pixels hard-locked)."""
    import torch

    base_path = job / "base.png"
    mask_path = job / "mask.png"
    out = job / "gen" / "raw.png"
    if not base_path.exists() or not mask_path.exists():
        raise FileNotFoundError(f"missing base/mask in {job}")

    (job / "gen").mkdir(parents=True, exist_ok=True)
    prompt = build_inpaint_prompt(job, item)
    negative = sanitize_prompt_text(NEGATIVE_DEFAULT)
    (job / "gen" / "prompt_sent.txt").write_text(
        prompt + "\n\nNEGATIVE:\n" + negative + "\n",
        encoding="utf-8",
    )

    base_full = Image.open(base_path).convert("RGB").resize((SIZE, SIZE), Image.Resampling.LANCZOS)
    mask_full = _hard_mask_image(mask_path, SIZE)
    mask_full.save(job / "gen" / "_mask_api.png")

    # Run at SD1.5-native resolution to stay under laptop VRAM
    infer = max(256, int(infer_size))
    if infer % 8:
        infer -= infer % 8
    image_small = base_full.resize((infer, infer), Image.Resampling.LANCZOS)
    mask_small = _hard_mask_image(mask_path, infer)

    pipe = get_inpaint_pipe()
    generator = None
    if seed is not None:
        # CPU generator is required with enable_model_cpu_offload()
        generator = torch.Generator(device="cpu").manual_seed(int(seed))

    t0 = time.time()
    result = pipe(
        prompt=prompt,
        negative_prompt=negative,
        image=image_small,
        mask_image=mask_small,
        height=infer,
        width=infer,
        num_inference_steps=int(steps),
        guidance_scale=float(guidance),
        generator=generator,
    ).images[0]
    elapsed = time.time() - t0

    painted_full = result.convert("RGB").resize((SIZE, SIZE), Image.Resampling.LANCZOS)
    final = _lock_outside_mask(base_full, painted_full, mask_full)
    final.save(out, "PNG")

    (job / "gen" / "last_response.json").write_text(
        json.dumps(
            {
                "provider": "local-diffusers",
                "model": LOCAL_INPAINT_MODEL,
                "dtype": str(getattr(pipe, "dtype", "unknown")),
                "infer_size": infer,
                "output_size": SIZE,
                "steps": steps,
                "guidance": guidance,
                "seed": seed,
                "elapsed_s": round(elapsed, 2),
                "prompt": prompt,
                "negative": negative,
                "bytes": out.stat().st_size,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    # Free transient CUDA cache between dishes (keeps long 80-item runs alive)
    try:
        import gc

        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
    except Exception:
        pass

    return out


def generate_jobs(
    stem: str = "",
    force: bool = False,
    steps: int = STEPS_DEFAULT,
    guidance: float = GUIDANCE_DEFAULT,
    infer_size: int = INFER_SIZE_DEFAULT,
    seed: int | None = None,
) -> None:
    raise SystemExit(
        "Local PyTorch generate is retired. Use:\n"
        "  python scripts/sunset_api_generator.py --all --force\n"
        "See sunset_generation_guidelines.md"
    )


def composite_ready() -> None:
    """Seat rembg cutouts from gen/raw.png onto locked BG."""
    import repair_sunset_on_locked_vessels as R  # local helper

    items = discover_jobs()
    for item in items:
        stem = item["stem"]
        vessel = item.get("vessel") or VESSEL_MAP.get(stem, "V1")
        src = BATCH_ROOT / stem / "gen" / "raw.png"
        if not src.exists():
            print("SKIP (no gen)", stem)
            continue
        cut = R.trim(R.rembg_rgba(Image.open(src).convert("RGB")))
        arr = np.array(cut, copy=True)
        rgb = arr[..., :3].astype(np.float32)
        a = arr[..., 3]
        lum = rgb.mean(-1)
        sat = rgb.max(-1) - rgb.min(-1)
        kill = (a > 40) & (lum > 155) & (sat < 38)
        arr[kill, 3] = 0
        cut = R.trim(Image.fromarray(arr))
        target = target_diameter_px(vessel)
        bb = cut.getchannel("A").getbbox()
        if not bb:
            print("EMPTY", stem)
            continue
        sw = bb[2] - bb[0]
        scale = target / max(sw, 1)
        nw = max(1, int(cut.width * scale))
        nh = max(1, int(cut.height * scale))
        cut = cut.resize((nw, nh), Image.Resampling.LANCZOS)
        canvas = Image.open(bg_path_for(stem)).convert("RGB").resize((SIZE, SIZE), Image.Resampling.LANCZOS)
        x = (SIZE - nw) // 2
        y = int(SIZE * VESSEL_CY[vessel] - nh / 2)
        y = max(36, min(SIZE - nh - 36, y))
        sh = R.soft_shadow(int(nw * 0.90), max(28, int(nh * 0.16)))
        canvas.paste(sh, (x + (nw - sh.width) // 2, y + nh - int(sh.height * 0.55)), sh)
        canvas.paste(cut, (x, y), cut)
        out_name = f"{stem.replace('-', '_')}_V3.png"
        out_job = BATCH_ROOT / stem / "out" / out_name
        out_assets = OUT_DIR / out_name
        canvas.save(out_job, "PNG")
        canvas.save(out_assets, "PNG")
        print("OK", stem, "→", out_job)


def main() -> None:
    ap = argparse.ArgumentParser(
        description="Sunset V3 menu asset pipeline (local SD1.5 inpaint)"
    )
    ap.add_argument(
        "cmd",
        choices=["prepare", "generate", "status", "composite", "qa"],
        nargs="?",
        default="prepare",
    )
    ap.add_argument("--stem", default="", help="Process a single stem only")
    ap.add_argument("--force", action="store_true", help="Regenerate even if gen/raw.png exists")
    ap.add_argument("--steps", type=int, default=STEPS_DEFAULT, help="Diffusion steps (25–30 recommended)")
    ap.add_argument("--guidance", type=float, default=GUIDANCE_DEFAULT, help="CFG guidance scale")
    ap.add_argument(
        "--infer-size",
        type=int,
        default=INFER_SIZE_DEFAULT,
        help="Inpaint resolution (512 keeps VRAM low; model is SD1.5)",
    )
    ap.add_argument("--seed", type=int, default=None, help="Optional RNG seed")
    args = ap.parse_args()
    if args.cmd == "prepare":
        prepare_jobs()
    elif args.cmd == "generate":
        generate_jobs(
            stem=args.stem,
            force=args.force,
            steps=args.steps,
            guidance=args.guidance,
            infer_size=args.infer_size,
            seed=args.seed,
        )
    elif args.cmd == "status":
        status()
    elif args.cmd == "composite":
        composite_ready()
    elif args.cmd == "qa":
        items = discover_jobs(args.stem)
        stems = [i["stem"] for i in items] if items else ([args.stem] if args.stem else [])
        for s in stems:
            qa_stem(s)


if __name__ == "__main__":
    main()
