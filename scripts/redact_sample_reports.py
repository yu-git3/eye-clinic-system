from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, JpegImagePlugin  # noqa: F401

ROOT = Path(__file__).resolve().parents[1]
FONT_CANDIDATES = [
    "/System/Library/Fonts/PingFang.ttc",
    "/System/Library/Fonts/Supplemental/Songti.ttc",
]

def font(size: int):
    for candidate in FONT_CANDIDATES:
        if Path(candidate).exists():
            return ImageFont.truetype(candidate, size=size)
    return ImageFont.load_default()

def redact_topography():
    inputs = sorted((ROOT / "tmp/pdfs/topography").glob("page-*.png"))
    pages = []
    for source in inputs:
        image = Image.open(source).convert("RGB")
        draw = ImageDraw.Draw(image)
        draw.rectangle((0, 0, image.width, 225), fill="white")
        draw.text((185, 34), "南京医科大学眼科医院（汉中路院区）", fill="black", font=font(28))
        draw.text((340, 76), "角膜地形图检查报告", fill="black", font=font(21))
        draw.text((32, 112), "姓名：原型患者   性别：女   年龄：14   检查号：DEMO20260802", fill="black", font=font(18))
        draw.text((105, 171), "DEMO20260802，原型患者", fill="black", font=font(17))
        pages.append(image)
    out = ROOT / "public/sample-reports/topography-desensitized.pdf"
    pages[0].save(out, save_all=True, append_images=pages[1:], resolution=120.0)

def redact_biometry():
    source = ROOT / "tmp/pdfs/biometry/page-1.png"
    image = Image.open(source).convert("RGB")
    draw = ImageDraw.Draw(image)
    # 原报告的患者与检查信息分布到约 190px，整段覆盖后再绘制脱敏页眉。
    draw.rectangle((0, 0, image.width, 198), fill="white")
    draw.text((185, 30), "南京医科大学眼科医院（汉中路院区）", fill="black", font=font(28))
    draw.text((350, 70), "眼轴测量检查报告", fill="black", font=font(21))
    draw.text((36, 108), "姓名：原型患者   年龄：14   检查号：DEMO20260802", fill="black", font=font(18))
    draw.text((36, 136), "病历号：DEMO00009340   检查日期：2026年08月02日", fill="black", font=font(18))
    draw.rectangle((0, image.height - 145, image.width, image.height), fill="white")
    draw.text((36, image.height - 105), "<仅供原型演示，不作为证明材料>  2026-08-02 09:18", fill="black", font=font(17))
    draw.text((650, image.height - 105), "检查者：示例医师", fill="black", font=font(17))
    out = ROOT / "public/sample-reports/biometry-desensitized.pdf"
    image.save(out, resolution=120.0)

if __name__ == "__main__":
    redact_topography()
    redact_biometry()
