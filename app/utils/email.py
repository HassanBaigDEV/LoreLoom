# app/utils/email.py
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from app.config.config import settings


def send_verification_email(email_to: str, token: str):
    verification_url = f"{settings.EMAIL_VERIFICATION_URL}/{token}"
    message = MIMEMultipart()
    message["From"] = settings.EMAIL_FROM
    message["To"] = email_to
    message["Subject"] = "Verify Your Email"

    body = f"""
    <p>Welcome! Please click the link below to verify your email:</p>
    <p><a href="{verification_url}">Verify Email</a></p>
    <p>If you did not sign up for this account, please ignore this email.</p>
    """
    message.attach(MIMEText(body, "html"))

    try:
        with smtplib.SMTP(
            settings.MAILTRAP_SMTP_SERVER, settings.MAILTRAP_PORT
        ) as server:
            server.login(settings.MAILTRAP_USERNAME, settings.MAILTRAP_PASSWORD)
            server.sendmail(settings.EMAIL_FROM, email_to, message.as_string())
            print("Verification email sent!")
    except Exception as e:
        print(f"Error sending email: {e}")
