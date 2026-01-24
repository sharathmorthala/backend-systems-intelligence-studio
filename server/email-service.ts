// Resend integration for sending contact form emails
import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return { apiKey: connectionSettings.settings.api_key, fromEmail: connectionSettings.settings.from_email };
}

async function getUncachableResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail
  };
}

export interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

// Escape HTML to prevent injection attacks
function escapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  return text.replace(/[&<>"']/g, char => htmlEntities[char]);
}

// Recipient email - configure via environment variable for production
const CONTACT_RECIPIENT = process.env.CONTACT_EMAIL || 'morthalasharath@gmail.com';

export async function sendContactEmail(data: ContactFormData): Promise<{ success: boolean; error?: string }> {
  try {
    const { client } = await getUncachableResendClient();
    
    // Sanitize all user input before inserting into HTML
    const safeName = escapeHtml(data.name);
    const safeEmail = escapeHtml(data.email);
    const safeMessage = escapeHtml(data.message);
    
    // Use Resend's test sender - this works for sending to your own verified email
    // To use a custom domain, verify it at https://resend.com/domains
    const result = await client.emails.send({
      from: 'Backend Studio <onboarding@resend.dev>',
      to: CONTACT_RECIPIENT,
      subject: `Contact Form: Message from ${safeName}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>From:</strong> ${safeName}</p>
        <p><strong>Email:</strong> ${safeEmail}</p>
        <hr />
        <h3>Message:</h3>
        <p>${safeMessage.replace(/\n/g, '<br>')}</p>
        <hr />
        <p style="color: #666; font-size: 12px;">
          This message was sent from the Backend Systems Intelligence Studio contact form.
        </p>
      `,
      text: `
New Contact Form Submission

From: ${data.name}
Email: ${data.email}

Message:
${data.message}

---
This message was sent from the Backend Systems Intelligence Studio contact form.
      `
    });

    if (result.error) {
      console.error('Resend error:', result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Email service error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send email' };
  }
}
