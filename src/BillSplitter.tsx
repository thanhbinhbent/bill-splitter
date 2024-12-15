/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import {
  Input,
  Form,
  Button,
  Table,
  Select,
  Grid,
  InputNumber,
  Divider,
  Row,
  Col,
} from "antd";
import { v4 as uuidv4 } from "uuid";
import "antd/dist/reset.css";
import { ColumnsType } from "antd/es/table";
import { ArrowDownload48Filled } from "./assets/DownloadIcon";
import * as XLSX from "xlsx";
import html2canvas from "html2canvas";

const { TextArea } = Input;
const { Option } = Select;

interface Bill {
  id: string;
  billName: string;
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
  // Initial states
  const initialParticipants: string[] = [];
  const initialBills: Bill[] = [];
  const initialResults: Result[] = [];
  const initialPayments: PaymentDetails[] = [];
  const initialBillInputs: string[] = [uuidv4()];

  const [participants, setParticipants] = useState<string[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [payments, setPayments] = useState<PaymentDetails[]>([]);
  const [billInputs, setBillInputs] = useState<string[]>([uuidv4()]);

  const [form] = Form.useForm();
  const [participantForm] = Form.useForm();

  const handleParticipantsChange = (value: string) => {
    const list = value.split("\n").filter((name) => name.trim() !== "");
    setParticipants(list);
  };

  const addBillInput = () => {
    setBillInputs([...billInputs, uuidv4()]);
  };

  const removeBillInput = (id: string) => {
    const updatedInputs = billInputs.filter((inputId) => inputId !== id);
    setBillInputs(updatedInputs);

    const updatedBills = bills.filter((bill) => bill.id !== id);
    setBills(updatedBills);
  };

  const handleBillSubmit = (values: any) => {
    const newBills: Bill[] = billInputs.map((id) => ({
      id,
      billName: values[`billName${id}`],
      amount: values[`amount${id}`],
      paidBy: values[`paidBy${id}`],
      sharedBy: values[`sharedBy${id}`],
    }));
    setBills(newBills);
    calculateResults(newBills);
  };

  const calculateResults = (bills: Bill[]) => {
    const balances: { [key: string]: number } = {};
    participants.forEach((name) => (balances[name] = 0));

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

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    const modifiedBills = bills.map((bill) => ({
      ...bill,
      sharedBy: bill.sharedBy.join(", "),
    }));

    const billsSheet = XLSX.utils.json_to_sheet(modifiedBills);
    XLSX.utils.book_append_sheet(wb, billsSheet, "Bills");

    const resultsSheet = XLSX.utils.json_to_sheet(results);
    XLSX.utils.book_append_sheet(wb, resultsSheet, "Results");

    const paymentsSheet = XLSX.utils.json_to_sheet(payments);
    XLSX.utils.book_append_sheet(wb, paymentsSheet, "Payments");

    XLSX.writeFile(wb, "BillSplitterByThanhBinhBent.xlsx");
  };

  const importFromExcel = (file: File) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const data = e.target?.result;
      const wb = XLSX.read(data, { type: "binary" });

      const billsSheet = wb.Sheets["Bills"];
      const billsData = XLSX.utils.sheet_to_json(billsSheet);

      const modifiedBills = billsData.map((bill: any) => ({
        ...bill,
        id: bill.id || uuidv4(),
        sharedBy: bill.sharedBy
          ? bill.sharedBy.split(", ").map((item: string) => item.trim())
          : [],
      }));

      setBillInputs(modifiedBills.map((bill) => bill.id));

      setBills(modifiedBills);

      const importedParticipants = modifiedBills.flatMap((bill) => [
        bill.paidBy,
        ...bill.sharedBy,
      ]);
      const uniqueParticipants = Array.from(new Set(importedParticipants));
      setParticipants(uniqueParticipants);

      modifiedBills.forEach((bill) => {
        form.setFieldsValue({
          [`billName${bill.id}`]: bill.billName,
          [`amount${bill.id}`]: bill.amount,
          [`paidBy${bill.id}`]: bill.paidBy,
          [`sharedBy${bill.id}`]: bill.sharedBy,
        });
      });

      const resultsSheet = wb.Sheets["Results"];
      const resultsData = XLSX.utils.sheet_to_json(resultsSheet);
      setResults(resultsData as Result[]);

      participantForm.setFieldsValue({
        participantList: resultsData
          .flatMap((result: any) => [result.name])
          .join("\n"),
      });

      const paymentsSheet = wb.Sheets["Payments"];
      const paymentsData = XLSX.utils.sheet_to_json(paymentsSheet);
      setPayments(paymentsData as PaymentDetails[]);
    };

    reader.readAsBinaryString(file);
  };

  const resetAll = () => {
    setParticipants(initialParticipants);
    setBills(initialBills);
    setResults(initialResults);
    setPayments(initialPayments);
    setBillInputs(initialBillInputs);
    form.resetFields();
    participantForm.resetFields();
  };
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

  const exportToImage = () => {
    const contentToExport = document.createElement("div");

    contentToExport.innerHTML = `
      <div style="padding: 40px; background: #ffffff; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); margin: 20px;">
        <div style="text-align: center; font-size: 24px; font-weight: bold; padding-bottom: 20px; color: #1890ff;">
          Chi tiết Hóa Đơn
          <p>Downloaded from https://thanhbinhbent.github.io/bill-splitter</p>
        </div>
        
        <!-- Số tiền cần trả / nhận lại -->
        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 20px; color: #1890ff;; margin-bottom: 10px;">Số tiền cần trả (+) / nhận lại (-)</h3>
          <table style="border-collapse: collapse;">
            <thead>
              <tr>
                <th style="font-size: 18px; color: #555; padding: 8px; text-align: left;">Tên</th>
                <th style="font-size: 18px; color: #555; padding: 8px; text-align: right;">Số Tiền</th>
              </tr>
            </thead>
            <tbody>
              ${results
                .map(
                  (result) => `
                    <tr>
                      <td style="font-size: 18px; color: #555; padding: 8px; border-top: 1px solid #d9d9d9;">${
                        result.name
                      }</td>
                      <td style="font-size: 18px; color: #555; padding: 8px; border-top: 1px solid #d9d9d9; text-align: right;">${formatCurrency(
                        result.balance
                      )}</td>
                    </tr>
                  `
                )
                .join("")}
            </tbody>
          </table>
        </div>
  
        <!-- Danh sách trả tiền -->
        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 20px; color: #1890ff; margin-bottom: 10px;">Danh sách trả tiền</h3>
          <table border-collapse: collapse;">
            <thead>
              <tr>
                <th style="font-size: 18px; color: #555; padding: 8px; text-align: left;">Người trả</th>
                <th style="font-size: 18px; color: #555; padding: 8px; text-align: left;">Số Tiền</th>
                <th style="font-size: 18px; color: #555; padding: 8px; text-align: left;">Trả cho</th>
              </tr>
            </thead>
            <tbody>
              ${payments
                .map(
                  (payment) => `
                    <tr>
                      <td style="font-size: 18px; color: #555; padding: 8px; border-top: 1px solid #d9d9d9;">${
                        payment.from
                      }</td>
                      <td style="font-size: 18px; color: #555; padding: 8px; border-top: 1px solid #d9d9d9; text-align: right;">${formatCurrency(
                        payment.amount
                      )}</td>
                      <td style="font-size: 18px; color: #555; padding: 8px; border-top: 1px solid #d9d9d9;">${
                        payment.to
                      }</td>
                    </tr>
                  `
                )
                .join("")}
            </tbody>
          </table>
        </div>
  
        <!-- Hóa Đơn Chi Tiết -->
        <div>
          <h3 style="font-size: 20px;color: #1890ff; margin-bottom: 10px;">Hóa Đơn Chi Tiết</h3>
          <table style=" border-collapse: collapse;">
            <thead>
              <tr>
                <th style="font-size: 18px; color: #555; padding: 8px; text-align: left;">Tên hóa đơn</th>
                <th style="font-size: 18px; color: #555; padding: 8px; text-align: right;">Số tiền</th>
                <th style="font-size: 18px; color: #555; padding: 8px; text-align: left;">Người thanh toán trước</th>
                <th style="font-size: 18px; color: #555; padding: 8px; text-align: left;">Người tham gia chia hoá đơn</th>
              </tr>
            </thead>
            <tbody>
              ${bills
                .map(
                  (bill) => `
                    <tr>
                      <td style="font-size: 18px; color: #555; padding: 8px; border-top: 1px solid #d9d9d9;">${
                        bill.billName ?? "Hoá đơn không tên"
                      }</td>
                      <td style="font-size: 18px; color: #555; padding: 8px; border-top: 1px solid #d9d9d9; text-align: right;">${formatCurrency(
                        bill.amount
                      )}</td>
                      <td style="font-size: 18px; color: #555; padding: 8px; border-top: 1px solid #d9d9d9;">${
                        bill.paidBy
                      }</td>
                      <td style="font-size: 18px; color: #555; padding: 8px; border-top: 1px solid #d9d9d9;">${bill.sharedBy.join(
                        ", "
                      )}</td>
                    </tr>
                  `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;

    document.body.appendChild(contentToExport);

    html2canvas(contentToExport, {
      allowTaint: true,
      useCORS: true,
    })
      .then((canvas) => {
        const link = document.createElement("a");
        link.href = canvas.toDataURL("image/png");
        link.download = "ChiTietHoaDon.png";

        link.click();
      })
      .catch((error) => {
        console.error("Lỗi khi xuất sang hình ảnh:", error);
        alert("Đã xảy ra lỗi khi xuất hình ảnh. Vui lòng thử lại.");
      })
      .finally(() => {
        document.body.removeChild(contentToExport);
      });
  };
  const screens = Grid.useBreakpoint(); // Ant Design breakpoint hook

  // Dynamically set padding based on screen size
  const getPadding = () => {
    if (screens.xs) return "20px"; // Mobile devices
    if (screens.sm) return "60px"; // Tablets
    if (screens.md) return "100px"; // Desktop
    return "10px"; // Default fallback
  };
  return (
    <Row
      style={{
        padding: getPadding(), // Apply dynamic padding
        paddingTop: "40px",
        width: "100%",
      }}
    >
      <Col
        style={{
          width: "100%",
        }}
      >
        {" "}
        <h1 style={{ textAlign: "center" }}>
          Công Cụ Chia Tiền Hóa Đơn
          <a
            href="https://github.com/thanhbinhbent/bill-splitter"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Octicons-mark-github.svg/900px-Octicons-mark-github.svg.png"
              alt="GitHub"
              style={{ width: "24px", height: "24px", marginLeft: "20px" }}
            />
          </a>
        </h1>
        <div
          style={{
            flexWrap: "wrap",
            display: "flex",
            textAlign: "center",
            marginBottom: 20,
            gap: 10,
            justifyContent: "center",
          }}
        >
          <div>
            {" "}
            <Button
              type="default"
              onClick={() =>
                document.getElementById("importFileInput")?.click()
              }
            >
              <img
                width={15}
                src="https://upload.wikimedia.org/wikipedia/commons/3/34/Microsoft_Office_Excel_%282019%E2%80%93present%29.svg"
                alt="Nhập file excel/csv"
              />
              Nhập dữ liệu
            </Button>
            <input
              id="importFileInput"
              type="file"
              style={{ display: "none" }}
              accept=".xlsx,.xls"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) importFromExcel(file);
              }}
            />
          </div>

          <Button onClick={exportToExcel} type="default">
            {" "}
            <ArrowDownload48Filled width={"18px"} />
            Sao lưu
          </Button>
          <Button onClick={exportToImage} type="default">
            <img
              width={15}
              src="https://img.icons8.com/?size=100&id=QdAGIsBAJMG7&format=png&color=000000"
              alt="Xuất hình ảnh"
            />
            Xuất hình ảnh
          </Button>
        </div>
        <Divider />
        <Row gutter={{ xs: 8, sm: 16, md: 24, lg: 32 }} wrap>
          {/* Cột người tham gia */}
          <Col xs={24} sm={24} md={6}>
            <Form layout="vertical" form={participantForm}>
              <Form.Item
                name={`participantList`}
                label={<h3>Người tham gia chia:</h3>}
              >
                <TextArea
                  rows={6}
                  placeholder={`Bình\nHưng\nHướng\nHào\n...`}
                  onChange={(e) => handleParticipantsChange(e.target.value)}
                  style={{ whiteSpace: "pre-line" }}
                />
              </Form.Item>
            </Form>
          </Col>

          <Col xs={24} sm={24} md={18}>
            <Form form={form} onFinish={handleBillSubmit} layout="vertical">
              <h3>Thêm Hóa Đơn:</h3>
              {billInputs.map((id) => (
                <div key={id} style={{ marginBottom: "20px", width: "100%" }}>
                  <Row gutter={16}>
                    <Col xs={24} sm={12} md={4}>
                      <Form.Item label="Tên hoá đơn" name={`billName${id}`}>
                        <Input type="text" defaultValue={""}></Input>
                      </Form.Item>
                    </Col>

                    <Col xs={24} sm={12} md={6}>
                      <Form.Item
                        label="Tổng số tiền"
                        name={`amount${id}`}
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
                          style={{ width: "100%" }}
                        />
                      </Form.Item>
                    </Col>

                    <Col xs={24} sm={12} md={6}>
                      <Form.Item
                        label="Người thanh toán"
                        name={`paidBy${id}`}
                        rules={[
                          { required: true, message: "Chọn người thanh toán!" },
                        ]}
                      >
                        <Select
                          placeholder="Chọn người"
                          style={{ width: "100%" }}
                          notFoundContent="Chưa có dữ liệu!"
                        >
                          {participants.map((name) => (
                            <Option key={name} value={name}>
                              {name}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                      <Form.Item
                        label="Người chia hoá đơn này"
                        name={`sharedBy${id}`}
                        style={{ flex: 1 }}
                        rules={[
                          { required: true, message: "Chọn người cùng chia!" },
                        ]}
                      >
                        <Select
                          mode="multiple"
                          placeholder="Chọn người"
                          style={{ width: "100%" }}
                          notFoundContent="Chưa có dữ liệu!"
                        >
                          {participants.map((name) => (
                            <Option key={name} value={name}>
                              {name}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={2}>
                      <Form.Item label=" ">
                        <Button danger onClick={() => removeBillInput(id)}>
                          Xóa
                        </Button>
                      </Form.Item>
                    </Col>
                  </Row>
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
                  type="primary"
                  htmlType="submit"
                  style={{ marginBottom: "10px", marginLeft: "10px" }}
                >
                  Tính Kết Quả
                </Button>
                <Button
                  onClick={resetAll}
                  style={{ marginBottom: "10px", marginLeft: "10px" }}
                >
                  Tính mới
                </Button>
              </div>
            </Form>
          </Col>
        </Row>
        {/* Kết quả */}
        <div style={{ marginTop: "20px" }} id="summaryContent">
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
      </Col>
    </Row>
  );
};

export default BillSplitter;
