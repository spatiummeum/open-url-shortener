import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
}

export interface PasswordResetEmailOptions {
  to: string;
  resetUrl: string;
  userName?: string;
}

export interface WelcomeEmailOptions {
  to: string;
  userName: string;
}

/**
 * Send email using Resend
 */
export const sendEmail = async (options: EmailOptions) => {
  try {
    // Prepare email data, ensuring we have either html or text
    const emailData: any = {
      from: options.from || process.env.RESEND_FROM_EMAIL || 'URL Shortener <onboarding@resend.dev>',
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject
    };

    // Add content based on what's provided
    if (options.html) {
      emailData.html = options.html;
    }
    if (options.text) {
      emailData.text = options.text;
    }
    
    // Ensure we have at least one content type
    if (!options.html && !options.text) {
      throw new Error('Either html or text content must be provided');
    }

    const { data, error } = await resend.emails.send(emailData);

    if (error) {
      console.error('Resend error:', error);
      throw new Error(`Failed to send email: ${error.message || 'Unknown error'}`);
    }

    console.log('Email sent successfully:', data?.id);
    return data;
  } catch (error) {
    console.error('Email service error:', error);
    throw error;
  }
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (options: PasswordResetEmailOptions) => {
  const { to, resetUrl, userName } = options;
  
  const subject = 'Reset Your Password - URL Shortener';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Reset Your Password</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          max-width: 600px; 
          margin: 0 auto; 
          padding: 20px; 
        }
        .header { 
          background-color: #3b82f6; 
          color: white; 
          padding: 20px; 
          text-align: center; 
          border-radius: 8px 8px 0 0; 
        }
        .content { 
          background-color: #f8fafc; 
          padding: 30px; 
          border-radius: 0 0 8px 8px; 
        }
        .button { 
          display: inline-block; 
          background-color: #3b82f6; 
          color: white; 
          padding: 12px 24px; 
          text-decoration: none; 
          border-radius: 6px; 
          font-weight: bold; 
          margin: 20px 0; 
        }
        .footer { 
          margin-top: 20px; 
          font-size: 12px; 
          color: #666; 
        }
        .warning {
          background-color: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 12px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🔐 Password Reset Request</h1>
      </div>
      
      <div class="content">
        <h2>Hello${userName ? ` ${userName}` : ''}!</h2>
        
        <p>We received a request to reset your password for your URL Shortener account.</p>
        
        <p>Click the button below to reset your password:</p>
        
        <p style="text-align: center;">
          <a href="${resetUrl}" class="button">Reset Password</a>
        </p>
        
        <div class="warning">
          <strong>⚠️ Important:</strong> This link will expire in 1 hour for security reasons.
        </div>
        
        <p>If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.</p>
        
        <p>If the button above doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; background-color: #e5e7eb; padding: 10px; border-radius: 4px;">
          ${resetUrl}
        </p>
        
        <div class="footer">
          <p>Best regards,<br>The URL Shortener Team</p>
          <p><small>This is an automated email. Please do not reply to this message.</small></p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `
    Hello${userName ? ` ${userName}` : ''}!
    
    We received a request to reset your password for your URL Shortener account.
    
    Click the following link to reset your password:
    ${resetUrl}
    
    This link will expire in 1 hour for security reasons.
    
    If you didn't request this password reset, you can safely ignore this email.
    
    Best regards,
    The URL Shortener Team
  `;

  return sendEmail({
    to,
    subject,
    html,
    text
  });
};

/**
 * Send welcome email to new users
 */
export const sendWelcomeEmail = async (options: WelcomeEmailOptions) => {
  const { to, userName } = options;
  
  const subject = 'Welcome to URL Shortener! 🎉';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Welcome to URL Shortener</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          max-width: 600px; 
          margin: 0 auto; 
          padding: 20px; 
        }
        .header { 
          background: linear-gradient(135deg, #3b82f6, #1d4ed8); 
          color: white; 
          padding: 30px 20px; 
          text-align: center; 
          border-radius: 8px 8px 0 0; 
        }
        .content { 
          background-color: #f8fafc; 
          padding: 30px; 
          border-radius: 0 0 8px 8px; 
        }
        .feature { 
          background-color: white; 
          padding: 20px; 
          margin: 15px 0; 
          border-radius: 6px; 
          border-left: 4px solid #3b82f6; 
        }
        .button { 
          display: inline-block; 
          background-color: #3b82f6; 
          color: white; 
          padding: 12px 24px; 
          text-decoration: none; 
          border-radius: 6px; 
          font-weight: bold; 
          margin: 20px 0; 
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎉 Welcome to URL Shortener!</h1>
        <p>Your account has been created successfully</p>
      </div>
      
      <div class="content">
        <h2>Hello ${userName}!</h2>
        
        <p>Thank you for joining URL Shortener! We're excited to have you on board.</p>
        
        <h3>What you can do now:</h3>
        
        <div class="feature">
          <h4>🔗 Shorten URLs</h4>
          <p>Create short, memorable links from long URLs</p>
        </div>
        
        <div class="feature">
          <h4>📊 Track Analytics</h4>
          <p>Monitor clicks, geographical data, and referrer information</p>
        </div>
        
        <div class="feature">
          <h4>🛡️ Custom Codes & Password Protection</h4>
          <p>Available with PRO plans for enhanced control</p>
        </div>
        
        <p style="text-align: center;">
          <a href="${process.env.FRONTEND_URL}/dashboard" class="button">Get Started</a>
        </p>
        
        <p>If you have any questions, feel free to reach out to our support team.</p>
        
        <p>Best regards,<br>The URL Shortener Team</p>
      </div>
    </body>
    </html>
  `;
  
  const text = `
    Welcome to URL Shortener, ${userName}!
    
    Thank you for joining us! Your account has been created successfully.
    
    What you can do now:
    - Shorten URLs and create memorable links
    - Track analytics with click data and geographical information
    - Use custom codes and password protection (PRO plans)
    
    Get started at: ${process.env.FRONTEND_URL}/dashboard
    
    Best regards,
    The URL Shortener Team
  `;

  return sendEmail({
    to,
    subject,
    html,
    text
  });
};

export default {
  sendEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail
};
