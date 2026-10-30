"""Erzeugt die QR-Codes (PNG, Fehlerkorrektur M, Ruhezone 4 Module) für alle Übungen in qr/
und prüft, ob sie sich wieder lesen lassen.
Aufruf: python3 werkzeuge/qr_erzeugen.py
Benötigt: segno  ODER  opencv-python (cv2) – je nachdem, was installiert ist."""
from pathlib import Path

BASIS = "https://klawittersven-arch.github.io/3BFP2_KB2_Notfall/"
IDS = ["ab1a", "ab1b", "ab2a", "ab2c"]
QR = Path(__file__).resolve().parent.parent / "qr"
QR.mkdir(exist_ok=True)


def mit_segno(url, ziel):
    import segno
    segno.make(url, error="m", micro=False).save(str(ziel), scale=16, border=4)


def mit_opencv(url, ziel):
    import cv2
    p = cv2.QRCodeEncoder_Params()
    p.correction_level = cv2.QRCodeEncoder_CORRECT_LEVEL_M
    q = cv2.QRCodeEncoder.create(p).encode(url)
    q = cv2.copyMakeBorder(q, 4, 4, 4, 4, cv2.BORDER_CONSTANT, value=255)
    s = max(1, 680 // q.shape[0])
    cv2.imwrite(str(ziel), cv2.resize(q, (q.shape[1] * s, q.shape[0] * s), interpolation=cv2.INTER_NEAREST))


def pruefen(ziel):
    try:
        import cv2
    except ImportError:
        return None
    wert, _, _ = cv2.QRCodeDetector().detectAndDecode(cv2.imread(str(ziel)))
    return wert


for i in IDS:
    url = BASIS + i + ".html"
    ziel = QR / f"qr_{i}.png"
    try:
        mit_segno(url, ziel)
    except ImportError:
        mit_opencv(url, ziel)
    gelesen = pruefen(ziel)
    status = "geprüft ✓" if gelesen == url else ("nicht geprüft" if gelesen is None else f"FEHLER: {gelesen!r}")
    print(f"{ziel.name}: {url}  [{status}]")
