// Client Doit (customer debts). The implementation lives in app/debts/page.tsx
// (title "Client Doit"); this route re-exports it so the menu's "Client Doit"
// link and the /client-doit path resolve to the same working page — single
// source of truth, no duplication.
export { default } from '../debts/page'
