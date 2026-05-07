/**
 * SMS provider abstraction.
 *
 * Production uses Unifonic (Saudi-licensed sender ID, ~5s delivery in KSA).
 * Dev logs to the console so you can copy the OTP from your terminal
 * without burning real SMS credits.
 *
 * Switch by setting SMS_PROVIDER=unifonic plus the Unifonic env vars.
 */

export type SmsProvider = {
  send: (phoneNumber: string, body: string) => Promise<void>;
};

const consoleProvider: SmsProvider = {
  async send(phoneNumber, body) {
    const masked = phoneNumber.slice(0, 4) + '****' + phoneNumber.slice(-2);
    console.log(`[sms:console] → ${masked}\n  ${body}`);
  },
};

const unifonicProvider: SmsProvider = {
  async send(phoneNumber, body) {
    const appSid = process.env.UNIFONIC_APP_SID;
    const senderId = process.env.UNIFONIC_SENDER_ID || 'Estrogen';
    const apiUrl =
      process.env.UNIFONIC_API_URL ||
      'https://api.unifonic.com/rest/SMS/messages';
    if (!appSid)
      throw new Error('UNIFONIC_APP_SID is not set; cannot send SMS in production mode');

    const params = new URLSearchParams({
      AppSid: appSid,
      Recipient: phoneNumber.replace(/^\+/, ''),
      Body: body,
      SenderID: senderId,
      async: 'false',
    });
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    if (!res.ok) {
      const text = await res.text();
      const safe = phoneNumber.slice(0, 4) + '****' + phoneNumber.slice(-2);
      console.error(`[sms:unifonic] failed for ${safe}: ${res.status} ${text}`);
      throw new Error('sms_send_failed');
    }
  },
};

export function smsProvider(): SmsProvider {
  const choice = (process.env.SMS_PROVIDER || 'console').toLowerCase();
  switch (choice) {
    case 'unifonic':
      return unifonicProvider;
    case 'console':
    default:
      return consoleProvider;
  }
}
