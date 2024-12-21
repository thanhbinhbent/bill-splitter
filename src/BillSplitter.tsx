/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef } from "react";
import {
  Input,
  Flex,
  Form,
  Button,
  Table,
  Select,
  Grid,
  InputNumber,
  Divider,
  Row,
  Col,
  Dropdown,
  notification,
  Modal,
} from "antd";
import { v4 as uuidv4 } from "uuid";
import "antd/dist/reset.css";
import { ColumnsType } from "antd/es/table";
import html2canvas from "html2canvas";
import {
  Participant,
  paymentColumns as paymentColumnsHelper,
  Result,
  resultColumns,
  Bill,
  PaymentDetails,
  Session,
} from "./utils/types";
import {
  calculateResults,
  formatCurrency,
  calculatePayments,
  mapPaymentDetails,
  getParticipantNameById,
} from "./utils/helpers";
import { firebaseService } from "./services/firebaseService";
import ImportByIdModal from "./ImportByIdModal";
import { useSessionSearchStore } from "./states/useSessionSearchStore";
import Logo from "./Logo";

const { TextArea } = Input;
const { Option } = Select;

const BillSplitter: React.FC = () => {
  const initialParticipants: Participant[] = [];
  const initialBills: Bill[] = [];
  const initialResults: Result[] = [];
  const initialPayments: PaymentDetails[] = [];
  const initialBillInputs: string[] = [uuidv4()];

  // Zustand state
  const { setSession, setSessionId } = useSessionSearchStore((state) => state);

  const [sessionLink, setSessionLink] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  const [isCalculated, setIsCalculated] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [payments, setPayments] = useState<PaymentDetails[]>([]);
  const [billInputs, setBillInputs] = useState<string[]>([uuidv4()]);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);

  const [form] = Form.useForm();
  const [participantForm] = Form.useForm();

  const columns: ColumnsType<Result> = resultColumns;

  const paymentColumns: ColumnsType<PaymentDetails> = paymentColumnsHelper;

  const handleCancelImportByModal = () => {
    console.log("Closing Modal");
    setIsImportModalOpen(false); // Close the modal when cancel is clicked
  };

  const showImportByIdModal = () => {
    console.log("Opening Modal");
    setIsImportModalOpen(true); // Open the modal
  };

  const importMenu = [
    {
      key: "import-by-json",
      label: (
        <a
          onClick={() => {
            if (fileInputRef.current) {
              fileInputRef.current.value = "";
              fileInputRef.current.click();
            }
          }}
        >
          Qua file JSON
          <input
            id="importFileInput"
            ref={fileInputRef}
            type="file"
            style={{ display: "none" }}
            accept=".json"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                importFromJson(file);
              }
            }}
          />
        </a>
      ),
    },
    {
      key: "import-by-extist-id",
      label: <a onClick={showImportByIdModal}>Qua Session ID</a>,
    },
  ];

  const importFromDatabase = (session: Session) => {
    setIsImportModalOpen(false);
    if (session) {
      const importedParticipants = session.participant.map((p: any) => ({
        id: p.id,
        name: p.name,
      }));
      setParticipants(importedParticipants);

      const importedBills = session.bills.map((bill: any) => ({
        id: bill.id,
        billName: bill.billName,
        amount: bill.amount,
        paidBy: bill.paidBy,
        sharedBy: bill.sharedBy || [],
      }));
      setBills(importedBills);

      // Calculate results (replace with your own calculation logic)
      const { results, balances } = calculateResults(
        importedParticipants,
        importedBills
      );
      setResults(results);

      // Set up participant list to display
      participantForm.setFieldsValue({
        participantList: importedParticipants
          .map((p: Participant) => p.name)
          .join("\n"),
      });

      // Update bill form fields (assuming `form` is available and set up)
      importedBills.forEach((bill: Bill) => {
        form.setFieldsValue({
          [`billName${bill.id}`]: bill.billName,
          [`amount${bill.id}`]: bill.amount,
          [`paidBy${bill.id}`]: bill.paidBy,
          [`sharedBy${bill.id}`]: bill.sharedBy,
        });
      });

      // Optional: You may also want to handle billInputs if necessary
      setBillInputs(importedBills.map((bill: Bill) => bill.id));
      setPayments(
        mapPaymentDetails(calculatePayments(balances), importedParticipants)
      );
      setSession(null), setSessionId("");
      setSessionLink("");
      setIsCalculated(false);
    }
  };

  const importFromJson = (file: File) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);

        if (!data.participant || !data.bills) {
          throw new Error(
            "Invalid file structure: missing participants or bills"
          );
        }

        const importedParticipants = data.participant.map((p: any) => ({
          id: p.id,
          name: p.name,
        }));
        setParticipants(importedParticipants);

        const importedBills = data.bills.map((bill: Bill) => ({
          id: bill.id || uuidv4(),
          billName: bill.billName,
          amount: bill.amount,
          paidBy: bill.paidBy,
          sharedBy: bill.sharedBy || [],
        }));

        setBillInputs(importedBills.map((bill: Bill) => bill.id));
        setBills(importedBills);

        importedBills.forEach((bill: Bill) => {
          form.setFieldsValue({
            [`billName${bill.id}`]: bill.billName,
            [`amount${bill.id}`]: bill.amount,
            [`paidBy${bill.id}`]: bill.paidBy,
            [`sharedBy${bill.id}`]: bill.sharedBy,
          });
        });

        setBillInputs(importedBills.map((bill: Bill) => bill.id));

        setBills(importedBills);

        const { results, balances } = calculateResults(
          importedParticipants,
          importedBills
        );
        setResults(results);
        setPayments(
          mapPaymentDetails(calculatePayments(balances), importedParticipants)
        );

        participantForm.setFieldsValue({
          participantList: importedParticipants
            .map((p: Participant) => p.name)
            .join("\n"),
        });
      } catch (error) {
        console.error("Error importing JSON file:", error);
      }
    };

    reader.readAsText(file);
  };

  const handleParticipantsChange = (value: string) => {
    const lines = value
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line !== "");

    const updatedParticipants = lines.map((name) => {
      const existing = participants.find((p) => p.name === name);
      return existing || { id: uuidv4(), name };
    });
    setParticipants(updatedParticipants);
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
    const { results, balances } = calculateResults(participants, newBills);
    const calculatedPayments = calculatePayments(balances);
    setBills(newBills);
    setResults(results);
    const mappedPayments = mapPaymentDetails(calculatedPayments, participants);
    setPayments(mappedPayments);
    setIsCalculated(true);
  };

  const shareSession = async () => {
    if (
      participants &&
      bills &&
      participants.length !== 0 &&
      bills.length !== 0
    ) {
      try {
        const sessionData = {
          participant: participants,
          bills: bills,
          createDate: new Date().toISOString(),
        };
        setIsSharing(true);

        const sessionId = await firebaseService.postSessionData(sessionData);

        const sessionUrl = `${window.location.origin}/bill-splitter?sessionId=${sessionId}`;
        setIsSharing(false);
        setSessionLink(sessionUrl);
      } catch (error) {
        notification.error({
          message: "Error",
          description: "Failed to share session data.",
        });
      }
    }
  };

  const handleCopyLink = () => {
    if (sessionLink) {
      navigator.clipboard.writeText(sessionLink);
      notification.success({
        message: "Đã sao chép liên kết!",
      });
    }
  };

  const downloadSessionData = () => {
    const dataStr = JSON.stringify(
      {
        participant: participants,
        bills: bills,
        createDate: new Date().toISOString(),
      },
      null,
      2
    );
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `session-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  };
  const resetAll = () => {
    setParticipants(initialParticipants);
    setBills(initialBills);
    setResults(initialResults);
    setPayments(initialPayments);
    setBillInputs(initialBillInputs);
    setSessionLink(null);
    setIsCalculated(false);
    form.resetFields();
    participantForm.resetFields();
  };

  const exportToImage = () => {
    const contentToExport = document.createElement("div");

    contentToExport.style.width = "794px";
    contentToExport.style.height = "1123px";
    contentToExport.style.padding = "40px";
    contentToExport.style.background = "#f0f0f0";
    contentToExport.style.borderRadius = "8px";
    contentToExport.style.boxShadow = "0 8px 16px rgba(0, 0, 0, 0.15)";
    contentToExport.style.fontFamily = "Arial, sans-serif";
    contentToExport.style.overflow = "hidden";

    contentToExport.innerHTML = `
      <div style="text-align: center; font-size: 28px; font-weight: bold; margin-bottom: 20px; color: #1890ff;">
        HÓA ĐƠN CHI TIẾT
        <p style="font-size: 14px; margin-top: 5px; color: #888;">Downloaded from https://thanhbinhbent.github.io/bill-splitter</p>
      </div>
  
      <!-- Nội dung hóa đơn -->
      <div style="margin-top: 20px;">
        ${
          results?.length > 0
            ? `
          <h3 style="font-size: 20px; color: #1890ff;">Số tiền cần trả (+) / nhận lại (-)</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr>
                <th style="text-align: left; padding: 10px; border: 1px solid #d9d9d9;">Tên</th>
                <th style="text-align: right; padding: 10px; border: 1px solid #d9d9d9;">Số Tiền</th>
              </tr>
            </thead>
            <tbody>
              ${results
                .map(
                  (result) => `
                  <tr>
                    <td style="padding: 10px; border: 1px solid #d9d9d9;">${
                      result.name
                    }</td>
                    <td style="text-align: right; padding: 10px; border: 1px solid #d9d9d9;">${formatCurrency(
                      result.balance
                    )}</td>
                  </tr>
                `
                )
                .join("")}
            </tbody>
          </table>
          `
            : ""
        }
  
        ${
          payments?.length > 0
            ? `
          <h3 style="font-size: 20px; color: #1890ff;">Danh sách trả tiền</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr>
                <th style="text-align: left; padding: 10px; border: 1px solid #d9d9d9;">Người trả</th>
                <th style="text-align: right; padding: 10px; border: 1px solid #d9d9d9;">Số Tiền</th>
                <th style="text-align: left; padding: 10px; border: 1px solid #d9d9d9;">Trả cho</th>
              </tr>
            </thead>
            <tbody>
              ${payments
                .map(
                  (payment) => `
                  <tr>
                    <td style="padding: 10px; border: 1px solid #d9d9d9;">${
                      payment.from
                    }</td>
                    <td style="text-align: right; padding: 10px; border: 1px solid #d9d9d9;">${formatCurrency(
                      payment.amount
                    )}</td>
                    <td style="padding: 10px; border: 1px solid #d9d9d9;">${
                      payment.to
                    }</td>
                  </tr>
                `
                )
                .join("")}
            </tbody>
          </table>
          `
            : ""
        }
  
        ${
          bills?.length > 0
            ? `
          <h3 style="font-size: 20px; color: #1890ff;">Hóa Đơn Chi Tiết</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr>
                <th style="text-align: left; padding: 10px; border: 1px solid #d9d9d9;">Tên hóa đơn</th>
                <th style="text-align: right; padding: 10px; border: 1px solid #d9d9d9;">Số tiền</th>
                <th style="text-align: left; padding: 10px; border: 1px solid #d9d9d9;">Người thanh toán</th>
                <th style="text-align: left; padding: 10px; border: 1px solid #d9d9d9;">Người tham gia</th>
              </tr>
            </thead>
            <tbody>
              ${bills
                .map(
                  (bill) => `
                  <tr>
                    <td style="padding: 10px; border: 1px solid #d9d9d9;">${
                      bill.billName ?? "Không tên"
                    }</td>
                    <td style="text-align: right; padding: 10px; border: 1px solid #d9d9d9;">${formatCurrency(
                      bill.amount
                    )}</td>
                    <td style="padding: 10px; border: 1px solid #d9d9d9;">${getParticipantNameById(
                      bill.paidBy,
                      participants
                    )}</td>
                    <td style="padding: 10px; border: 1px solid #d9d9d9;">${bill.sharedBy
                      .map((id) => getParticipantNameById(id, participants))
                      .join(", ")}</td>
                  </tr>
                `
                )
                .join("")}
            </tbody>
          </table>
          `
            : ""
        }
      </div>
    `;

    document.body.appendChild(contentToExport);

    html2canvas(contentToExport, {
      scale: 2,
      width: 794,
      height: 1123,
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
      })
      .finally(() => {
        document.body.removeChild(contentToExport);
      });
  };

  const screens = Grid.useBreakpoint();

  const getPadding = () => {
    if (screens.xs) return "20px";
    if (screens.sm) return "60px";
    if (screens.md) return "100px";
    return "10px";
  };
  return (
    <Row
      style={{
        padding: getPadding(),
        paddingTop: "40px",
        width: "100%",
      }}
    >
      <Col
        style={{
          width: "100%",
        }}
      >
        <Flex vertical align="center">
          <Logo width={250} />
        </Flex>
        <h1 style={{ textAlign: "center", marginTop: "20px" }}>
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
            <Dropdown menu={{ items: importMenu }} placement="bottom">
              <Button type="default">
                <img
                  width={15}
                  src="https://raw.githubusercontent.com/microsoft/fluentui-system-icons/refs/heads/main/assets/Folder%20Open/SVG/ic_fluent_folder_open_28_regular.svg"
                  alt="Nhập file JSON"
                />
                Khôi phục
              </Button>
            </Dropdown>

            <Modal
              title="Nhập dữ liệu đã lưu trên hệ thống"
              height={"auto"}
              footer={false}
              open={isImportModalOpen}
              onCancel={handleCancelImportByModal}
            >
              <ImportByIdModal importFromDatabase={importFromDatabase} />
            </Modal>
          </div>

          <Button onClick={downloadSessionData} type="default">
            <img
              width={15}
              src="https://raw.githubusercontent.com/microsoft/fluentui-system-icons/refs/heads/main/assets/Arrow%20Download/SVG/ic_fluent_arrow_download_48_regular.svg"
              alt="Sao lưu"
            />
            Sao lưu
          </Button>
          <Button onClick={exportToImage} type="default">
            <img
              width={15}
              src="https://raw.githubusercontent.com/microsoft/fluentui-system-icons/refs/heads/main/assets/Image/SVG/ic_fluent_image_48_regular.svg"
              alt="Xuất hình ảnh"
            />
            Xuất hình ảnh
          </Button>
          <Button onClick={exportToImage} href="?sessionId" type="link">
            <img
              width={18}
              src="https://raw.githubusercontent.com/microsoft/fluentui-system-icons/refs/heads/main/assets/Search/SVG/ic_fluent_search_48_regular.svg"
              alt="Tìm kiếm"
            />
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
                          {
                            required: true,
                            message: "Vui lòng nhập số tiền!",
                          },
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
                          {
                            required: true,
                            message: "Chọn người thanh toán!",
                          },
                        ]}
                      >
                        <Select
                          placeholder="Chọn người"
                          style={{ width: "100%" }}
                          notFoundContent="Chưa có dữ liệu!"
                        >
                          {participants.map((participant) => (
                            <Option key={participant.id} value={participant.id}>
                              {participant.name}
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
                          {
                            required: true,
                            message: "Chọn người cùng chia!",
                          },
                        ]}
                      >
                        <Select
                          mode="multiple"
                          placeholder="Chọn người"
                          style={{ width: "100%" }}
                          notFoundContent="Chưa có dữ liệu!"
                        >
                          {participants.map((participant) => (
                            <Option key={participant.id} value={participant.id}>
                              {participant.name}
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
                {isCalculated && !sessionLink && (
                  <Button
                    loading={isSharing}
                    disabled={isSharing}
                    onClick={shareSession}
                    style={{ marginBottom: "10px", marginLeft: "10px" }}
                  >
                    Chia sẻ
                  </Button>
                )}
              </div>
              <div>
                {sessionLink && (
                  <div style={{ marginLeft: "10px" }}>
                    <span
                      style={{ cursor: "pointer" }}
                      onClick={handleCopyLink}
                    >
                      <img
                        src="https://raw.githubusercontent.com/microsoft/fluentui-system-icons/refs/heads/main/assets/Copy/SVG/ic_fluent_copy_32_regular.svg"
                        alt=""
                        width={20}
                      />{" "}
                      Sao chép liên kết{" "}
                    </span>
                    <a
                      href={sessionLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {sessionLink}
                    </a>
                  </div>
                )}
              </div>
            </Form>
          </Col>
        </Row>
        {/* Kết quả */}
        <div style={{ marginTop: "20px" }} id="summaryContent">
          <h2 style={{ marginTop: "20px" }}>Tóm tắt số dư:</h2>
          <Table
            dataSource={results}
            columns={columns}
            rowKey="name"
            locale={{ emptyText: "Chưa có dữ liệu" }}
            pagination={false}
          />
          <h2 style={{ marginTop: "20px" }}>Chi tiết cần thanh toán:</h2>
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
