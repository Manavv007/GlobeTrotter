const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

class EmailService {
  static async sendEmailVerification(email, firstName, token) {
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${token}`;
    
    const msg = {
      to: email,
      from: process.env.EMAIL_FROM,
      subject: 'Welcome to GlobeTrotter - Verify Your Email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2c3e50; margin: 0; font-size: 28px;">🌍 GlobeTrotter</h1>
              <p style="color: #7f8c8d; margin: 10px 0 0 0;">Your Journey Begins Here</p>
            </div>
            
            <h2 style="color: #2c3e50; margin-bottom: 20px;">Welcome, ${firstName}!</h2>
            
            <p style="color: #34495e; line-height: 1.6; margin-bottom: 20px;">
              Thank you for joining GlobeTrotter! We're excited to help you plan your next adventure. 
              To get started, please verify your email address by clicking the button below.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background-color: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Verify Email Address
              </a>
            </div>
            
            <p style="color: #7f8c8d; font-size: 14px; margin-top: 30px;">
              If the button doesn't work, you can copy and paste this link into your browser:
            </p>
            <p style="color: #3498db; font-size: 14px; word-break: break-all;">
              ${verificationUrl}
            </p>
            
            <p style="color: #7f8c8d; font-size: 14px; margin-top: 30px;">
              This link will expire in 24 hours. If you didn't create an account with GlobeTrotter, 
              you can safely ignore this email.
            </p>
            
            <div style="border-top: 1px solid #ecf0f1; margin-top: 30px; padding-top: 20px; text-align: center;">
              <p style="color: #7f8c8d; font-size: 12px; margin: 0;">
                © 2024 GlobeTrotter. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      `
    };

    try {
      await sgMail.send(msg);
      return true;
    } catch (error) {
      console.error('Email verification error:', error);
      return false;
    }
  }

  static async sendPasswordReset(email, firstName, token) {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
    
    const msg = {
      to: email,
      from: process.env.EMAIL_FROM,
      subject: 'GlobeTrotter - Reset Your Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2c3e50; margin: 0; font-size: 28px;">🌍 GlobeTrotter</h1>
              <p style="color: #7f8c8d; margin: 10px 0 0 0;">Your Journey Begins Here</p>
            </div>
            
            <h2 style="color: #2c3e50; margin-bottom: 20px;">Hello, ${firstName}!</h2>
            
            <p style="color: #34495e; line-height: 1.6; margin-bottom: 20px;">
              We received a request to reset your password for your GlobeTrotter account. 
              Click the button below to create a new password.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #e74c3c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #7f8c8d; font-size: 14px; margin-top: 30px;">
              If the button doesn't work, you can copy and paste this link into your browser:
            </p>
            <p style="color: #3498db; font-size: 14px; word-break: break-all;">
              ${resetUrl}
            </p>
            
            <p style="color: #7f8c8d; font-size: 14px; margin-top: 30px;">
              This link will expire in 1 hour. If you didn't request a password reset, 
              you can safely ignore this email.
            </p>
            
            <div style="border-top: 1px solid #ecf0f1; margin-top: 30px; padding-top: 20px; text-align: center;">
              <p style="color: #7f8c8d; font-size: 12px; margin: 0;">
                © 2024 GlobeTrotter. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      `
    };

    try {
      await sgMail.send(msg);
      return true;
    } catch (error) {
      console.error('Password reset email error:', error);
      return false;
    }
  }

  static async sendWelcomeEmail(email, firstName) {
    const msg = {
      to: email,
      from: process.env.EMAIL_FROM,
      subject: 'Welcome to GlobeTrotter - Your Account is Verified!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2c3e50; margin: 0; font-size: 28px;">🌍 GlobeTrotter</h1>
              <p style="color: #7f8c8d; margin: 10px 0 0 0;">Your Journey Begins Here</p>
            </div>
            
            <h2 style="color: #2c3e50; margin-bottom: 20px;">Welcome aboard, ${firstName}! 🎉</h2>
            
            <p style="color: #34495e; line-height: 1.6; margin-bottom: 20px;">
              Congratulations! Your email has been verified and your GlobeTrotter account is now active. 
              You're all set to start planning your next adventure!
            </p>
            
            <div style="background-color: #e8f5e8; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #27ae60; margin-top: 0;">What you can do now:</h3>
              <ul style="color: #34495e; line-height: 1.8;">
                <li>Create your first travel itinerary</li>
                <li>Explore destinations and attractions</li>
                <li>Track your travel budget</li>
                <li>Share your plans with friends and family</li>
                <li>Get personalized travel recommendations</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.CLIENT_URL}/dashboard" 
                 style="background-color: #27ae60; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Start Planning
              </a>
            </div>
            
            <p style="color: #7f8c8d; font-size: 14px; margin-top: 30px;">
              If you have any questions or need help getting started, feel free to reach out to our support team.
            </p>
            
            <div style="border-top: 1px solid #ecf0f1; margin-top: 30px; padding-top: 20px; text-align: center;">
              <p style="color: #7f8c8d; font-size: 12px; margin: 0;">
                © 2024 GlobeTrotter. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      `
    };

    try {
      await sgMail.send(msg);
      return true;
    } catch (error) {
      console.error('Welcome email error:', error);
      return false;
    }
  }
}

module.exports = EmailService;
