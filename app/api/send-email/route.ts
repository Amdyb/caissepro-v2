import { NextRequest, NextResponse } from 'next/server';
import React from 'react';
import { render } from '@react-email/components';
import { getResend } from '@/lib/email';
import WelcomeEmail from '@/lib/emails/welcome';
import ResetPasswordEmail from '@/lib/emails/reset-password';
import SaleNotificationEmail from '@/lib/emails/sale-notification';
import AdminInviteEmail from '@/lib/emails/admin-invite';

type EmailType = 'welcome' | 'reset-password' | 'sale-notification' | 'admin-invite';

interface SendEmailBody {
  type: EmailType;
  to: string;
  data: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  try {
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

    const emailConfigs: Record<EmailType, { subject: string; element: React.ReactElement }> = {
      welcome: {
        subject: `Bienvenue sur CaissePro — ${data.shopName ?? 'votre boutique'} est prête !`,
        element: React.createElement(WelcomeEmail, {
          shopName: data.shopName as string,
          ownerName: data.ownerName as string | undefined,
        }),
      },
      'reset-password': {
        subject: `Votre code de réinitialisation CaissePro : ${data.otp}`,
        element: React.createElement(ResetPasswordEmail, {
          otp: data.otp as string,
          ownerName: data.ownerName as string | undefined,
        }),
      },
      'sale-notification': {
        subject: `Nouvelle vente : ${data.amount} XOF — ${data.productName}`,
        element: React.createElement(SaleNotificationEmail, {
          amount: data.amount as number,
          productName: data.productName as string,
          customerName: data.customerName as string,
          timestamp: data.timestamp as string,
          shopName: data.shopName as string | undefined,
        }),
      },
      'admin-invite': {
        subject: "Vos identifiants administrateur CaissePro",
        element: React.createElement(AdminInviteEmail, {
          name: data.name as string | undefined,
          email: data.email as string,
          tempPassword: data.tempPassword as string,
          roleLabel: (data.roleLabel as string) || 'Admin',
          loginUrl: (data.loginUrl as string) || 'https://caissepro.app/admin/login',
        }),
      },
    };

    const config = emailConfigs[type];
    if (!config) {
      return NextResponse.json({ error: `Unknown email type: ${type}` }, { status: 400 });
    }

    let resend;
    try {
      resend = getResend();
    } catch {
      return NextResponse.json({ error: 'Email service not configured' }, { status: 503 });
    }

    const html = await render(config.element);

    const { data: result, error } = await resend.emails.send({
      from: 'CaissePro <noreply@caissepro.app>',
      to,
      subject: config.subject,
      html,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ id: result?.id }, { status: 200 });
  } catch (err) {
    console.error('Unhandled error in /api/send-email:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
