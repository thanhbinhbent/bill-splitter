import { ColumnsType } from "antd/es/table";

export interface Session {
  bills: Bill[];
  createDate: string;
  participant: Participant[];
}

// Participant
export interface Participant {
  id: string;
  name: string;
}

// Bill
export interface Bill {
  id: string;
  billName: string;
  amount: number;
  paidBy: string; // Participant ID
  sharedBy: string[]; // Array of Participant IDs
}

// Result
export interface Result {
  name: string; // Participant's name
  balance: number;
}

// Payment Details
export interface PaymentDetails {
  from: string; // Participant ID
  to: string; // Participant ID
  amount: number;
}

// Balances
export type Balances = Record<string, number>;

// Ant Design Table Column Definitions
export const resultColumns: ColumnsType<Result> = [
  { title: "Tên", dataIndex: "name", key: "name" },
  {
    title: "Số tiền cần trả (+) / nhận lại (-)",
    dataIndex: "balance",
    key: "balance",
    render: (balance) =>
      new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(balance),
  },
];

export const paymentColumns: ColumnsType<PaymentDetails> = [
  { title: "Người trả", dataIndex: "from", key: "from" },
  { title: "Người nhận", dataIndex: "to", key: "to" },
  {
    title: "Số tiền",
    dataIndex: "amount",
    key: "amount",
    render: (amount) =>
      new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(amount),
  },
];
