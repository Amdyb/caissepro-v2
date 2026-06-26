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

interface WelcomeEmailProps {
  shopName: string;
  ownerName?: string;
}

export default function WelcomeEmail({ shopName, ownerName }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Bienvenue sur CaissePro — votre boutique est prête !</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Text style={logoText}>CaissePro</Text>
          </Section>

          <Section style={heroSection}>
            <Heading style={h1}>Bienvenue sur CaissePro 🎉</Heading>
            {ownerName && (
              <Text style={greeting}>Bonjour {ownerName},</Text>
            )}
            <Text style={paragraph}>
              Votre boutique <strong style={shopNameStyle}>{shopName}</strong> est maintenant
              active sur CaissePro. Vous pouvez dès maintenant gérer vos ventes, suivre votre
              inventaire et développer votre activité.
            </Text>
          </Section>

          <Section style={featuresSection}>
            <Text style={featuresTitle}>Ce que vous pouvez faire :</Text>
            <Text style={featureItem}>✅ Enregistrer vos ventes rapidement</Text>
            <Text style={featureItem}>✅ Gérer votre inventaire en temps réel</Text>
            <Text style={featureItem}>✅ Suivre vos performances avec des rapports détaillés</Text>
            <Text style={featureItem}>✅ Gérer plusieurs caisses et employés</Text>
          </Section>

          <Section style={ctaSection}>
            <Button style={button} href="https://caissepro.app">
              Accéder à ma boutique
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            Besoin d&apos;aide ? Contactez notre équipe à{' '}
            <a href="mailto:support@caissepro.app" style={link}>
              support@caissepro.app
            </a>
          </Text>
          <Text style={footerSmall}>
            © 2025 CaissePro. Tous droits réservés.
          </Text>
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

const heroSection = {
  backgroundColor: '#ffffff',
  padding: '40px 40px 24px',
};

const h1 = {
  color: '#16a34a',
  fontSize: '26px',
  fontWeight: '700',
  margin: '0 0 16px',
  padding: '0',
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

const shopNameStyle = {
  color: '#16a34a',
};

const featuresSection = {
  backgroundColor: '#f0fdf4',
  borderLeft: '4px solid #16a34a',
  margin: '0',
  padding: '24px 40px',
};

const featuresTitle = {
  color: '#15803d',
  fontSize: '14px',
  fontWeight: '700',
  margin: '0 0 12px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

const featureItem = {
  color: '#374151',
  fontSize: '15px',
  margin: '0 0 8px',
  lineHeight: '22px',
};

const ctaSection = {
  backgroundColor: '#ffffff',
  padding: '32px 40px 40px',
  textAlign: 'center' as const,
};

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

const hr = {
  borderColor: '#e5e7eb',
  margin: '0 40px',
};

const footer = {
  color: '#6b7280',
  fontSize: '14px',
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

const link = {
  color: '#16a34a',
  textDecoration: 'none',
};
