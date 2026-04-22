import pyotp
import qrcode
import base64
from io import BytesIO


def generate_totp_secret():
    """
    Generate a new random secret key for TOTP.
    This key is stored in the user's account and
    shared with the Microsoft Authenticator app via QR code.
    """
    return pyotp.random_base32()


def get_totp_uri(user, secret):
    """
    Generate the otpauth URI that gets encoded into the QR code.
    Microsoft Authenticator reads this URI when scanning.

    Format:
    otpauth://totp/SafeNest Travel:user@email.com?secret=SECRET&issuer=SafeNest Travel
    """
    totp = pyotp.TOTP(secret)
    return totp.provisioning_uri(
        name        = user.email,
        issuer_name = "SafeNest Travel"
    )


def generate_qr_code_base64(uri):
    """
    Generate a QR code image from the URI.
    Returns a base64 string that can be used as an img src.

    Example usage in frontend:
    <img src={qr_code} />
    """
    qr = qrcode.QRCode(
        version         = 1,
        error_correction= qrcode.constants.ERROR_CORRECT_L,
        box_size        = 10,
        border          = 4,
    )
    qr.add_data(uri)
    qr.make(fit=True)
    img = qr.make_image(
        fill_color = "black",
        back_color = "white"
    )

    buffer = BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)

    img_base64 = base64.b64encode(buffer.read()).decode("utf-8")
    return "data:image/png;base64," + img_base64


def verify_totp_code(secret, code):
    """
    Verify a TOTP code against the stored secret.

    valid_window=1 means we accept codes from:
    - 30 seconds before current time
    - Current 30 second window
    - 30 seconds after current time

    This handles slight clock differences between
    the user's phone and the server.

    Returns True if valid, False if not.
    """
    if not secret or not code:
        return False

    totp = pyotp.TOTP(secret)
    return totp.verify(str(code).strip(), valid_window=1)


def get_current_totp(secret):
    """
    Get the current TOTP code for a secret.
    Useful for testing purposes only.
    """
    if not secret:
        return None
    totp = pyotp.TOTP(secret)
    return totp.now()