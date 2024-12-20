import { v4 as uuidv4 } from "uuid";
import { Participant, Bill, Result, PaymentDetails, Balances } from "./types";

// Format a number as currency
export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);

// Generate unique IDs for bills
export const generateUniqueIds = (count: number): string[] =>
  Array.from({ length: count }, () => uuidv4());

// Calculate results based on participants and bills
export const calculateResults = (
  participants: Participant[],
  bills: Bill[]
): { results: Result[]; balances: Balances } => {
  const balances: Balances = {};

  // Initialize balances with participant IDs
  participants.forEach((participant) => {
    balances[participant.id] = 0;
  });

  // Calculate balances
  bills.forEach((bill) => {
    if (bill.sharedBy && bill.sharedBy.length > 0) {
      const share = bill.amount / bill.sharedBy.length;
      balances[bill.paidBy] -= bill.amount;
      bill.sharedBy.forEach((person) => {
        balances[person] += share;
      });
    }
  });

  // Prepare result array
  const results: Result[] = participants.map((participant) => ({
    name: participant.name,
    balance: balances[participant.id],
  }));

  return { results, balances };
};

// Calculate payment details based on balances
export const calculatePayments = (balances: Balances): PaymentDetails[] => {
  const creditors = Object.entries(balances)
    .filter(([_, balance]) => balance < 0)
    .map(([id, balance]) => ({ id, balance: Math.abs(balance) }));

  const debtors = Object.entries(balances)
    .filter(([_, balance]) => balance > 0)
    .map(([id, balance]) => ({ id, balance }));

  const paymentDetails: PaymentDetails[] = [];

  while (debtors.length > 0 && creditors.length > 0) {
    const debtor = debtors[0];
    const creditor = creditors[0];

    const payment = Math.min(debtor.balance, creditor.balance);
    paymentDetails.push({
      from: debtor.id,
      to: creditor.id,
      amount: payment,
    });

    debtor.balance -= payment;
    creditor.balance -= payment;

    if (debtor.balance === 0) debtors.shift();
    if (creditor.balance === 0) creditors.shift();
  }
  return paymentDetails;
};

// Map payment details to participant names
export const mapPaymentDetails = (
  payments: PaymentDetails[],
  participants: Participant[]
): PaymentDetails[] => {
  const participantMap = new Map(
    participants.map((participant) => [participant.id, participant.name])
  );

  return payments.map((payment) => ({
    ...payment,
    from: participantMap.get(payment.from) || payment.from,
    to: participantMap.get(payment.to) || payment.to,
  }));
};

export const getParticipantNameById = (
  id: string,
  participantList: Participant[]
) => {
  const participant = participantList.find((p: Participant) => p.id === id);
  return participant ? participant.name : "Tên không xác định";
};