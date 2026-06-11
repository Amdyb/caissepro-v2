import { NextRequest, NextResponse } from 'next/server'
import { getResend } from '@/lib/email'

interface ExportFile {
  filename: string
  contentBase64: string
}

interface Body {
  to: string
  businessName?: string
  files: ExportFile[]
}

export async function POST(request: NextRequest) {
  let body: Body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { to, businessName, files } = body
  if (!to || !Array.isArray(files) || files.length === 0) {
    return NextResponse.json({ error: 'Missing recipient or files' }, { status: 400 })
  }

  let resend
  try {
    resend = getResend()
  } catch {
    return NextResponse.json({ error: 'Service email non configuré (RESEND_API_KEY manquant).' }, { status: 503 })
  }

  const date = new Date().toLocaleDateString('fr-FR')
  const shop = businessName || 'votre boutique'

  try {
    const { data, error } = await resend.emails.send({
      from: 'CaissePro <noreply@caissepro.app>',
      to,
      subject: `Export de vos données — ${shop} (${date})`,
      html: `<div style="font-family:sans-serif;color:#0f172a">
        <h2 style="font-weight:900">Vos données CaissePro</h2>
        <p>Voici l'export des données de <strong>${shop}</strong> demandé le ${date}.</p>
        <p>Les fichiers CSV sont joints à cet email. Vous pouvez les ouvrir avec Excel, Google Sheets ou Numbers.</p>
        <p style="color:#64748b;font-size:13px">CaissePro — gardez toujours une copie de vos données.</p>
      </div>`,
      attachments: files.map((f) => ({
        filename: f.filename,
        content: Buffer.from(f.contentBase64, 'base64'),
      })),
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ id: data?.id }, { status: 200 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur envoi email' },
      { status: 500 }
    )
  }
}
