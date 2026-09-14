import os
import smtplib
from email.message import EmailMessage
from typing import Optional
from app.core.logging import logger

class EmailService:
    def __init__(self):
        self.smtp_host = os.environ.get("SMTP_HOST", "smtp.gmail.com")
        self.smtp_port = int(os.environ.get("SMTP_PORT", 587))
        self.smtp_user = os.environ.get("SMTP_USER", "")
        self.smtp_password = os.environ.get("SMTP_PASSWORD", "")
        self.sender_email = os.environ.get("SENDER_EMAIL", "noreply@lingora.ai")

    def _send_email(self, to_email: str, subject: str, html_content: str):
        if not self.smtp_user or not self.smtp_password:
            logger.warning(f"SMTP credentials not configured. Mock sending email to {to_email}: {subject}")
            return
            
        try:
            msg = EmailMessage()
            msg.set_content("Please enable HTML to view this message.")
            msg.add_alternative(html_content, subtype='html')
            msg['Subject'] = subject
            msg['From'] = self.sender_email
            msg['To'] = to_email

            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_password)
                server.send_message(msg)
            logger.info(f"Email sent successfully to {to_email}")
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}")

    def send_job_completed(self, to_email: str, job_id: str, file_name: str, result_url: Optional[str] = None):
        subject = f"Your translation is ready: {file_name}"
        html_content = f"""
        <html>
            <body style="font-family: sans-serif; color: #333;">
                <h2>Your Translation is Ready</h2>
                <p>Great news! The translation for <b>{file_name}</b> has completed successfully.</p>
                <p>Job ID: {job_id}</p>
                <p>
                    <a href="{result_url or 'https://app.lingora.ai/dashboard'}" style="display: inline-block; padding: 10px 20px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px;">
                        View Translation
                    </a>
                </p>
                <p>Thanks,<br>The OneClick Translator AI Team</p>
            </body>
        </html>
        """
        self._send_email(to_email, subject, html_content)

    def send_job_failed(self, to_email: str, job_id: str, file_name: str, error: str):
        subject = f"Translation Failed: {file_name}"
        html_content = f"""
        <html>
            <body style="font-family: sans-serif; color: #333;">
                <h2>Translation Failed</h2>
                <p>We encountered an error while translating <b>{file_name}</b>.</p>
                <p>Job ID: {job_id}</p>
                <p><b>Error Details:</b> {error}</p>
                <p>Please log in to your dashboard to retry or contact support if the issue persists.</p>
                <p>Thanks,<br>The OneClick Translator AI Team</p>
            </body>
        </html>
        """
        self._send_email(to_email, subject, html_content)
