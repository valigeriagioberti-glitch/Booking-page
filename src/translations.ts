import { BagSize, Language } from './types';

export const translations = {
  en: {
    header: {
      returnHome: "Return to Home",
      subtitle: "ROME"
    },
    hero: {
      title: "Secure Luggage Storage in",
      city: "Rome",
      subtitle: "Book online in 2 minutes. Secure payment. Free cancellation up to 24h before."
    },
    bookingForm: {
      title: "Book Your Space",
      subtitle: "Select your dates and luggage details below.",
      section1: "1. Select Bags",
      section2: "2. Dates",
      section3: "3. Your Details",
      required: "(Required)",
      dropOff: "Drop-off Date",
      pickUp: "Pick-up Date",
      dropOffInfo: "Drop-off day is counted as a full billable day regardless of time.",
      namePlaceholder: "Full Name *",
      emailPlaceholder: "Email Address *",
      phonePlaceholder: "Phone Number *",
      bagDescriptions: {
        [BagSize.Small]: "Handbags, backpacks, laptop bags",
        [BagSize.Medium]: "Cabin suitcase, carry-on (up to 10kg)",
        [BagSize.Large]: "Check-in suitcase, bulky items"
      }
    },
    summary: {
      title: "Booking Summary",
      dropOff: "Drop-off",
      pickUp: "Pick-up",
      duration: "Duration",
      day: "day",
      days: "days",
      perDaySubtotal: "Per-day subtotal",
      billableDays: "Billable days",
      total: "Total",
      selectBags: "Select Bags",
      payReserve: "Pay & Reserve",
      processing: "Processing...",
      securePayment: "Secure payment via Stripe"
    },
    paymentModal: {
      title: "Secure Payment",
      cardInformation: "Card Information",
      cardNumber: "Card number",
      expiry: "MM / YY",
      cvc: "CVC",
      zip: "ZIP / Postal",
      payButton: "Pay",
      processing: "Processing Payment...",
      secureEncrypted: "Payments are secure and encrypted.",
      poweredBy: "Powered by",
      cancel: "Cancel"
    },
    success: {
      title: "Booking Confirmed ✅",
      subtitlePart1: "Your luggage storage reservation is confirmed. We've sent a confirmation email to",
      reference: "Booking Reference",
      paymentStatus: "Payment Status",
      paidVia: "PAID via Stripe",
      schedule: "Schedule",
      totalDuration: "Total Duration",
      customerDetails: "Customer Details",
      name: "Name:",
      email: "Email:",
      phone: "Phone:",
      bookedOn: "Booked on:",
      orderSummary: "Order Summary",
      item: "Item",
      qty: "Qty",
      rate: "Rate",
      subtotalDay: "Subtotal (Day)",
      bag: "Bag",
      totalBillableDays: "Total Billable Days",
      dailyRate: "Daily Rate",
      totalPaid: "Total Paid",
      printReceipt: "Print Receipt",
      downloadPdf: "Download PDF",
      newBooking: "New Booking",
      receiptHeader: "RECEIPT",
      billedTo: "Billed To",
      paidCreditCard: "Paid via Credit Card (Stripe)",
      description: "Description",
      amount: "Amount",
      luggageStorage: "Luggage Storage",
      thankYou: "Thank you for choosing Luggage Deposit Rome!",
      assistance: "For assistance, please contact support@luggagedepositrome.com",
      generatingPdf: "Generating PDF..."
    },
    alerts: {
      selectBag: "Please select at least one bag.",
      enterDetails: "Please enter your name, email address, and phone number.",
      validDates: "Please select valid dates.",
      paymentFailed: "Payment failed. Please try again.",
      fillPayment: "Please fill in all payment details."
    }
  },
  it: {
    header: {
      returnHome: "Torna alla Home",
      subtitle: "ROMA"
    },
    hero: {
      title: "Deposito Bagagli Sicuro a",
      city: "Roma",
      subtitle: "Prenota online in 2 minuti. Pagamento sicuro. Cancellazione gratuita fino a 24 ore prima."
    },
    bookingForm: {
      title: "Prenota il tuo spazio",
      subtitle: "Seleziona le date e i dettagli del bagaglio qui sotto.",
      section1: "1. Seleziona Bagagli",
      section2: "2. Date",
      section3: "3. I tuoi dati",
      required: "(Obbligatorio)",
      dropOff: "Data di consegna",
      pickUp: "Data di ritiro",
      dropOffInfo: "Il giorno di consegna viene conteggiato come un'intera giornata fatturabile indipendentemente dall'orario.",
      namePlaceholder: "Nome e Cognome *",
      emailPlaceholder: "Indirizzo Email *",
      phonePlaceholder: "Numero di Telefono *",
      bagDescriptions: {
        [BagSize.Small]: "Borse, zaini, borse per laptop",
        [BagSize.Medium]: "Bagaglio a mano (fino a 10kg)",
        [BagSize.Large]: "Valigia da stiva, oggetti ingombranti"
      }
    },
    summary: {
      title: "Riepilogo",
      dropOff: "Consegna",
      pickUp: "Ritiro",
      duration: "Durata",
      day: "giorno",
      days: "giorni",
      perDaySubtotal: "Subtotale giornaliero",
      billableDays: "Giorni fatturabili",
      total: "Totale",
      selectBags: "Seleziona Bagagli",
      payReserve: "Paga e Prenota",
      processing: "Elaborazione...",
      securePayment: "Pagamento sicuro via Stripe"
    },
    paymentModal: {
      title: "Pagamento Sicuro",
      cardInformation: "Dati Carta",
      cardNumber: "Numero carta",
      expiry: "MM / AA",
      cvc: "CVC",
      zip: "CAP",
      payButton: "Paga",
      processing: "Elaborazione...",
      secureEncrypted: "I pagamenti sono sicuri e crittografati.",
      poweredBy: "Powered by",
      cancel: "Annulla"
    },
    success: {
      title: "Prenotazione Confermata ✅",
      subtitlePart1: "La tua prenotazione è confermata. Abbiamo inviato un'email a",
      reference: "Riferimento",
      paymentStatus: "Stato Pagamento",
      paidVia: "PAGATO via Stripe",
      schedule: "Programma",
      totalDuration: "Durata Totale",
      customerDetails: "Dettagli Cliente",
      name: "Nome:",
      email: "Email:",
      phone: "Telefono:",
      bookedOn: "Prenotato il:",
      orderSummary: "Riepilogo Ordine",
      item: "Articolo",
      qty: "Qtà",
      rate: "Tariffa",
      subtotalDay: "Subtotale (Giorno)",
      bag: "Borsa",
      totalBillableDays: "Giorni Fatturabili",
      dailyRate: "Tariffa Giornaliera",
      totalPaid: "Totale Pagato",
      printReceipt: "Stampa Ricevuta",
      downloadPdf: "Scarica PDF",
      newBooking: "Nuova Prenotazione",
      receiptHeader: "RICEVUTA",
      billedTo: "Fatturato a",
      paidCreditCard: "Pagato con Carta di Credito (Stripe)",
      description: "Descrizione",
      amount: "Importo",
      luggageStorage: "Deposito Bagagli",
      thankYou: "Grazie per aver scelto Luggage Deposit Rome!",
      assistance: "Per assistenza: support@luggagedepositrome.com",
      generatingPdf: "Generazione PDF..."
    },
    alerts: {
      selectBag: "Seleziona almeno un bagaglio.",
      enterDetails: "Inserisci nome, email e numero di telefono.",
      validDates: "Seleziona date valide.",
      paymentFailed: "Pagamento fallito. Riprova.",
      fillPayment: "Compila tutti i dettagli di pagamento."
    }
  }
};