import { v4 as uuidv4 } from "uuid";
import {
  Participant,
  Bill,
  Result,
  PaymentDetails,
  Balances,
  Session,
} from "./types";

export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);

export const generateUniqueIds = (count: number): string[] =>
  Array.from({ length: count }, () => uuidv4());

export const calculateResults = (
  participants: Participant[],
  bills: Bill[]
): { results: Result[]; balances: Balances } => {
  const balances: Balances = {};

  participants.forEach((participant) => {
    balances[participant.id] = 0;
  });

  bills.forEach((bill) => {
    if (bill.sharedBy && bill.sharedBy.length > 0) {
      const share = bill.amount / bill.sharedBy.length;
      balances[bill.paidBy] -= bill.amount;
      bill.sharedBy.forEach((person) => {
        balances[person] += share;
      });
    }
  });

  const results: Result[] = participants.map((participant) => ({
    name: participant.name,
    balance: balances[participant.id],
  }));

  return { results, balances };
};

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

export function convertToUserFriendlyDate(isoDate: string): string {
  const date = new Date(isoDate);

  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: true, // For 12-hour format with AM/PM
  };

  return date.toLocaleString("vi-VN", options);
}

export const getCalculatedResults = (session: Session): Result[] => {
  const { participant, bills } = session;

  const { results } = calculateResults(participant, bills);

  return results;
};

export const getCalculatedPayments = (session: Session): PaymentDetails[] => {
  const { participant, bills } = session;

  const { balances } = calculateResults(participant, bills);

  const payments = calculatePayments(balances);

  return mapPaymentDetails(payments, participant);
};
