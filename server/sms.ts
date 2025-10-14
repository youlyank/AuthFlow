import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

let twilioClient: twilio.Twilio | null = null;

if (accountSid && authToken && fromNumber) {
  twilioClient = twilio(accountSid, authToken);
  console.log('✅ Twilio SMS service initialized');
} else {
  console.log('⚠️  Twilio SMS service not configured (missing credentials)');
}

export interface SMSMessage {
  to: string;
  body: string;
}

export async function sendSMS(message: SMSMessage): Promise<boolean> {
  if (!twilioClient || !fromNumber) {
    console.error('Twilio SMS service not configured');
    return false;
  }

  try {
    const result = await twilioClient.messages.create({
      body: message.body,
      from: fromNumber,
      to: message.to,
    });

    console.log(`SMS sent successfully to ${message.to}, SID: ${result.sid}`);
    return true;
  } catch (error: any) {
    console.error('Error sending SMS:', error.message);
    return false;
  }
}

export async function sendMFACode(phoneNumber: string, code: string): Promise<boolean> {
  return sendSMS({
    to: phoneNumber,
    body: `Your AuthFlow verification code is: ${code}. This code expires in 10 minutes.`,
  });
}

export async function sendSMSCode(phoneNumber: string, code: string): Promise<boolean> {
  return sendMFACode(phoneNumber, code);
}

export async function sendPasswordlessCode(phoneNumber: string, code: string): Promise<boolean> {
  return sendSMS({
    to: phoneNumber,
    body: `Your AuthFlow login code is: ${code}. This code expires in 10 minutes.`,
  });
}

export async function sendPhoneVerification(phoneNumber: string, code: string): Promise<boolean> {
  return sendSMS({
    to: phoneNumber,
    body: `Your AuthFlow phone verification code is: ${code}. Enter this code to verify your phone number.`,
  });
}

export function isSMSConfigured(): boolean {
  return !!twilioClient && !!fromNumber;
}
