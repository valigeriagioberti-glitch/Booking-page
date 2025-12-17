import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY!);

export const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ||
  "Luggage Deposit Rome <onboarding@resend.dev>";

export const ADMIN_EMAIL =
  process.env.RESEND_ADMIN_EMAIL || "you@example.com";
