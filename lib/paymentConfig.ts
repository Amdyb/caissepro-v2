// Payment method feature flags.
//
// Manual Wave / Orange Money is the PRIMARY (and currently only) billing method.
// Card (Stripe) and PayDunya code is kept in place but hidden behind these flags
// until the provider paperwork is approved — flip to `true` to re-enable.
export const PAYMENTS_CARD_ENABLED = false
export const PAYMENTS_PAYDUNYA_ENABLED = false

// Fallback used everywhere if no admin payment number is configured in settings.
export const DEFAULT_PAYMENT_NUMBER = '+221784581111'
