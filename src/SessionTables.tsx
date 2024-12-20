import React from "react";
import { Table, Typography } from "antd";
import {
  resultColumns,
  paymentColumns,
  Bill,
  Participant,
  Session,
} from "./utils/types";
import { getCalculatedPayments, getCalculatedResults } from "./utils/helpers";
const { Title } = Typography;

interface SessionTablesProps {
  sessionData: Session;
}

const SessionTables: React.FC<SessionTablesProps> = ({ sessionData }) => {
  const mapBillsData = (bills: Bill[], participants: Participant[]) =>
    bills.map((bill) => ({
      ...bill,
      paidBy:
        participants.find((p) => p.id === bill.paidBy)?.name || bill.paidBy,
      sharedBy: bill.sharedBy
        .map((id) => participants.find((p) => p.id === id)?.name || id)
        .join(", "),
    }));

  const billColumns = [
    { title: "Tên hoá đơn", dataIndex: "billName", key: "billName" },
    {
      title: "Số tiền đã thanh toán",
      dataIndex: "amount",
      key: "amount",
      render: (amount: number) =>
        new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(amount),
    },
    {
      title: "Được thanh toán trước bởi",
      dataIndex: "paidBy",
      key: "paidBy",
    },
    {
      title: "Danh sách người chia",
      dataIndex: "sharedBy",
      key: "sharedBy",
    },
  ];

  return (
    <>
      <Title level={4}>Tóm tắt số dư</Title>
      <Table
        columns={resultColumns}
        dataSource={getCalculatedResults(sessionData)}
        pagination={false}
        rowKey="name"
      />

      <Title level={4} style={{ marginTop: 20 }}>
        Chi tiết cần thanh toán
      </Title>
      <Table
        columns={paymentColumns}
        dataSource={getCalculatedPayments(sessionData)}
        pagination={false}
        rowKey="from"
      />

      <Title level={4} style={{ marginTop: 20 }}>
        Lịch sử hoá đơn
      </Title>
      <Table
        columns={billColumns}
        dataSource={mapBillsData(sessionData.bills, sessionData.participant)}
        pagination={false}
        rowKey="id"
      />
    </>
  );
};

export default SessionTables;
