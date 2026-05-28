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

interface SaleNotificationEmailProps {
  amount: number;
  productName: string;
  customerName: string;
  timestamp: string;
  shopName?: string;
}

function formatXOF(amount: number): string {
  return new Intl.NumberFormat('fr-SN', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function SaleNotificationEmail({
  amount,
  productName,
  customerName,
  timestamp,
  shopName,
}: SaleNotificationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Nouvelle vente : {formatXOF(amount)} — {productName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Text style={logoText}>CaissePro</Text>
          </Section>

          <Section style={headerSection}>
            <Text style={badge}>NOUVELLE VENTE</Text>
            <Heading style={amount_heading}>{formatXOF(amount)}</Heading>
            <Text style={timestampText}>{timestamp}</Text>
          </Section>

          <Section style={detailsSection}>
            <Text style={detailsTitle}>Détails de la vente</Text>

            <table style={table}>
              <tbody>
                <tr>
                  <td style={labelCell}>Produit</td>
                  <td style={valueCell}>{productName}</td>
                </tr>
                <tr>
                  <td style={labelCell}>Client</td>
                  <td style={valueCell}>{customerName}</td>
                </tr>
                <tr>
                  <td style={labelCell}>Montant</td>
                  <td style={{ ...valueCell, color: '#16a34a', fontWeight: '700' }}>
                    {formatXOF(amount)}
                  </td>
                </tr>
                {shopName && (
                  <tr>
                    <td style={labelCell}>Boutique</td>
                    <td style={valueCell}>{shopName}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            Notification automatique de{' '}
            <a href="https://caissepro.app" style={link}>
              CaissePro
            </a>
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

const headerSection = {
  backgroundColor: '#ffffff',
  padding: '40px 40px 24px',
  textAlign: 'center' as const,
};

const badge = {
  backgroundColor: '#dcfce7',
  borderRadius: '20px',
  color: '#15803d',
  display: 'inline-block',
  fontSize: '12px',
  fontWeight: '700',
  letterSpacing: '1.5px',
  margin: '0 0 16px',
  padding: '4px 16px',
  textTransform: 'uppercase' as const,
};

const amount_heading = {
  color: '#16a34a',
  fontSize: '42px',
  fontWeight: '800',
  margin: '0 0 8px',
  letterSpacing: '-1px',
};

const timestampText = {
  color: '#9ca3af',
  fontSize: '13px',
  margin: '0',
};

const detailsSection = {
  backgroundColor: '#ffffff',
  padding: '0 40px 40px',
};

const detailsTitle = {
  color: '#374151',
  fontSize: '14px',
  fontWeight: '700',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0 0 16px',
  borderBottom: '1px solid #e5e7eb',
  paddingBottom: '8px',
};

const table = {
  width: '100%',
  borderCollapse: 'collapse' as const,
};

const labelCell = {
  color: '#6b7280',
  fontSize: '14px',
  padding: '10px 0',
  width: '40%',
  borderBottom: '1px solid #f3f4f6',
};

const valueCell = {
  color: '#111827',
  fontSize: '15px',
  fontWeight: '500',
  padding: '10px 0',
  borderBottom: '1px solid #f3f4f6',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '0 40px',
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

const link = {
  color: '#16a34a',
  textDecoration: 'none',
};
