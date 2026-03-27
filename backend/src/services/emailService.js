import { google } from 'googleapis';

// Email sender configuration
const FROM_EMAIL = process.env.GMAIL_USER || process.env.EMAIL_FROM;
const FROM_NAME = 'Fly Up Team';

// OAuth2 Configuration
const CLIENT_ID = process.env.GMAIL_CLIENT_ID;
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN;

const createGmailClient = () => {
  if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN || !FROM_EMAIL) {
    return null;
  }
  const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
  oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
  return google.gmail({ version: 'v1', auth: oAuth2Client });
};

// Helper to encode message to base64url format required by Gmail API
const makeBody = (to, from, subject, message) => {
  const str = [
    `To: ${to}`,
    `From: ${from}`,
    `Subject: =?utf-8?B?${Buffer.from(subject).toString('base64')}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    '',
    message
  ].join('\n');

  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

const sendEmailViaGmail = async (to, subject, htmlBody) => {
  const gmail = createGmailClient();

  if (!gmail) {
    console.warn('⚠️ GMAIL API credentials missing. Emails will not send.');
    return false;
  }

  try {
    const raw = makeBody(to, `"${FROM_NAME}" <${FROM_EMAIL}>`, subject, htmlBody);
    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: raw,
      },
    });
    console.log(`✅ Email sent to ${to} (ID: ${res.data.id})`);
    return true;
  } catch (error) {
    console.error('❌ Error sending email via Gmail API:', error.message);
    if (error.response) {
      console.error('API Error Details:', error.response.data);
    }

    const customError = new Error('Failed to send email via Gmail API: ' + error.message);
    customError.code = 'EMAIL_SEND_FAILED';
    customError.details = error.response ? error.response.data : null;
    throw customError;
  }
}

export const sendWelcomeEmail = async (to, name, clientURL = 'http://localhost:5173') => {
  try {
    const gmail = createGmailClient();

    if (!gmail) {
      console.log('📧 [DEV MODE] Welcome email would be sent to:', to);
      console.warn('⚠️ GMAIL_CLIENT_ID/SECRET/REFRESH_TOKEN missing. Add to .env.');
      return true;
    }

    const html = createWelcomeEmailTemplate(name, clientURL);
    return await sendEmailViaGmail(to, 'Welcome to Fly Up!', html);

  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
};

export const sendPurchaseSuccessEmail = async (to, name, orderData) => {
  try {
    const gmail = createGmailClient();

    // Development fallback
    if (!gmail) {
      console.log('\n💳 ═══════════════════════════════════════════════════════');
      console.log('📧 [DEV MODE] Purchase Success Email');
      console.log('───────────────────────────────────────────────────────');
      console.log('📬 To:', to);
      console.log('👤 Name:', name);
      console.log('📦 Order ID:', orderData.orderId);
      console.log('💰 Total:', orderData.totalAmount);
      console.log('═══════════════════════════════════════════════════════\n');
      console.warn('⚠️ GMAIL_CLIENT_ID/SECRET/REFRESH_TOKEN missing. Add to .env.');
      return true;
    }

    const html = createPurchaseSuccessEmailTemplate(name, orderData);
    return await sendEmailViaGmail(to, 'Purchase Successful - Fly Up', html);

  } catch (error) {
    console.error('Error sending purchase success email:', error);
    return false;
  }
};

export const sendPasswordResetEmail = async (to, resetLink) => {
  try {
    const gmail = createGmailClient();

    if (!gmail) {
      console.log('\n🔐 ═══════════════════════════════════════════════════════');
      console.log('📧 [DEV MODE] Password Reset Email');
      console.log('🔗 Link:', resetLink);
      console.log('═══════════════════════════════════════════════════════\n');
      console.warn('⚠️ GMAIL_CLIENT_ID/SECRET/REFRESH_TOKEN missing. Add to .env.');
      return true;
    }

    const html = createPasswordResetEmailTemplate(resetLink);
    return await sendEmailViaGmail(to, 'Password Reset Request', html);

  } catch (error) {
    console.error('Error sending password reset email:', error);
    console.log('🔗 Backup Reset Link Log:', resetLink);
    return true;
  }
};

export const sendOtpEmail = async (to, otp) => {
  try {
    const gmail = createGmailClient();
    const isDev = process.env.NODE_ENV === 'development';

    // Check if client creation failed
    if (!gmail) {
      if (isDev) {
        console.log('\n🔐 ═══════════════════════════════════════════════════════');
        console.log('📧 [DEV MODE - NO CREDS] OTP Email');
        console.log('📬 To:', to);
        console.log('🔑 OTP:', otp);
        console.log('═══════════════════════════════════════════════════════\n');
        console.warn('⚠️ GMAIL_CLIENT_ID/SECRET/REFRESH_TOKEN missing. Add to .env.');
        return true;
      }
      throw new Error('Gmail client configuration missing in production');
    }

    const html = createOtpEmailTemplate(otp);
    const sent = await sendEmailViaGmail(to, 'Your Verification Code', html);

    // If sending via Gmail failed (e.g. invalid_grant)
    if (!sent) {
      if (isDev) {
        console.log('\n🔐 ═══════════════════════════════════════════════════════');
        console.log('📧 [DEV MODE - SEND FAILED] OTP Email');
        console.log('📬 To:', to);
        console.log('🔑 OTP:', otp);
        console.log('═══════════════════════════════════════════════════════\n');
        console.warn('⚠️ Email sending failed. Displaying OTP in console for testing.');
        return true; // Return true so the frontend flow can continue in dev
      }
      throw new Error('Failed to send OTP email via Gmail');
    }

    return true;

  } catch (error) {
    console.error('Error sending OTP email:', error);

    if (process.env.NODE_ENV === 'development') {
      // In dev, print OTP to console if email fails
      console.log('🔑 [FALLBACK] OTP:', otp);
      return true; // Return true to allow flow to continue
    }

    // In production, bubble up the error
    throw error;
  }
};

export const sendCourseApprovedEmail = async (to, instructorName, courseTitle) => {
  try {
    const gmail = createGmailClient();

    if (!gmail) {
      console.log('📧 [DEV MODE] Course Approved Email would be sent to:', to);
      return true;
    }

    const html = createCourseApprovedEmailTemplate(instructorName, courseTitle);
    return await sendEmailViaGmail(to, `Congratulations! Your course "${courseTitle}" is now Live`, html);
  } catch (error) {
    console.error('Error sending course approved email:', error);
    return false;
  }
};

export const sendCourseRejectedEmail = async (to, instructorName, courseTitle, reason) => {
  try {
    const gmail = createGmailClient();

    if (!gmail) {
      console.log('📧 [DEV MODE] Course Rejected Email would be sent to:', to);
      return true;
    }

    const html = createCourseRejectedEmailTemplate(instructorName, courseTitle, reason);
    return await sendEmailViaGmail(to, 'Course Revision Required - Fly Up', html);
  } catch (error) {
    console.error('Error sending course rejected email:', error);
    return false;
  }
};

export const sendCourseArchivedEmail = async (to, instructorName, courseTitle, reason) => {
  try {
    const gmail = createGmailClient();

    if (!gmail) {
      console.log('📧 [DEV MODE] Course Archived Email would be sent to:', to);
      return true;
    }

    const html = createCourseArchivedEmailTemplate(instructorName, courseTitle, reason);
    return await sendEmailViaGmail(to, 'Course Archived - Fly Up', html);
  } catch (error) {
    console.error('Error sending course archived email:', error);
    return false;
  }
};

export const sendCourseUnarchivedEmail = async (to, instructorName, courseTitle) => {
  try {
    const gmail = createGmailClient();

    if (!gmail) {
      console.log('📧 [DEV MODE] Course Unarchived Email would be sent to:', to);
      return true;
    }

    const html = createCourseUnarchivedEmailTemplate(instructorName, courseTitle);
    return await sendEmailViaGmail(to, `Your course "${courseTitle}" has been restored`, html);
  } catch (error) {
    console.error('Error sending course unarchived email:', error);
    return false;
  }
};

export const sendAccountLockedEmail = async (to, userName, reason) => {
  try {
    const gmail = createGmailClient();

    if (!gmail) {
      console.log('📧 [DEV MODE] Account Locked Email would be sent to:', to);
      return true;
    }

    const html = createAccountLockedEmailTemplate(userName, reason);
    return await sendEmailViaGmail(to, 'Important: Action Required Regarding Your Fly Up Account', html);
  } catch (error) {
    console.error('Error sending account locked email:', error);
    return false;
  }
};

export const sendAccountUnlockedEmail = async (to, userName) => {
  try {
    const gmail = createGmailClient();

    if (!gmail) {
      console.log('📧 [DEV MODE] Account Unlocked Email would be sent to:', to);
      return true;
    }

    const html = createAccountUnlockedEmailTemplate(userName);
    return await sendEmailViaGmail(to, 'Good news! Your Fly Up account has been reactivated', html);
  } catch (error) {
    console.error('Error sending account unlocked email:', error);
    return false;
  }
};

// --- Templates ---

function createWelcomeEmailTemplate(name, clientURL) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Fly Up</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0f2f5; color: #333;">
  <div style="max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);">
    <div style="background: linear-gradient(135deg, #00C6FF 0%, #0072FF 100%); padding: 40px 20px; text-align: center;">
      <img src="https://swp-fly-up.vercel.app/FluyUpLogo.png" alt="Fly Up Logo" style="width: 80px; height: 80px; background: white; border-radius: 50%; padding: 10px; margin-bottom: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); object-fit: contain;">
      <h1 style="color: white; font-size: 28px; font-weight: 700; margin: 0; letter-spacing: 0.5px;">Welcome to Fly Up!</h1>
    </div>
    
    <div style="padding: 40px 30px;">
      <p style="font-size: 20px; font-weight: 600; color: #1a1a1a; margin-bottom: 16px;">Hello ${name},</p>
      <p style="font-size: 16px; line-height: 1.6; color: #4a4a4a; margin-bottom: 24px;">
        Welcome to the <strong>Fly Up</strong> family! We're absolutely thrilled to have you on board. 
        Get ready to experience learning like never before—fast, fun, and secure.
      </p>
      
      <div style="background-color: #f8f9fa; border-radius: 12px; padding: 24px; margin: 24px 0; border-left: 4px solid #0072FF;">
        <p style="margin: 0 0 12px 0; font-weight: 600; color: #333;">Here's what you can do:</p>
        <ul style="list-style: none; padding: 0; margin: 0;">
          <li style="padding: 8px 0; color: #555; font-size: 15px; display: flex; align-items: center;">
            <span style="color: #0072FF; font-weight: bold; margin-right: 10px;">✓</span> Access high-quality courses anywhere
          </li>
          <li style="padding: 8px 0; color: #555; font-size: 15px; display: flex; align-items: center;">
            <span style="color: #0072FF; font-weight: bold; margin-right: 10px;">✓</span> Learn from expert instructors
          </li>
          <li style="padding: 8px 0; color: #555; font-size: 15px; display: flex; align-items: center;">
            <span style="color: #0072FF; font-weight: bold; margin-right: 10px;">✓</span> Track your progress and earn certificates
          </li>
        </ul>
      </div>

      <div style="text-align: center; margin-top: 32px;">
        <a href="${clientURL}" style="display: inline-block; background: linear-gradient(135deg, #00C6FF 0%, #0072FF 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(0, 114, 255, 0.3);">Start Learning Now</a>
      </div>
    </div>
    
    <div style="background-color: #f8f9fa; padding: 24px; text-align: center; font-size: 13px; color: #888; border-top: 1px solid #eaeaea;">
      <p style="margin: 5px 0;">&copy; ${new Date().getFullYear()} Fly Up Team. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}

function createPurchaseSuccessEmailTemplate(name, orderData) {
  const courseListHTML = orderData.courses.map(course => `
    <div style="padding: 12px; background: #f8f9fa; border-radius: 8px; margin-bottom: 8px; border: 1px solid #eaeaea;">
      <div style="font-weight: 600; color: #1a1a1a;">${course.title}</div>
      <div style="font-size: 14px; color: #666;">${course.price.toLocaleString('vi-VN')}₫</div>
    </div>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Purchase Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0f2f5; color: #333;">
  <div style="max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);">
    <div style="background: linear-gradient(135deg, #00C6FF 0%, #0072FF 100%); padding: 40px 20px; text-align: center;">
      <img src="https://swp-fly-up.vercel.app/FluyUpLogo.png" alt="Fly Up Logo" style="width: 80px; height: 80px; background: white; border-radius: 50%; padding: 10px; margin-bottom: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); object-fit: contain;">
      <h1 style="color: white; font-size: 28px; font-weight: 700; margin: 0; letter-spacing: 0.5px;">Payment Successful!</h1>
    </div>
    
    <div style="padding: 40px 30px;">
      <p style="font-size: 20px; font-weight: 600; color: #1a1a1a; margin-bottom: 16px;">Hello ${name},</p>
      <div style="margin-bottom: 30px;">
        <div style="background-color: #fcfcfc; border: 1px solid #eee; border-radius: 12px; padding: 20px;">
          <div style="margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 15px;">
            <div style="font-size: 13px; color: #888;">Order ID</div>
            <div style="font-weight: 600; font-family: monospace;">${orderData.orderId}</div>
          </div>
          <div style="margin-bottom: 15px;">
            ${courseListHTML}
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 15px; border-top: 2px solid #0072FF;">
            <div style="font-weight: 700; color: #1a1a1a;">Total Paid</div>
            <div style="font-weight: 700; color: #0072FF; font-size: 20px;">${orderData.totalAmount.toLocaleString('vi-VN')}₫</div>
          </div>
        </div>
      </div>
      <div style="text-align: center; margin-top: 32px;">
        <a href="http://localhost:5173/my-learning" style="display: inline-block; background: linear-gradient(135deg, #00C6FF 0%, #0072FF 100%); color: white; text-decoration: none; padding: 14px 40px; border-radius: 50px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(0, 114, 255, 0.3);">Go to My Learning</a>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

function createPasswordResetEmailTemplate(resetLink) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0f2f5; color: #333;">
  <div style="max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);">
    <div style="background: linear-gradient(135deg, #00C6FF 0%, #0072FF 100%); padding: 40px 20px; text-align: center;">
      <h1 style="color: white; font-size: 28px; font-weight: 700; margin: 0; letter-spacing: 0.5px;">Reset Password</h1>
    </div>
    <div style="padding: 40px 30px;">
      <p style="font-size: 16px; line-height: 1.6; color: #4a4a4a; margin-bottom: 24px;">
        We received a request to reset your password. Click the button below to continue.
      </p>
      <div style="text-align: center; margin-top: 32px; margin-bottom: 32px;">
        <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #00C6FF 0%, #0072FF 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-weight: 600; font-size: 16px;">Reset Password</a>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

function createOtpEmailTemplate(otp) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verification Code</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0f2f5; color: #333;">
  <div style="max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);">
    <div style="background: linear-gradient(135deg, #00C6FF 0%, #0072FF 100%); padding: 40px 20px; text-align: center;">
      <h1 style="color: white; font-size: 28px; font-weight: 700; margin: 0; letter-spacing: 0.5px;">Verification Code</h1>
    </div>
    <div style="padding: 40px 30px; text-align: center;">
      <div style="background: #f8f9fa; border: 2px dashed #0072FF; border-radius: 12px; padding: 20px; margin: 30px auto; width: fit-content;">
        <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0072FF; font-family: monospace;">${otp}</span>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

function createCourseApprovedEmailTemplate(instructorName, courseTitle) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Course Approved</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0f2f5; color: #333;">
  <div style="max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);">
    <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 40px 20px; text-align: center;">
      <img src="https://swp-fly-up.vercel.app/FluyUpLogo.png" alt="Fly Up Logo" style="width: 80px; height: 80px; background: white; border-radius: 50%; padding: 10px; margin-bottom: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); object-fit: contain;">
      <h1 style="color: white; font-size: 28px; font-weight: 700; margin: 0; letter-spacing: 0.5px;">Congratulations!</h1>
    </div>
    <div style="padding: 40px 30px;">
      <p style="font-size: 20px; font-weight: 600; color: #1a1a1a; margin-bottom: 16px;">Hello ${instructorName},</p>
      <p style="font-size: 16px; line-height: 1.6; color: #4a4a4a; margin-bottom: 24px;">
        Great news! Your course <strong>"${courseTitle}"</strong> has been approved and is now live!
      </p>
      <div style="text-align: center; margin-top: 32px;">
        <a href="http://localhost:5173/instructor/courses" style="display: inline-block; background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);">Go to Instructor Dashboard</a>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

function createCourseRejectedEmailTemplate(instructorName, courseTitle, reason) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Course Revision Required</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0f2f5; color: #333;">
  <div style="max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);">
    <div style="background: linear-gradient(135deg, #dc3545 0%, #ff4d5a 100%); padding: 40px 20px; text-align: center;">
      <h1 style="color: white; font-size: 28px; font-weight: 700; margin: 0; letter-spacing: 0.5px;">Update Required</h1>
    </div>
    <div style="padding: 40px 30px;">
      <p style="font-size: 20px; font-weight: 600; color: #1a1a1a; margin-bottom: 16px;">Hello ${instructorName},</p>
      <div style="background-color: #fff5f5; border-radius: 12px; padding: 24px; margin: 24px 0; border-left: 4px solid #dc3545;">
        <p style="margin: 0 0 12px 0; font-weight: 600; color: #333;">Reason for revision:</p>
        <p style="margin: 0; color: #d32f2f; font-size: 15px; line-height: 1.6;">${reason || 'No specific reason provided.'}</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

function createCourseArchivedEmailTemplate(instructorName, courseTitle, reason) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Course Archived</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0f2f5; color: #333;">
  <div style="max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);">
    <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 20px; text-align: center;">
      <h1 style="color: white; font-size: 28px; font-weight: 700; margin: 0; letter-spacing: 0.5px;">Course Archived</h1>
    </div>
    <div style="padding: 40px 30px;">
      <p style="font-size: 20px; font-weight: 600; color: #1a1a1a; margin-bottom: 16px;">Hello ${instructorName},</p>
      <div style="background-color: #fffbeb; border-radius: 12px; padding: 24px; margin: 24px 0; border-left: 4px solid #f59e0b;">
        <p style="margin: 0 0 12px 0; font-weight: 600; color: #333;">Reason for archiving:</p>
        <p style="margin: 0; color: #92400e; font-size: 15px; line-height: 1.6;">${reason || 'The course content is no longer aligned with our current platform standards.'}</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

function createCourseUnarchivedEmailTemplate(instructorName, courseTitle) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Course Restored</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0f2f5; color: #333;">
  <div style="max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);">
    <div style="background: linear-gradient(135deg, #00C6FF 0%, #0072FF 100%); padding: 40px 20px; text-align: center;">
      <h1 style="color: white; font-size: 28px; font-weight: 700; margin: 0; letter-spacing: 0.5px;">Course Restored</h1>
    </div>
    <div style="padding: 40px 30px;">
      <p style="font-size: 20px; font-weight: 600; color: #1a1a1a; margin-bottom: 16px;">Hello ${instructorName},</p>
      <p style="font-size: 16px; line-height: 1.6; color: #4a4a4a; margin-bottom: 24px;">
        Your course <strong>"${courseTitle}"</strong> has been restored and is back on the platform!
      </p>
      <div style="text-align: center; margin-top: 32px;">
        <a href="http://localhost:5173/instructor/courses" style="display: inline-block; background: linear-gradient(135deg, #00C6FF 0%, #0072FF 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-weight: 600; font-size: 16px;">Go to Instructor Dashboard</a>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

function createAccountLockedEmailTemplate(userName, reason) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Access Suspended</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0f2f5; color: #333;">
  <div style="max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);">
    <div style="background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%); padding: 40px 20px; text-align: center;">
      <h1 style="color: white; font-size: 24px; font-weight: 700; margin: 0; letter-spacing: 0.5px;">Account Action Notification</h1>
    </div>
    <div style="padding: 40px 30px;">
      <p style="font-size: 20px; font-weight: 600; color: #1a1a1a; margin-bottom: 16px;">Hello ${userName},</p>
      <div style="background-color: #fff5f5; border-radius: 12px; padding: 24px; margin: 24px 0; border-left: 4px solid #e53e3e;">
        <p style="margin: 0 0 12px 0; font-weight: 600; color: #333;">Reason for suspension:</p>
        <p style="margin: 0; color: #c53030; font-size: 15px; line-height: 1.6;">${reason || 'Violation of our Terms of Service.'}</p>
      </div>
      <div style="text-align: center; margin-top: 32px;">
         <a href="mailto:support@flyup.com" style="display: inline-block; background: transparent; color: #c53030; border: 2px solid #c53030; text-decoration: none; padding: 12px 32px; border-radius: 50px; font-weight: 600; font-size: 16px;">Contact Support</a>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

function createAccountUnlockedEmailTemplate(userName) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Reactivated</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0f2f5; color: #333;">
  <div style="max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);">
    <div style="background: linear-gradient(135deg, #00C6FF 0%, #0072FF 100%); padding: 40px 20px; text-align: center;">
      <h1 style="color: white; font-size: 24px; font-weight: 700; margin: 0; letter-spacing: 0.5px;">Account Reactivated</h1>
    </div>
    <div style="padding: 40px 30px;">
      <p style="font-size: 20px; font-weight: 600; color: #1a1a1a; margin-bottom: 16px;">Hello ${userName},</p>
      <p style="font-size: 16px; line-height: 1.6; color: #4a4a4a; margin-bottom: 24px;">
        Good news! Your Fly Up account has been reactivated. You can now log back in and continue your learning journey.
      </p>
      <div style="text-align: center; margin-top: 32px;">
         <a href="http://localhost:5173/login" style="display: inline-block; background: linear-gradient(135deg, #00C6FF 0%, #0072FF 100%); color: white; text-decoration: none; padding: 12px 32px; border-radius: 50px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(0, 114, 255, 0.3);">Login to Your Account</a>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

export const sendCertificateEmail = async (to, name, courseTitle) => {
  try {
    const gmail = createGmailClient();
    if (!gmail) {
      console.log('📧 [DEV MODE] Certificate Email would be sent to:', to);
      return true;
    }

    const html = createCertificateEmailTemplate(name, courseTitle);
    return await sendEmailViaGmail(to, `Course Certificate: ${courseTitle}`, html);
  } catch (error) {
    console.error('Error sending certificate email:', error);
    return false;
  }
};

function createCertificateEmailTemplate(name, courseTitle) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Course Certificate</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0f2f5; color: #333;">
  <div style="max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);">
    <div style="background: linear-gradient(135deg, #6e3cec 0%, #a855f7 100%); padding: 40px 20px; text-align: center;">
      <img src="https://swp-fly-up.vercel.app/FluyUpLogo.png" alt="Fly Up Logo" style="width: 80px; height: 80px; background: white; border-radius: 50%; padding: 10px; margin-bottom: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); object-fit: contain;">
      <h1 style="color: white; font-size: 28px; font-weight: 700; margin: 0; letter-spacing: 0.5px;">Congratulations!</h1>
      <p style="color: rgba(255,255,255,0.9); margin-top: 10px; font-size: 16px;">You've earned your certificate</p>
    </div>
    
    <div style="padding: 40px 30px; text-align: center;">
      <p style="font-size: 20px; font-weight: 600; color: #1a1a1a; margin-bottom: 16px;">Well done, ${name}!</p>
      <p style="font-size: 16px; line-height: 1.6; color: #4a4a4a; margin-bottom: 24px;">
        Hard work pays off! You have successfully completed the course <strong>"${courseTitle}"</strong>. 
        Your dedication and effort have led you to this milestone.
      </p>
      
      <div style="background-color: #f8f9fa; border: 1px solid #e2e8f0; border-radius: 12px; padding: 30px; margin: 30px 0;">
        <span style="material-symbols-outlined; font-size: 48px; color: #a855f7;">🏆</span>
        <h2 style="color: #1a1a1a; margin-top: 15px; margin-bottom: 5px;">Certificate Earned</h2>
        <p style="color: #64748b; font-size: 14px;">"${courseTitle}"</p>
      </div>

      <div style="text-align: center; margin-top: 32px;">
        <a href="http://localhost:5173/my-learning" style="display: inline-block; background: linear-gradient(135deg, #6e3cec 0%, #a855f7 100%); color: white; text-decoration: none; padding: 14px 40px; border-radius: 50px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(110, 60, 236, 0.3);">View Your Certificate</a>
      </div>
      
      <p style="margin-top: 40px; font-size: 14px; color: #888;">
        You can download or print your certificate from your "My Learning" dashboard at any time.
      </p>
    </div>
    
    <div style="background-color: #f8f9fa; padding: 24px; text-align: center; font-size: 13px; color: #888; border-top: 1px solid #eaeaea;">
      <p style="margin: 5px 0;">&copy; ${new Date().getFullYear()} Fly Up Team. All rights reserved.</p>
      <p style="margin: 5px 0;">The sky is not the limit, it's just the beginning. 🚀</p>
    </div>
  </div>
</body>
</html>
  `;
}
