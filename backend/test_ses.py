"""
Test script to verify AWS SES configuration
Run this to check if SES is properly configured
"""
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import boto3
from botocore.exceptions import ClientError
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION")
FROM_EMAIL = os.getenv("FROM_EMAIL")

print("=" * 60)
print("AWS SES Configuration Test")
print("=" * 60)
print(f"AWS Region: {AWS_REGION}")
print(f"From Email: {FROM_EMAIL}")
print(f"Access Key ID: {AWS_ACCESS_KEY_ID[:10]}..." if AWS_ACCESS_KEY_ID else "Not Set")
print("=" * 60)

try:
    # Initialize SES client
    ses_client = boto3.client(
        'ses',
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        region_name=AWS_REGION
    )
    print("✅ SES client initialized successfully\n")

    # Check verified email identities
    print("Checking verified email identities...")
    response = ses_client.list_verified_email_addresses()
    verified_emails = response.get('VerifiedEmailAddresses', [])

    if verified_emails:
        print(f"✅ Found {len(verified_emails)} verified email(s):")
        for email in verified_emails:
            print(f"   - {email}")
    else:
        print("❌ No verified emails found!")
        print("\n📝 To verify an email:")
        print(f"   1. Go to: https://{AWS_REGION}.console.aws.amazon.com/ses/home?region={AWS_REGION}#/verified-identities")
        print("   2. Click 'Create identity'")
        print("   3. Select 'Email address'")
        print(f"   4. Enter: {FROM_EMAIL}")
        print("   5. Click 'Create identity'")
        print("   6. Check your email inbox and click the verification link")

    print("\n" + "=" * 60)

    # Check if sender email is verified
    if FROM_EMAIL in verified_emails:
        print(f"✅ Sender email '{FROM_EMAIL}' is verified!")
    else:
        print(f"❌ Sender email '{FROM_EMAIL}' is NOT verified!")
        print("   You must verify this email before sending emails")

    # Check account sending status
    print("\nChecking account sending status...")
    try:
        account_info = ses_client.get_account_sending_enabled()
        if account_info.get('Enabled'):
            print("✅ Account sending is ENABLED")
        else:
            print("❌ Account sending is DISABLED")
    except Exception as e:
        print(f"⚠️  Could not check account status: {e}")

    # Check if in sandbox mode
    print("\nChecking sandbox status...")
    try:
        quota = ses_client.get_send_quota()
        max_send = quota.get('Max24HourSend', 0)

        if max_send == 200:
            print("⚠️  Account is in SANDBOX mode")
            print("   - You can only send to verified email addresses")
            print("   - To send to any email, request production access:")
            print(f"     https://{AWS_REGION}.console.aws.amazon.com/ses/home?region={AWS_REGION}#/account")
        else:
            print(f"✅ Account is in PRODUCTION mode")
            print(f"   - Max send rate: {max_send} emails/24 hours")
    except Exception as e:
        print(f"⚠️  Could not check sandbox status: {e}")

    print("\n" + "=" * 60)
    print("💡 Summary:")
    print("=" * 60)

    if FROM_EMAIL in verified_emails:
        print("✅ Your SES configuration looks good!")
        print("   Emails should be sent successfully.")
    else:
        print("❌ ACTION REQUIRED:")
        print(f"   Please verify the email: {FROM_EMAIL}")
        print(f"   Visit: https://{AWS_REGION}.console.aws.amazon.com/ses/home?region={AWS_REGION}#/verified-identities")

except ClientError as e:
    error_code = e.response['Error']['Code']
    error_message = e.response['Error']['Message']
    print(f"\n❌ AWS SES Error: {error_code}")
    print(f"   Message: {error_message}")

    if error_code == 'InvalidClientTokenId':
        print("\n   Your AWS Access Key ID is invalid or expired")
    elif error_code == 'SignatureDoesNotMatch':
        print("\n   Your AWS Secret Access Key is incorrect")
    elif error_code == 'AccessDenied':
        print("\n   Your IAM user doesn't have SES permissions")
        print("   Required permissions: ses:SendEmail, ses:SendRawEmail")

except Exception as e:
    print(f"\n❌ Unexpected error: {str(e)}")
    print(f"   Error type: {type(e).__name__}")

print("\n" + "=" * 60)
