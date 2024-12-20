import React, { useState, useEffect } from "react";
import {
  Input,
  Form,
  notification,
  Card,
  Table,
  Typography,
  Flex,
  Alert,
} from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { firebaseService, Session } from "./services/firebaseService";
import {
  resultColumns,
  paymentColumns,
  Bill,
  Participant,
} from "./utils/types";
import {
  calculateResults,
  calculatePayments,
  mapPaymentDetails,
  convertToUserFriendlyDate,
} from "./utils/helpers";

const { Search } = Input;
const { Title, Text, Link } = Typography;

const SessionSearch: React.FC = () => {
  const [sessionId, setSessionId] = useState<string>("");
  const [sessionData, setSessionData] = useState<Session | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const id = queryParams.get("sessionId");

    if (id) {
      if (!sessionData) {
        setSessionId(id);
        fetchSessionData(id, false);
      }
    }
  }, [sessionData]);

  const fetchSessionData = async (id: string, showNotification = true) => {
    try {
      const session = await firebaseService.getSessionData(id);
      if (session) {
        setSessionData(session);

        const { results: calculatedResults, balances } = calculateResults(
          session.participant,
          session.bills
        );
        const calculatedPayments = calculatePayments(balances);
        const mappedPayments = mapPaymentDetails(
          calculatedPayments,
          session.participant
        );

        setResults(calculatedResults);
        setPayments(mappedPayments);

        if (showNotification) {
          notification.success({
            message: "Đã tìm thấy hoá đơn",
            description: `Session ID: ${id} đã tìm thấy thành công.`,
          });
        }
      } else {
        setSessionData(null);
        if (showNotification) {
          notification.error({
            message: "Không tìm thấy hoá đơn",
            description: `Không có hoá đơn nào tìm thấy với Session ID: ${id}`,
          });
        }
      }
    } catch (error) {
      if (showNotification) {
        notification.error({
          message: "Lỗi",
          description: "Lỗi hệ thống khi lấy dữ liệu.",
        });
      }
    }
  };

  const handleSearch = (value: string) => {
    if (value) {
      const newUrl = `${window.location.pathname}?sessionId=${value}`;
      window.history.pushState({}, "", newUrl);
      fetchSessionData(value, true);
    } else {
      notification.error({
        message: "Lỗi",
        description: "Vui lòng nhập Session ID!",
      });
    }
  };

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
    <Flex vertical align="center" style={{ paddingTop: "28px" }}>
      <h2>Tìm kiếm hoá đơn</h2>
      <Form
        onFinish={() => handleSearch(sessionId)}
        layout="inline"
        style={{ maxWidth: 500, margin: "auto" }}
      >
        <Form.Item name="sessionId" initialValue={sessionId}>
          <Search
            placeholder="Nhập mã Session ID"
            enterButton={<SearchOutlined />}
            size="middle"
            value={sessionId}
            style={{ width: 300, marginTop: 12 }}
            onChange={(e) => setSessionId(e.target.value)}
            onSearch={handleSearch}
          />
        </Form.Item>
      </Form>

      {sessionData ? (
        <div style={{ marginTop: 40 }}>
          <Card
            style={{ textWrap: "wrap" }}
            title={
              <Flex vertical>
                <Text
                  style={{ textWrap: "wrap", fontWeight: "bold" }}
                  ellipsis={true}
                >
                  Session ID: <Link> {sessionId}</Link>
                </Text>
                <Text style={{ textWrap: "wrap" }}>
                  Được chia sẻ{" "}
                  <Text>
                    {convertToUserFriendlyDate(sessionData.createDate)}
                  </Text>
                </Text>
              </Flex>
            }
            bordered={false}
          >
            <Title level={4}>Tóm tắt số dư</Title>
            <Table
              columns={resultColumns}
              dataSource={results}
              pagination={false}
              rowKey="name"
            />

            <Title level={4} style={{ marginTop: 20 }}>
              Chi tiết cần thanh toán
            </Title>
            <Table
              columns={paymentColumns}
              dataSource={payments}
              pagination={false}
              rowKey="from"
            />

            <Title level={4} style={{ marginTop: 20 }}>
              Lịch sử hoá đơn
            </Title>
            <Table
              columns={billColumns}
              dataSource={mapBillsData(
                sessionData.bills,
                sessionData.participant
              )}
              pagination={false}
              rowKey="id"
            />
          </Card>
        </div>
      ) : (
        <Alert
          style={{ marginTop: 20 }}
          message="Không tìm thấy dữ liệu! Vui lòng tìm với Session ID khác."
          type="warning"
        />
      )}
    </Flex>
  );
};

export default SessionSearch;
