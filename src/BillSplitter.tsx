/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import {
  Input,
  Form,
  Button,
  Table,
  Select,
  Space,
  Flex,
  InputNumber,
  Row,
  Col,
} from "antd";
import "antd/dist/reset.css";
import { ColumnsType } from "antd/es/table";

const { TextArea } = Input;
const { Option } = Select;

interface Bill {
  id: number;
  amount: number;
  paidBy: string;
  sharedBy: string[];
}

interface Result {
  name: string;
  balance: number;
}

interface PaymentDetails {
  from: string;
  to: string;
  amount: number;
}

const BillSplitter: React.FC = () => {
  const [participants, setParticipants] = useState<string[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [payments, setPayments] = useState<PaymentDetails[]>([]);
  const [billInputs, setBillInputs] = useState<number[]>([0]);

  const [form] = Form.useForm();

  const handleParticipantsChange = (value: string) => {
    const list = value.split("\n").filter((name) => name.trim() !== "");
    setParticipants(list);
  };

  const addBillInput = () => {
    setBillInputs([...billInputs, billInputs.length]);
  };

  const removeBillInput = (index: number) => {
    const updatedInputs = billInputs.filter((_, i) => i !== index);
    setBillInputs(updatedInputs);

    // Remove the corresponding bill from the bills state
    const updatedBills = bills.filter((_, i) => i !== index);
    setBills(updatedBills);
  };

  const handleBillSubmit = (values: any) => {
    const newBills: Bill[] = billInputs.map((_, index) => ({
      id: index,
      amount: values[`amount${index}`],
      paidBy: values[`paidBy${index}`],
      sharedBy: values[`sharedBy${index}`],
    }));
    setBills(newBills);
  };

  const calculateResults = () => {
    const balances: { [key: string]: number } = {};
    participants.forEach((name) => (balances[name] = 0));

    // Ensure that each bill's sharedBy property is not undefined before accessing it
    bills.forEach((bill) => {
      if (bill.sharedBy && bill.sharedBy.length > 0) {
        const share = bill.amount / bill.sharedBy.length;
        balances[bill.paidBy] -= bill.amount;
        bill.sharedBy.forEach((person) => {
          balances[person] += share;
        });
      }
    });

    const resultArray: Result[] = participants.map((name) => ({
      name,
      balance: balances[name],
    }));
    setResults(resultArray);

    calculatePayments(balances);
  };

  const calculatePayments = (balances: { [key: string]: number }) => {
    const creditors = Object.entries(balances)
      .filter(([_, balance]) => balance < 0)
      .map(([name, balance]) => ({ name, balance: Math.abs(balance) }));

    const debtors = Object.entries(balances)
      .filter(([_, balance]) => balance > 0)
      .map(([name, balance]) => ({ name, balance }));

    const paymentDetails: PaymentDetails[] = [];

    while (debtors.length > 0 && creditors.length > 0) {
      const debtor = debtors[0];
      const creditor = creditors[0];

      const payment = Math.min(debtor.balance, creditor.balance);
      paymentDetails.push({
        from: debtor.name,
        to: creditor.name,
        amount: payment,
      });

      debtor.balance -= payment;
      creditor.balance -= payment;

      if (debtor.balance === 0) debtors.shift();
      if (creditor.balance === 0) creditors.shift();
    }

    setPayments(paymentDetails);
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);

  const columns: ColumnsType<Result> = [
    { title: "Tên", dataIndex: "name", key: "name" },
    {
      title: "Số tiền cần trả (+) / nhận lại (-)",
      dataIndex: "balance",
      key: "balance",
      render: (balance) => formatCurrency(balance),
    },
  ];

  const paymentColumns: ColumnsType<PaymentDetails> = [
    { title: "Người trả", dataIndex: "from", key: "from" },
    { title: "Người nhận", dataIndex: "to", key: "to" },
    {
      title: "Số tiền",
      dataIndex: "amount",
      key: "amount",
      render: (amount) => formatCurrency(amount),
    },
  ];

  return (
    <div style={{ padding: "100px", width: "100%" }}>
      <h1 style={{ textAlign: "center", marginBottom: 50 }}>
        Công Cụ Chia Tiền Hóa Đơn
        <a
          href="https://github.com/yourusername"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Octicons-mark-github.svg/900px-Octicons-mark-github.svg.png"
            alt="GitHub"
            style={{ width: "24px", height: "24px", marginLeft: "20px" }}
          />
        </a>
        <a
          href="https://www.linkedin.com/in/yourusername"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/LinkedIn_icon.svg/108px-LinkedIn_icon.svg.png"
            alt="LinkedIn"
            style={{ width: "24px", height: "24px", marginLeft: "20px" }}
          />
        </a>
      </h1>

      <Row gutter={[50, 30]}>
        {/* Cột người tham gia */}
        <Col span={8}>
          <Form layout="vertical">
            <Form.Item
              label={<h3>Nhập danh sách người tham gia (mỗi dòng 1 người):</h3>}
            >
              <TextArea
                rows={6}
                onChange={(e) => handleParticipantsChange(e.target.value)}
              />
            </Form.Item>
          </Form>
        </Col>

        {/* Cột thêm hóa đơn */}
        <Col span={16}>
          <Form form={form} onFinish={handleBillSubmit} layout="vertical">
            <h3>Thêm Hóa Đơn:</h3>
            {billInputs.map((index) => (
              <div key={index} style={{ marginBottom: "20px", width: "100%" }}>
                <Flex style={{ width: "100%", gap: 20 }}>
                  <Form.Item
                    label="Tổng số tiền"
                    name={`amount${index}`}
                    rules={[
                      { required: true, message: "Vui lòng nhập số tiền!" },
                    ]}
                  >
                    <InputNumber<number>
                      min={1}
                      formatter={(value) =>
                        `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                      }
                      parser={(value) =>
                        Number(value?.replace(/[^\d]/g, "") || 0)
                      }
                      prefix="VND"
                      style={{ width: "200px" }}
                    />
                  </Form.Item>

                  <Form.Item
                    label="Người thanh toán"
                    name={`paidBy${index}`}
                    rules={[
                      { required: true, message: "Chọn người thanh toán!" },
                    ]}
                  >
                    <Select placeholder="Chọn người" style={{ width: "150px" }}>
                      {participants.map((name) => (
                        <Option key={name} value={name}>
                          {name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Form.Item
                    label="Người cùng chia"
                    name={`sharedBy${index}`}
                    style={{ flex: 1 }}
                    rules={[
                      { required: true, message: "Chọn người cùng chia!" },
                    ]}
                  >
                    <Select
                      mode="multiple"
                      placeholder="Chọn người"
                      style={{ width: "100%" }}
                    >
                      {participants.map((name) => (
                        <Option key={name} value={name}>
                          {name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Form.Item label=" ">
                    <Button danger onClick={() => removeBillInput(index)}>
                      Xóa
                    </Button>
                  </Form.Item>
                </Flex>
              </div>
            ))}
            <Button
              type="dashed"
              onClick={addBillInput}
              style={{ width: "100%" }}
            >
              Thêm Hóa Đơn
            </Button>
            <div style={{ marginTop: "20px" }}>
              <Button
                variant="outlined"
                htmlType="submit"
                style={{ marginTop: "10px" }}
              >
                <b>Bước 1: </b>Lưu Hóa Đơn
              </Button>
              <Button
                type="primary"
                onClick={calculateResults}
                style={{ marginBottom: "10px", marginLeft: "10px" }}
              >
                <b>Bước 2: </b>Tính Kết Quả
              </Button>
            </div>
          </Form>
        </Col>
      </Row>

      {/* Kết quả */}
      <div style={{ marginTop: "20px" }}>
        <h3 style={{ marginTop: "20px" }}>Tóm tắt:</h3>
        <Table
          dataSource={results}
          columns={columns}
          rowKey="name"
          locale={{ emptyText: "Chưa có dữ liệu" }}
          pagination={false}
        />
        <h3 style={{ marginTop: "20px" }}>Ai cần trả cho ai bao nhiêu:</h3>
        <Table
          dataSource={payments}
          columns={paymentColumns}
          locale={{ emptyText: "Chưa có dữ liệu" }}
          rowKey={(record) => `${record.from}-${record.to}`}
          pagination={false}
        />
      </div>
    </div>
  );
};

export default BillSplitter;
