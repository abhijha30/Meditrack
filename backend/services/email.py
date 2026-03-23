"""
Email notification service using Supabase's built-in email
or any SMTP provider. Configure SMTP settings in .env to enable.
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os


def send_new_record_email(patient_email: str, patient_name: str, doctor_name: str, hospital: str, visit_date: str):
    """Notify patient when a new record is uploaded by admin."""
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASS")
    from_email = os.getenv("FROM_EMAIL", smtp_user)

    if not all([smtp_host, smtp_user, smtp_pass]):
        print("SMTP not configured — skipping email notification")
        return

    subject = "New medical record added — MediTrack"
    html = f"""
    <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #0F6E56;">New record added to MediTrack</h2>
      <p>Hi {patient_name},</p>
      <p>A new health record has been uploaded for you:</p>
      <table style="width:100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="color:#666; padding:6px 0;">Doctor</td><td style="font-weight:500;">{doctor_name}</td></tr>
        <tr><td style="color:#666; padding:6px 0;">Hospital</td><td style="font-weight:500;">{hospital}</td></tr>
        <tr><td style="color:#666; padding:6px 0;">Date</td><td style="font-weight:500;">{visit_date}</td></tr>
      </table>
      <a href="{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/dashboard"
         style="display:inline-block; background:#0F6E56; color:#fff; padding:10px 24px; border-radius:8px; text-decoration:none; margin-top:8px;">
        View your records
      </a>
      <p style="color:#999; font-size:12px; margin-top:24px;">MediTrack — Your health records, always with you</p>
    </div>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = from_email
    msg["To"] = patient_email
    msg.attach(MIMEText(html, "html"))

    try:
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.sendmail(from_email, patient_email, msg.as_string())
        print(f"Email sent to {patient_email}")
    except Exception as e:
        print(f"Email failed: {e}")
