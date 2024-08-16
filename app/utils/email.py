# app/utils/email.py
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from app.config.settings import settings


def send_verification_email(email_to: str, token: str):
    verification_url = f"{settings.EMAIL_VERIFICATION_URL}/{token}"
    message = MIMEMultipart()
    message["From"] = settings.EMAIL_FROM
    message["To"] = email_to
    message["Subject"] = "Verify Your Email"

    body = f"""
    <p>Hi,</p>
    <p>
    Thanks for creating an account with us. Please verify your email address by
    clicking the button below.
    </p>
    <table
    role="presentation"
    border="0"
    cellpadding="0"
    cellspacing="0"
    class="btn btn-primary"
    >
    <tbody>
        <tr>
        <td align="left">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0">
            <tbody>
                <tr>
                <td>
                    <a href="{verification_url}" target="_blank">Verify email address</a>
                </td>
                </tr>
            </tbody>
            </table>
        </td>
        </tr>
    </tbody>
    </table>
    <p>Good luck! Hope it works.</p>
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


def send_password_reset_email(email_to: str, token: str):
    reset_url = f"{settings.PASSWORD_RESET_URL}/{token}"
    message = MIMEMultipart()
    message["From"] = settings.EMAIL_FROM
    message["To"] = email_to
    message["Subject"] = "Password Reset Request"

    body = f"""
    <p>Click the link below to reset your password:</p>
    <p><a href="{reset_url}">Reset Password</a></p>
    <p>If you did not request a password reset, please ignore this email.</p>
    """
    message.attach(MIMEText(body, "html"))

    try:
        with smtplib.SMTP(
            settings.MAILTRAP_SMTP_SERVER, settings.MAILTRAP_PORT
        ) as server:
            server.login(settings.MAILTRAP_USERNAME, settings.MAILTRAP_PASSWORD)
            server.sendmail(settings.EMAIL_FROM, email_to, message.as_string())
            print("Password reset email sent!")
    except Exception as e:
        print(f"Error sending email: {e}")
