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
       <img src="https://swp-fly-up.vercel.app/FluyUpLogo.png" alt="Fly Up Logo" style="width: 80px; height: 80px; background: white; border-radius: 50%; padding: 10px; margin-bottom: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); object-fit: contain;">
      <h1 style="color: white; font-size: 28px; font-weight: 700; margin: 0; letter-spacing: 0.5px;">Reset Password</h1>
    </div>
    
    <div style="padding: 40px 30px;">
      <p style="font-size: 20px; font-weight: 600; color: #1a1a1a; margin-bottom: 16px;">Hello,</p>
      <p style="font-size: 16px; line-height: 1.6; color: #4a4a4a; margin-bottom: 24px;">
        We received a request to reset the password for your Fly Up account. If you didn't ask for this, you can safely ignore this email.
      </p>
      
      <div style="text-align: center; margin-top: 32px; margin-bottom: 32px;">
        <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #00C6FF 0%, #0072FF 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(0, 114, 255, 0.3);">Reset Password</a>
      </div>
      
       <p style="font-size: 14px; line-height: 1.6; color: #666; margin-bottom: 24px; word-break: break-all;">
        Or copy and paste this link into your browser:<br>
        <a href="${resetLink}" style="color: #0072FF; text-decoration: none;">${resetLink}</a>
      </p>

      <p style="margin-top: 40px; font-size: 14px; color: #888; text-align: center;">
        This link will expire in 1 hour for your security.
      </p>
    </div>
    
    <div style="background-color: #f8f9fa; padding: 24px; text-align: center; font-size: 13px; color: #888; border-top: 1px solid #eaeaea;">
       <p style="margin: 5px 0;">&copy; ${new Date().getFullYear()} Fly Up Team. All rights reserved.</p>
       <p style="margin: 5px 0;">Sent with 💙 from the Fly Up HQ</p>
    </div>
  </div>
</body>
</html>
  `;
}

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
        Get ready to experience messaging like never before—fast, fun, and secure.
      </p>
      
      <div style="background-color: #f8f9fa; border-radius: 12px; padding: 24px; margin: 24px 0; border-left: 4px solid #0072FF;">
        <p style="margin: 0 0 12px 0; font-weight: 600; color: #333;">Here's what you can do:</p>
        <ul style="list-style: none; padding: 0; margin: 0;">
          <li style="padding: 8px 0; color: #555; font-size: 15px; display: flex; align-items: center;">
            <span style="color: #0072FF; font-weight: bold; margin-right: 10px;">✓</span> Connect instantly with friends &amp; family
          </li>
          <li style="padding: 8px 0; color: #555; font-size: 15px; display: flex; align-items: center;">
            <span style="color: #0072FF; font-weight: bold; margin-right: 10px;">✓</span> Share photos and moments in real-time
          </li>
          <li style="padding: 8px 0; color: #555; font-size: 15px; display: flex; align-items: center;">
            <span style="color: #0072FF; font-weight: bold; margin-right: 10px;">✓</span> Create groups and stay organized
          </li>
          <li style="padding: 8px 0; color: #555; font-size: 15px; display: flex; align-items: center;">
            <span style="color: #0072FF; font-weight: bold; margin-right: 10px;">✓</span> Customize your profile and experience
          </li>
        </ul>
      </div>

      <div style="text-align: center; margin-top: 32px;">
        <a href="${clientURL}" style="display: inline-block; background: linear-gradient(135deg, #00C6FF 0%, #0072FF 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(0, 114, 255, 0.3);">Start Messaging Now</a>
      </div>
      
      <p style="margin-top: 40px; font-size: 14px; color: #888; text-align: center;">
        Need help? Just reply to this email or visit our help center.
      </p>
    </div>
    
    <div style="background-color: #f8f9fa; padding: 24px; text-align: center; font-size: 13px; color: #888; border-top: 1px solid #eaeaea;">
      <div style="margin-bottom: 16px;">
        <a href="#" style="color: #0072FF; text-decoration: none; margin: 0 8px; font-weight: 500;">Twitter</a> •
        <a href="#" style="color: #0072FF; text-decoration: none; margin: 0 8px; font-weight: 500;">Instagram</a> •
        <a href="#" style="color: #0072FF; text-decoration: none; margin: 0 8px; font-weight: 500;">Facebook</a>
      </div>
      <p style="margin: 5px 0;">&copy; ${new Date().getFullYear()} Fly Up Team. All rights reserved.</p>
      <p style="margin: 5px 0;">Sent with 💙 from the Fly Up HQ</p>
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
      <p style="font-size: 16px; line-height: 1.6; color: #4a4a4a; margin-bottom: 24px;">
        Thank you for your purchase! We've successfully processed your payment for the following courses. You now have full access to your new learning materials.
      </p>
      
      <div style="margin-bottom: 30px;">
        <div style="font-size: 14px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; font-weight: 700;">Order Details</div>
        <div style="background-color: #fcfcfc; border: 1px solid #eee; border-radius: 12px; padding: 20px;">
          <div style="margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 15px;">
            <div style="font-size: 13px; color: #888;">Order ID</div>
            <div style="font-weight: 600; font-family: monospace;">${orderData.orderId}</div>
          </div>
          
          <div style="margin-bottom: 15px;">
            <div style="font-size: 13px; color: #888; margin-bottom: 8px;">Purchased Courses</div>
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
      
      <p style="margin-top: 40px; font-size: 14px; color: #888; text-align: center;">
        If you have any questions about your order, please contact our support team.
      </p>
    </div>
    
    <div style="background-color: #f8f9fa; padding: 24px; text-align: center; font-size: 13px; color: #888; border-top: 1px solid #eaeaea;">
      <p style="margin: 5px 0;">&copy; ${new Date().getFullYear()} Fly Up Team. All rights reserved.</p>
      <p style="margin: 5px 0;">Happy Learning! 🚀</p>
    </div>
  </div>
</body>
</html>
  `;
}

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
       <img src="https://swp-fly-up.vercel.app/FluyUpLogo.png" alt="Fly Up Logo" style="width: 80px; height: 80px; background: white; border-radius: 50%; padding: 10px; margin-bottom: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); object-fit: contain;">
      <h1 style="color: white; font-size: 28px; font-weight: 700; margin: 0; letter-spacing: 0.5px;">Verification Code</h1>
    </div>
    
    <div style="padding: 40px 30px; text-align: center;">
      <p style="font-size: 20px; font-weight: 600; color: #1a1a1a; margin-bottom: 16px;">Hello,</p>
      <p style="font-size: 16px; line-height: 1.6; color: #4a4a4a; margin-bottom: 24px;">
        Use the following verification code to complete your registration.
      </p>
      
      <div style="background: #f8f9fa; border: 2px dashed #0072FF; border-radius: 12px; padding: 20px; margin: 30px auto; width: fit-content;">
        <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0072FF; font-family: monospace;">${otp}</span>
      </div>
      
      <p style="font-size: 14px; line-height: 1.6; color: #666; margin-bottom: 24px;">
        This code will expire in 3 minutes.
      </p>
    </div>
    
    <div style="background-color: #f8f9fa; padding: 24px; text-align: center; font-size: 13px; color: #888; border-top: 1px solid #eaeaea;">
       <p style="margin: 5px 0;">&copy; ${new Date().getFullYear()} Fly Up Team. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}
export const sendCourseApprovedEmail = async (to, instructorName, courseTitle) => {
  try {
    const gmail = createGmailClient();

    if (!gmail) {
      console.log('📧 [DEV MODE] Course Approved Email would be sent to:', to);
      return true;
    }

    const html = createCourseApprovedEmailTemplate(instructorName, courseTitle);
    return await sendEmailViaGmail(to, 'Course Approved - Fly Up', html);
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
        Good news! Your course <strong>"${courseTitle}"</strong> has been reviewed and <strong>approved</strong> by our team. 
        It is now live on the Fly Up platform and available for students to enroll.
      </p>
      
      <div style="background-color: #f8f9fa; border-radius: 12px; padding: 24px; margin: 24px 0; border-left: 4px solid #28a745;">
        <p style="margin: 0; font-weight: 600; color: #333;">Your course is now public!</p>
        <p style="margin: 8px 0 0 0; color: #555; font-size: 15px;">You can now view your course page and start marketing it to your audience.</p>
      </div>

      <div style="text-align: center; margin-top: 32px;">
        <a href="http://localhost:5173/instructor/courses" style="display: inline-block; background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);">Go to Instructor Dashboard</a>
      </div>
      
      <p style="margin-top: 40px; font-size: 14px; color: #888; text-align: center;">
        Thank you for contributing to Fly Up. We're excited to see your course succeed!
      </p>
    </div>
    
    <div style="background-color: #f8f9fa; padding: 24px; text-align: center; font-size: 13px; color: #888; border-top: 1px solid #eaeaea;">
      <p style="margin: 5px 0;">&copy; ${new Date().getFullYear()} Fly Up Team. All rights reserved.</p>
      <p style="margin: 5px 0;">Keep Inspiring! 🚀</p>
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
      <img src="https://swp-fly-up.vercel.app/FluyUpLogo.png" alt="Fly Up Logo" style="width: 80px; height: 80px; background: white; border-radius: 50%; padding: 10px; margin-bottom: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); object-fit: contain;">
      <h1 style="color: white; font-size: 28px; font-weight: 700; margin: 0; letter-spacing: 0.5px;">Update Required</h1>
    </div>
    
    <div style="padding: 40px 30px;">
      <p style="font-size: 20px; font-weight: 600; color: #1a1a1a; margin-bottom: 16px;">Hello ${instructorName},</p>
      <p style="font-size: 16px; line-height: 1.6; color: #4a4a4a; margin-bottom: 24px;">
        Thank you for submitting your course <strong>"${courseTitle}"</strong>. Our team has reviewed your submission and identified some areas that need improvement before it can be published.
      </p>
      
      <div style="background-color: #fff5f5; border-radius: 12px; padding: 24px; margin: 24px 0; border-left: 4px solid #dc3545;">
        <p style="margin: 0 0 12px 0; font-weight: 600; color: #333;">Reason for revision:</p>
        <p style="margin: 0; color: #d32f2f; font-size: 15px; line-height: 1.6;">${reason || 'No specific reason provided. Please review our guidelines.'}</p>
      </div>

      <p style="font-size: 16px; line-height: 1.6; color: #4a4a4a; margin-bottom: 24px;">
        Don't worry! You can easily make the necessary adjustments in your instructor dashboard and resubmit your course for approval.
      </p>

      <div style="text-align: center; margin-top: 32px;">
        <a href="http://localhost:5173/instructor/courses" style="display: inline-block; background: linear-gradient(135deg, #dc3545 0%, #ff4d5a 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(220, 53, 69, 0.3);">Edit My Course</a>
      </div>
      
      <p style="margin-top: 40px; font-size: 14px; color: #888; text-align: center;">
        If you have any questions regarding this decision, feel free to contact our support team.
      </p>
    </div>
    
    <div style="background-color: #f8f9fa; padding: 24px; text-align: center; font-size: 13px; color: #888; border-top: 1px solid #eaeaea;">
      <p style="margin: 5px 0;">&copy; ${new Date().getFullYear()} Fly Up Team. All rights reserved.</p>
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
