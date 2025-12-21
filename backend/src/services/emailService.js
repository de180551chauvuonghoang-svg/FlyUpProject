import nodemailer from 'nodemailer';

// Email sender configuration
const FROM_EMAIL = process.env.EMAIL_FROM || process.env.GMAIL_USER;
const FROM_NAME = 'Fly Up Team';

// Create Gmail SMTP transporter
const createTransporter = () => {
  // If no email credentials, return null (will use dev mode)
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });
};

export const sendWelcomeEmail = async (to, name, clientURL = 'http://localhost:5173') => {
  try {
    const transporter = createTransporter();
    
    // Development fallback if Gmail is not configured
    if (!transporter) {
      console.log('📧 [DEV MODE] Welcome email would be sent to:', to);
      console.log('📧 Name:', name);
      console.log('📧 Client URL:', clientURL);
      return true;
    }

    const info = await transporter.sendMail({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: to,
      subject: 'Welcome to Fly Up!',
      html: createWelcomeEmailTemplate(name, clientURL)
    });

    console.log('✅ Welcome email sent to', to, '- Message ID:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
};

export const sendPasswordResetEmail = async (to, resetLink) => {
  try {
    const transporter = createTransporter();
    
    // Development fallback if Gmail is not configured
    if (!transporter) {
      console.log('\n🔐 ═══════════════════════════════════════════════════════');
      console.log('📧 [DEV MODE] Password Reset Email');
      console.log('───────────────────────────────────────────────────────');
      console.log('📬 To:', to);
      console.log('🔗 Reset Link:', resetLink);
      console.log('═══════════════════════════════════════════════════════\n');
      return true;
    }

    const info = await transporter.sendMail({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: to,
      subject: 'Password Reset Request',
      html: createPasswordResetEmailTemplate(resetLink)
    });

    console.log('✅ Password reset email sent to', to, '- Message ID:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    // Fallback: log the link to console
    console.log('\n🔐 ═══════════════════════════════════════════════════════');
    console.log('⚠️  Email failed to send, but here\'s the reset link:');
    console.log('🔗 Reset Link:', resetLink);
    console.log('═══════════════════════════════════════════════════════\n');
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
