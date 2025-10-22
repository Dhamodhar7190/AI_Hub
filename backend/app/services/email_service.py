import logging
import boto3
from botocore.exceptions import ClientError
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """Email service for sending OTPs and notifications using AWS SES"""

    def __init__(self):
        self.use_ses = settings.USE_SES
        self.from_email = settings.FROM_EMAIL

        # Initialize AWS SES client if enabled
        if self.use_ses:
            self.ses_client = boto3.client(
                'ses',
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_REGION
            )
        
    async def send_otp_email(self, to_email: str, otp_code: str, username: str) -> dict:
        """Send OTP via email or display in console for development"""

        subject = "Your OTP for FARM"
        html_body = f"""
        <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px;">
                    <h2 style="color: #333;">FARM - OTP Verification</h2>
                    <p>Hello {username},</p>
                    <p>Your OTP code for login is:</p>
                    <div style="background-color: #fff; padding: 15px; border-radius: 5px; text-align: center; font-size: 24px; font-weight: bold; color: #ff6b35; letter-spacing: 5px;">
                        {otp_code}
                    </div>
                    <p style="color: #666; margin-top: 15px;">This code is valid for {settings.OTP_EXPIRE_MINUTES} minutes.</p>
                    <p style="color: #999; font-size: 12px;">If you didn't request this code, please ignore this email.</p>
                </div>
            </body>
        </html>
        """

        text_body = f"Your OTP code is: {otp_code}. Valid for {settings.OTP_EXPIRE_MINUTES} minutes."

        if self.use_ses:
            ses_result = await self._send_via_ses(
                to_email=to_email,
                subject=subject,
                html_content=html_body,
                text_content=text_body
            )
            # Add OTP info for testing/development even when using SES
            ses_result.update({
                "otp_code": otp_code if settings.DEBUG else "",  # Only return OTP in debug mode
                "expires_in_minutes": settings.OTP_EXPIRE_MINUTES
            })
            return ses_result
        else:
            # For development - display OTP in console and return it
            logger.info(f"=== OTP EMAIL FOR {username} ({to_email}) ===")
            logger.info(f"OTP Code: {otp_code}")
            logger.info(f"Valid for: {settings.OTP_EXPIRE_MINUTES} minutes")
            logger.info("=" * 50)

            # Also print to console for visibility
            print(f"\n🔐 OTP for {username}: {otp_code}")
            print(f"⏱️  Valid for {settings.OTP_EXPIRE_MINUTES} minutes\n")

            return {
                "status": "success",
                "message": "OTP sent successfully",
                "otp_code": otp_code,  # Return OTP for development
                "expires_in_minutes": settings.OTP_EXPIRE_MINUTES
            }
    
    async def send_notification_email(
        self,
        to_email: str,
        subject: str,
        content: str
    ) -> dict:
        """Send notification email"""

        if self.use_ses:
            return await self._send_via_ses(
                to_email=to_email,
                subject=subject,
                html_content=content,
                text_content=content
            )
        else:
            # For development - log notification
            logger.info(f"=== NOTIFICATION EMAIL ===")
            logger.info(f"To: {to_email}")
            logger.info(f"Subject: {subject}")
            logger.info(f"Content: {content}")
            logger.info("=" * 30)

            print(f"\n📧 Email to {to_email}")
            print(f"Subject: {subject}")
            print(f"Content: {content}\n")

            return {
                "status": "success",
                "message": "Notification sent successfully"
            }
    
    async def _send_via_ses(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: str
    ) -> dict:
        """Send email via AWS SES"""
        try:
            response = self.ses_client.send_email(
                Source=self.from_email,
                Destination={
                    'ToAddresses': [to_email]
                },
                Message={
                    'Subject': {
                        'Data': subject,
                        'Charset': 'UTF-8'
                    },
                    'Body': {
                        'Html': {
                            'Data': html_content,
                            'Charset': 'UTF-8'
                        },
                        'Text': {
                            'Data': text_content,
                            'Charset': 'UTF-8'
                        }
                    }
                }
            )

            logger.info(f"✅ Email sent successfully to {to_email}. MessageId: {response['MessageId']}")
            print(f"\n✅ Email sent via AWS SES to: {to_email}")
            print(f"   MessageId: {response['MessageId']}\n")

            return {
                "status": "success",
                "message": "Email sent successfully",
                "message_id": response['MessageId']
            }

        except ClientError as e:
            error_message = e.response['Error']['Message']
            logger.error(f"Failed to send email via AWS SES: {error_message}")
            return {
                "status": "error",
                "message": f"Failed to send email: {error_message}"
            }
        except Exception as e:
            logger.error(f"Unexpected error sending email: {str(e)}")
            return {
                "status": "error",
                "message": f"Failed to send email: {str(e)}"
            }
    
    async def notify_user_approval(self, user_email: str, username: str) -> dict:
        """Notify user of account approval"""
        return await self.send_notification_email(
            to_email=user_email,
            subject="Account Approved - FARM",
            content=f"""
            <h2>Welcome to FARM!</h2>
            <p>Hello {username},</p>
            <p>Your account has been approved and is now active.</p>
            <p>You can now login to FARM and start exploring agents.</p>
            <p>Best regards,<br>FARM Team</p>
            """
        )
    
    async def notify_admin_new_user(
        self,
        admin_email: str,
        new_username: str,
        new_user_email: str
    ) -> dict:
        """Notify admin of new user registration"""
        return await self.send_notification_email(
            to_email=admin_email,
            subject="New User Registration - FARM",
            content=f"""
            <h2>New User Registration</h2>
            <p>A new user has registered and needs approval:</p>
            <ul>
                <li><strong>Username:</strong> {new_username}</li>
                <li><strong>Email:</strong> {new_user_email}</li>
            </ul>
            <p>Please review and approve the user in the admin panel.</p>
            <p>Best regards,<br>FARM System</p>
            """
        )
    
    async def notify_agent_status(
        self,
        user_email: str,
        agent_name: str,
        status: str,
        username: str
    ) -> dict:
        """Notify user of agent approval/rejection"""
        status_text = "approved" if status == "approved" else "rejected"
        return await self.send_notification_email(
            to_email=user_email,
            subject=f"Agent {status_text.title()} - FARM",
            content=f"""
            <h2>Agent Status Update</h2>
            <p>Hello {username},</p>
            <p>Your agent <strong>"{agent_name}"</strong> has been {status_text}.</p>
            <p>You can view your agents in the dashboard.</p>
            <p>Best regards,<br>FARM Team</p>
            """
        )


# Create global email service instance
email_service = EmailService()