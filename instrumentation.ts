export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const Sentry = await import('@sentry/nextjs');
    Sentry.init({
      dsn: 'https://9c5a48dc7b355fd406004a8f3ade1186@o4511468068339712.ingest.de.sentry.io/4511468071616592',
      environment: process.env.NODE_ENV,
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      debug: false,
    });
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    const Sentry = await import('@sentry/nextjs');
    Sentry.init({
      dsn: 'https://9c5a48dc7b355fd406004a8f3ade1186@o4511468068339712.ingest.de.sentry.io/4511468071616592',
      environment: process.env.NODE_ENV,
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      debug: false,
    });
  }
}
