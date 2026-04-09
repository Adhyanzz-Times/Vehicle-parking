from email import encoders
from email.mime.base import MIMEBase
from email.mime.multipart import MIMEMultipart 
from email.mime.text import MIMEText
import os
import smtplib
from flask import current_app as app

SMTP_SERVER_HOST = "localhost"
SMTP_SERVER_PORT = 1025
SENDER_ADDRESS = "fastlogistics@donotreply.in"
SENDER_PASSWORD = ""

def send_email(to_address, subject, message, content="html", attachment_file=None):
    try:
        msg = MIMEMultipart()
        msg['From'] = SENDER_ADDRESS
        msg['To'] = to_address
        msg['Subject'] = subject

        if content == "html":
            msg.attach(MIMEText(message, "html"))
        else:
            msg.attach(MIMEText(message, "plain"))

        if attachment_file:
            with open(attachment_file, 'rb') as attachment:
                part = MIMEBase("application", "octet-stream")
                part.set_payload(attachment.read())
            encoders.encode_base64(part)
            part.add_header("Content-Disposition", f"attachment; filename={attachment_file}")
            msg.attach(part)

        s = smtplib.SMTP(host=SMTP_SERVER_HOST, port=SMTP_SERVER_PORT)
        s.send_message(msg)
        s.quit()
        app.logger.info(f"Email sent to {to_address}")
        return True
    except Exception as e:
        app.logger.error(f"Failed to send email to {to_address}: {str(e)}")
        return False