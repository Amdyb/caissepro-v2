import { NextRequest, NextResponse } from 'next/server';
import { resend } from '@/lib/email';
import WelcomeEmail from '@/lib/emails/welcome';
import ResetPasswordEmail from '@/lib/emails/reset-password';
import SaleNotificationEmail from '@/lib/emails/sale-notification';

type EmailType = 'welcome' | 'reset-password' | 'sale-notification';

interface SendEmailBody {
  type: EmailType;
  to: string;
  data: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  let body: SendEmailBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { type, to, data } = body;

  if (!type || !to || !data) {
    return NextResponse.json({ error: 'Missing required fields: type, to, data' }, { status: 400 });
  }

  const emailConfigs: Record<EmailType, { subject: string; react: React.ReactElement }> = {
    welcome: {
      subject: `Bienvenue sur CaissePro — ${data.shopName ?? 'votre boutique'} est prête !`,
      react: WelcomeEmail({
        shopName: data.shopName as string,
        ownerName: data.ownerName as string | undefined,
      }),
    },
    'reset-password': {
      subject: `Votre code de réinitialisation CaissePro : ${data.otp}`,
      react: ResetPasswordEmail({
        otp: data.otp as string,
        ownerName: data.ownerName as string | undefined,
      }),
    },
    'sale-notification': {
      subject: `Nouvelle vente : ${data.amount} XOF — ${data.productName}`,
      react: SaleNotificationEmail({
        amount: data.amount as number,
        productName: data.productName as string,
        customerName: data.customerName as string,
        timestamp: data.timestamp as string,
        shopName: data.shopName as string | undefined,
      }),
    },
  };

  const config = emailConfigs[type];
  if (!config) {
    return NextResponse.json({ error: `Unknown email type: ${type}` }, { status: 400 });
  }

  const { data: result, error } = await resend.emails.send({
    from: 'CaissePro <noreply@caissepro.app>',
    to,
    subject: config.subject,
    react: config.react,
  });

  if (error) {
    console.error('Resend error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: result?.id }, { status: 200 });
}
