import {
  Body,
  Button,
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

interface AdminInviteEmailProps {
  name?: string;
  email: string;
  tempPassword: string;
  roleLabel: string;
  loginUrl?: string;
}

export default function AdminInviteEmail({
  name,
  email,
  tempPassword,
  roleLabel,
  loginUrl = 'https://caissepro.app/login',
}: AdminInviteEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Vous avez été ajouté à l&apos;équipe admin CaissePro</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Text style={logoText}>CaissePro · Admin</Text>
          </Section>

          <Section style={heroSection}>
            <Heading style={h1}>Bienvenue dans l&apos;équipe{name ? `, ${name.split(' ')[0]}` : ''} !</Heading>
            <Text style={paragraph}>
              Vous avez été ajouté à l&apos;administration de CaissePro avec le rôle{' '}
              <strong>{roleLabel}</strong>. Connectez-vous pour accéder au panneau Super Admin.
            </Text>
          </Section>

          <Section style={credSection}>
            <Text style={credTitle}>Vos identifiants de connexion</Text>
            <Text style={credItem}>
              <span style={credLabel}>Email :</span> {email}
            </Text>
            <Text style={credItem}>
              <span style={credLabel}>Mot de passe temporaire :</span> {tempPassword}
            </Text>
          </Section>

          <Section style={ctaSection}>
            <Button style={button} href={loginUrl}>
              Me connecter
            </Button>
            <Text style={smallNote}>
              Connectez-vous, puis cliquez sur « Accéder à l&apos;administration ». Changez votre
              mot de passe après la première connexion.
            </Text>
          </Section>

          <Hr style={hr} />

          <Text style={footerSmall}>© 2026 CaissePro. Tous droits réservés.</Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#f6f9f6',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};
const container = { margin: '0 auto', padding: '20px 0 48px', maxWidth: '560px' };
const logoSection = {
  backgroundColor: '#0f172a',
  borderRadius: '8px 8px 0 0',
  padding: '24px 40px',
  textAlign: 'center' as const,
};
const logoText = { color: '#ffffff', fontSize: '26px', fontWeight: '800', margin: '0', letterSpacing: '-0.5px' };
const heroSection = { backgroundColor: '#ffffff', padding: '40px 40px 24px' };
const h1 = { color: '#16a34a', fontSize: '24px', fontWeight: '700', margin: '0 0 16px', padding: '0' };
const paragraph = { color: '#374151', fontSize: '16px', lineHeight: '26px', margin: '0' };
const credSection = {
  backgroundColor: '#f0fdf4',
  borderLeft: '4px solid #16a34a',
  margin: '0',
  padding: '24px 40px',
};
const credTitle = {
  color: '#15803d',
  fontSize: '14px',
  fontWeight: '700',
  margin: '0 0 12px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};
const credItem = { color: '#374151', fontSize: '15px', margin: '0 0 8px', lineHeight: '22px' };
const credLabel = { fontWeight: '700' as const, color: '#15803d' };
const ctaSection = { backgroundColor: '#ffffff', padding: '32px 40px 40px', textAlign: 'center' as const };
const button = {
  backgroundColor: '#16a34a',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '700',
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '14px 32px',
  display: 'inline-block',
};
const smallNote = { color: '#6b7280', fontSize: '13px', margin: '16px 0 0' };
const hr = { borderColor: '#e5e7eb', margin: '0 40px' };
const footerSmall = {
  color: '#9ca3af',
  fontSize: '12px',
  textAlign: 'center' as const,
  padding: '16px 40px 0',
};
