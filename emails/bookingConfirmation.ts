export function bookingConfirmationEmail(booking: {
  bookingRef?: string;
  dropoffDate?: string;
  pickupDate?: string;
  total?: number;
}) {
  const ref = booking.bookingRef || "N/A";
  const drop = booking.dropoffDate || "N/A";
  const pick = booking.pickupDate || "N/A";
  const total = typeof booking.total === "number" ? booking.total.toFixed(2) : "0.00";

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; line-height: 1.5;">
      <h2 style="margin: 0 0 12px;">✅ Booking Confirmed</h2>
      <p style="margin: 0 0 12px;">Thank you for your booking!</p>

      <div style="padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <p style="margin: 0 0 6px;"><strong>Booking reference:</strong> ${ref}</p>
        <p style="margin: 0 0 6px;"><strong>Drop-off:</strong> ${drop}</p>
        <p style="margin: 0 0 6px;"><strong>Pick-up:</strong> ${pick}</p>
        <p style="margin: 0;"><strong>Total paid:</strong> €${total}</p>
      </div>

      <p style="margin: 16px 0 0; color: #374151;">
        📍 <strong>Luggage Deposit Rome</strong><br/>
        Near Roma Termini • Open daily
      </p>
    </div>
  `;
}
