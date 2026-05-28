import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface ResetPasswordEmailProps {
  otp: string;
  ownerName?: string;
}

export default function ResetPasswordEmail({ otp, ownerName }: ResetPasswordEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Votre code de réinitialisation CaissePro : {otp}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Text style={logoText}>CaissePro</Text>
          </Section>

          <Section style={contentSection}>
            <Heading style={h1}>Réinitialisation du mot de passe</Heading>
            {ownerName && (
              <Text style={greeting}>Bonjour {ownerName},</Text>
            )}
            <Text style={paragraph}>
              Vous avez demandé à réinitialiser votre mot de passe. Utilisez le code
              ci-dessous pour continuer.
            </Text>
          </Section>

          <Section style={otpSection}>
            <Text style={otpLabel}>VOTRE CODE DE VÉRIFICATION</Text>
            <Text style={otpCode}>{otp}</Text>
            <Text style={expiryText}>⏱ Ce code expire dans <strong>15 minutes</strong></Text>
          </Section>

          <Section style={warningSection}>
            <Text style={warningText}>
              ⚠️ Si vous n&apos;avez pas demandé cette réinitialisation, ignorez cet
              email. Votre mot de passe ne sera pas modifié.
            </Text>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            Pour votre sécurité, ne partagez jamais ce code avec quelqu&apos;un d&apos;autre.
          </Text>
          <Text style={footerSmall}>© 2025 CaissePro. Tous droits réservés.</Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#f6f9f6',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '560px',
};

const logoSection = {
  backgroundColor: '#16a34a',
  borderRadius: '8px 8px 0 0',
  padding: '24px 40px',
  textAlign: 'center' as const,
};

const logoText = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: '800',
  margin: '0',
  letterSpacing: '-0.5px',
};

const contentSection = {
  backgroundColor: '#ffffff',
  padding: '40px 40px 24px',
};

const h1 = {
  color: '#111827',
  fontSize: '24px',
  fontWeight: '700',
  margin: '0 0 16px',
};

const greeting = {
  color: '#374151',
  fontSize: '16px',
  margin: '0 0 16px',
};

const paragraph = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '0',
};

const otpSection = {
  backgroundColor: '#ffffff',
  padding: '8px 40px 32px',
  textAlign: 'center' as const,
};

const otpLabel = {
  color: '#6b7280',
  fontSize: '12px',
  fontWeight: '700',
  letterSpacing: '2px',
  textTransform: 'uppercase' as const,
  margin: '0 0 16px',
};

const otpCode = {
  backgroundColor: '#f0fdf4',
  border: '2px solid #16a34a',
  borderRadius: '12px',
  color: '#15803d',
  display: 'block',
  fontSize: '48px',
  fontWeight: '800',
  letterSpacing: '12px',
  margin: '0 auto 16px',
  padding: '20px 32px',
  textAlign: 'center' as const,
  fontFamily: 'monospace',
};

const expiryText = {
  color: '#dc2626',
  fontSize: '14px',
  margin: '0',
};

const warningSection = {
  backgroundColor: '#fefce8',
  borderLeft: '4px solid #eab308',
  margin: '0 0',
  padding: '16px 40px',
};

const warningText = {
  color: '#713f12',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '32px 40px 0',
};

const footer = {
  color: '#6b7280',
  fontSize: '13px',
  lineHeight: '22px',
  padding: '24px 40px 0',
  textAlign: 'center' as const,
};

const footerSmall = {
  color: '#9ca3af',
  fontSize: '12px',
  textAlign: 'center' as const,
  padding: '8px 40px 0',
};
