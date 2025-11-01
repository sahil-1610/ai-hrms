/**
 * Email templates for candidate notifications
 * Each template returns HTML content for the email
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Email wrapper with consistent styling
const emailWrapper = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Application Update</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f4f4f5;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 20px;
      color: #1f2937;
    }
    .message {
      margin-bottom: 30px;
      color: #4b5563;
      line-height: 1.8;
    }
    .job-details {
      background-color: #f9fafb;
      border-left: 4px solid #667eea;
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .job-details h3 {
      margin: 0 0 10px 0;
      color: #1f2937;
      font-size: 18px;
    }
    .job-details p {
      margin: 5px 0;
      color: #6b7280;
    }
    .status-badge {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: 600;
      font-size: 14px;
      margin: 10px 0;
    }
    .status-submitted { background-color: #dbeafe; color: #1e40af; }
    .status-shortlisted { background-color: #d1fae5; color: #065f46; }
    .status-rejected { background-color: #fee2e2; color: #991b1b; }
    .status-interviewing { background-color: #fef3c7; color: #92400e; }
    .status-offered { background-color: #e0e7ff; color: #3730a3; }
    .status-hired { background-color: #d1fae5; color: #065f46; }
    .button {
      display: inline-block;
      padding: 14px 28px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
      transition: transform 0.2s;
    }
    .button:hover {
      transform: translateY(-2px);
    }
    .footer {
      background-color: #f9fafb;
      padding: 30px;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
      border-top: 1px solid #e5e7eb;
    }
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
    .divider {
      height: 1px;
      background-color: #e5e7eb;
      margin: 30px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚀 AI-Powered HRMS</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>This is an automated message from AI HRMS.</p>
      <p>Please do not reply to this email.</p>
      <p><a href="${APP_URL}">Visit our website</a></p>
    </div>
  </div>
</body>
</html>
`;

/**
 * Application Submitted - Confirmation email
 */
export const applicationSubmittedTemplate = (
  candidateName,
  jobTitle,
  applicationToken
) => {
  const trackingUrl = `${APP_URL}/status/${applicationToken}`;

  const content = `
    <div class="greeting">Hi ${candidateName},</div>
    <div class="message">
      <p>Thank you for applying! We've successfully received your application.</p>
    </div>
    
    <div class="job-details">
      <h3>📋 ${jobTitle}</h3>
      <p><span class="status-badge status-submitted">Application Submitted</span></p>
    </div>
    
    <div class="message">
      <p><strong>What happens next?</strong></p>
      <ul>
        <li>Our AI will analyze your resume and match it with the job requirements</li>
        <li>Our HR team will review your application</li>
        <li>We'll update you at every step of the process</li>
      </ul>
    </div>
    
    <div style="text-align: center;">
      <a href="${trackingUrl}" class="button">Track Your Application</a>
    </div>
    
    <div class="message" style="margin-top: 30px;">
      <p style="font-size: 14px; color: #6b7280;">
        💡 <strong>Pro Tip:</strong> Bookmark the tracking link above to check your application status anytime!
      </p>
    </div>
  `;

  return emailWrapper(content);
};

/**
 * Application Shortlisted - Invitation email
 */
export const applicationShortlistedTemplate = (
  candidateName,
  jobTitle,
  applicationToken
) => {
  const trackingUrl = `${APP_URL}/status/${applicationToken}`;

  const content = `
    <div class="greeting">Congratulations ${candidateName}! 🎉</div>
    <div class="message">
      <p>Great news! Your application has been shortlisted for the next round.</p>
    </div>
    
    <div class="job-details">
      <h3>📋 ${jobTitle}</h3>
      <p><span class="status-badge status-shortlisted">Shortlisted</span></p>
    </div>
    
    <div class="message">
      <p>Your resume and qualifications impressed our team. You're one step closer to joining us!</p>
      <p><strong>What's next?</strong></p>
      <ul>
        <li>You may receive an invitation for an online assessment</li>
        <li>Our HR team will reach out for the next steps</li>
        <li>Keep an eye on your email for updates</li>
      </ul>
    </div>
    
    <div style="text-align: center;">
      <a href="${trackingUrl}" class="button">View Application Status</a>
    </div>
  `;

  return emailWrapper(content);
};

/**
 * Test Invitation - MCQ Test
 */
export const testInvitationTemplate = (
  candidateName,
  jobTitle,
  testToken,
  durationMinutes
) => {
  const testUrl = `${APP_URL}/test/${testToken}`;

  const content = `
    <div class="greeting">Hi ${candidateName},</div>
    <div class="message">
      <p>You've been invited to take an online assessment for the following position:</p>
    </div>
    
    <div class="job-details">
      <h3>📋 ${jobTitle}</h3>
      <p><span class="status-badge status-interviewing">Assessment Invited</span></p>
      <p><strong>⏱️ Duration:</strong> ${durationMinutes} minutes</p>
      <p><strong>📝 Format:</strong> Multiple Choice Questions</p>
    </div>
    
    <div class="message">
      <p><strong>Important Instructions:</strong></p>
      <ul>
        <li>Complete the test in one sitting (no pause option)</li>
        <li>Ensure stable internet connection</li>
        <li>Find a quiet environment</li>
        <li>You have only ONE attempt</li>
      </ul>
    </div>
    
    <div style="text-align: center;">
      <a href="${testUrl}" class="button">Start Assessment</a>
    </div>
    
    <div class="message" style="margin-top: 30px;">
      <p style="font-size: 14px; color: #6b7280;">
        ⚠️ This link is unique to you. Please don't share it with anyone.
      </p>
    </div>
  `;

  return emailWrapper(content);
};

/**
 * Interview Scheduled
 */
export const interviewScheduledTemplate = (
  candidateName,
  jobTitle,
  applicationToken
) => {
  const trackingUrl = `${APP_URL}/status/${applicationToken}`;

  const content = `
    <div class="greeting">Hi ${candidateName},</div>
    <div class="message">
      <p>Congratulations! You've been selected for an interview.</p>
    </div>
    
    <div class="job-details">
      <h3>📋 ${jobTitle}</h3>
      <p><span class="status-badge status-interviewing">Interview Scheduled</span></p>
    </div>
    
    <div class="message">
      <p>Our HR team will contact you shortly with the interview details including:</p>
      <ul>
        <li>Interview date and time</li>
        <li>Interview format (video/audio/in-person)</li>
        <li>Interviewers and panel details</li>
        <li>Any preparation materials</li>
      </ul>
    </div>
    
    <div style="text-align: center;">
      <a href="${trackingUrl}" class="button">View Application Status</a>
    </div>
    
    <div class="message" style="margin-top: 30px;">
      <p style="font-size: 14px; color: #6b7280;">
        💡 <strong>Tip:</strong> Research our company and review the job description to prepare!
      </p>
    </div>
  `;

  return emailWrapper(content);
};

/**
 * Offer Extended
 */
export const offerExtendedTemplate = (
  candidateName,
  jobTitle,
  applicationToken
) => {
  const trackingUrl = `${APP_URL}/status/${applicationToken}`;

  const content = `
    <div class="greeting">Congratulations ${candidateName}! 🎊</div>
    <div class="message">
      <p>We are delighted to extend an offer to you for the following position:</p>
    </div>
    
    <div class="job-details">
      <h3>📋 ${jobTitle}</h3>
      <p><span class="status-badge status-offered">Offer Extended</span></p>
    </div>
    
    <div class="message">
      <p>Your skills, experience, and interview performance have impressed our team.</p>
      <p><strong>Next Steps:</strong></p>
      <ul>
        <li>Our HR team will contact you with the offer details</li>
        <li>Review the offer letter carefully</li>
        <li>Feel free to ask any questions</li>
        <li>We look forward to welcoming you to our team!</li>
      </ul>
    </div>
    
    <div style="text-align: center;">
      <a href="${trackingUrl}" class="button">View Application Status</a>
    </div>
  `;

  return emailWrapper(content);
};

/**
 * Application Hired - Welcome email
 */
export const applicationHiredTemplate = (candidateName, jobTitle) => {
  const content = `
    <div class="greeting">Welcome aboard, ${candidateName}! 🎉</div>
    <div class="message">
      <p>We're thrilled to have you join our team!</p>
    </div>
    
    <div class="job-details">
      <h3>📋 ${jobTitle}</h3>
      <p><span class="status-badge status-hired">Hired</span></p>
    </div>
    
    <div class="message">
      <p>Your journey with us is just beginning. Here's what to expect:</p>
      <ul>
        <li>Onboarding documentation will be sent shortly</li>
        <li>You'll receive your start date confirmation</li>
        <li>Pre-joining formalities and paperwork details</li>
        <li>Welcome kit and access credentials</li>
      </ul>
    </div>
    
    <div class="message" style="margin-top: 30px;">
      <p>We're excited to see the great things you'll accomplish with our team!</p>
    </div>
  `;

  return emailWrapper(content);
};

/**
 * Application Rejected - Polite rejection
 */
export const applicationRejectedTemplate = (candidateName, jobTitle) => {
  const content = `
    <div class="greeting">Hi ${candidateName},</div>
    <div class="message">
      <p>Thank you for your interest in the following position:</p>
    </div>
    
    <div class="job-details">
      <h3>📋 ${jobTitle}</h3>
      <p><span class="status-badge status-rejected">Not Selected</span></p>
    </div>
    
    <div class="message">
      <p>After careful consideration, we've decided to move forward with other candidates whose qualifications more closely match our current requirements.</p>
      
      <p>We appreciate the time you invested in the application process. Your skills and experience are valuable, and we encourage you to:</p>
      <ul>
        <li>Apply for other positions that match your expertise</li>
        <li>Keep an eye on our careers page for future opportunities</li>
        <li>Continue building your skills and experience</li>
      </ul>
    </div>
    
    <div class="message">
      <p>We wish you all the best in your career journey!</p>
    </div>
    
    <div style="text-align: center; margin-top: 30px;">
      <a href="${APP_URL}/jobs" class="button">View Open Positions</a>
    </div>
  `;

  return emailWrapper(content);
};

/**
 * Generic status update template
 */
export const statusUpdateTemplate = (
  candidateName,
  jobTitle,
  status,
  applicationToken
) => {
  const trackingUrl = `${APP_URL}/status/${applicationToken}`;
  const statusClass = `status-${status.toLowerCase()}`;

  const content = `
    <div class="greeting">Hi ${candidateName},</div>
    <div class="message">
      <p>Your application status has been updated.</p>
    </div>
    
    <div class="job-details">
      <h3>📋 ${jobTitle}</h3>
      <p><span class="status-badge ${statusClass}">${status}</span></p>
    </div>
    
    <div style="text-align: center;">
      <a href="${trackingUrl}" class="button">View Full Details</a>
    </div>
  `;

  return emailWrapper(content);
};
