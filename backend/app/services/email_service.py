import logging
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """Email service for sending OTPs and notifications"""
    
    def __init__(self):
        self.use_sendgrid = settings.USE_SENDGRID
        self.from_email = settings.FROM_EMAIL
        
    async def send_otp_email(self, to_email: str, otp_code: str, username: str) -> dict:
        """Send OTP via email or display in console for development"""
        
        if self.use_sendgrid:
            # TODO: Implement SendGrid integration later
            return await self._send_via_sendgrid(
                to_email=to_email,
                subject="Your OTP for AI Agent Hub",
                content=f"Your OTP code is: {otp_code}. Valid for {settings.OTP_EXPIRE_MINUTES} minutes."
            )
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
        
        if self.use_sendgrid:
            return await self._send_via_sendgrid(to_email, subject, content)
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
    
    async def _send_via_sendgrid(
        self, 
        to_email: str, 
        subject: str, 
        content: str
    ) -> dict:
        """Send email via SendGrid (to be implemented later)"""
        try:
            # TODO: Implement actual SendGrid sending
            import sendgrid
            from sendgrid.helpers.mail import Mail
            
            sg = sendgrid.SendGridAPIClient(api_key=settings.SENDGRID_API_KEY)
            message = Mail(
                from_email=self.from_email,
                to_emails=to_email,
                subject=subject,
                html_content=content
            )
            
            response = sg.send(message)
            return {
                "status": "success",
                "message": "Email sent via SendGrid",
                "status_code": response.status_code
            }
            
        except Exception as e:
            logger.error(f"Failed to send email via SendGrid: {e}")
            return {
                "status": "error",
                "message": f"Failed to send email: {str(e)}"
            }
    
    async def notify_user_approval(self, user_email: str, username: str) -> dict:
        """Notify user of account approval"""
        return await self.send_notification_email(
            to_email=user_email,
            subject="Account Approved - AI Agent Hub",
            content=f"""
            <h2>Welcome to AI Agent Hub!</h2>
            <p>Hello {username},</p>
            <p>Your account has been approved and is now active.</p>
            <p>You can now login to the AI Agent Hub and start exploring agents.</p>
            <p>Best regards,<br>AI Agent Hub Team</p>
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
            subject="New User Registration - AI Agent Hub",
            content=f"""
            <h2>New User Registration</h2>
            <p>A new user has registered and needs approval:</p>
            <ul>
                <li><strong>Username:</strong> {new_username}</li>
                <li><strong>Email:</strong> {new_user_email}</li>
            </ul>
            <p>Please review and approve the user in the admin panel.</p>
            <p>Best regards,<br>AI Agent Hub System</p>
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
            subject=f"Agent {status_text.title()} - AI Agent Hub",
            content=f"""
            <h2>Agent Status Update</h2>
            <p>Hello {username},</p>
            <p>Your agent <strong>"{agent_name}"</strong> has been {status_text}.</p>
            <p>You can view your agents in the dashboard.</p>
            <p>Best regards,<br>AI Agent Hub Team</p>
            """
        )


# Create global email service instance
email_service = EmailService()