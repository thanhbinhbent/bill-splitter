import React, { useState, useEffect } from "react";
import { Input, Form, notification, Card, Typography, Flex, Alert } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { firebaseService, Session } from "./services/firebaseService";
import { convertToUserFriendlyDate } from "./utils/helpers";
import SessionTables from "./SessionTables";
import SVGLogoComponent from "./Logo";

const { Search } = Input;
const { Text, Link } = Typography;

const SessionSearch: React.FC = () => {
  const [sessionId, setSessionId] = useState<string>("");
  const [sessionData, setSessionData] = useState<Session | null>(null);
  const [showNoDataAlert, setShowNoDataAlert] = useState<boolean>(false); // New state for alert visibility

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const id = queryParams.get("sessionId");

    if (id) {
      if (!sessionData) {
        setSessionId(id);
        fetchSessionData(id, false);
        setShowNoDataAlert(true);
      }
    }
  }, [sessionData]);

  const fetchSessionData = async (id: string, showNotification = true) => {
    try {
      const session = await firebaseService.getSessionData(id);
      if (session) {
        setShowNoDataAlert(false);
        setSessionData(session);
      } else {
        setSessionData(null);
        if (showNotification) {
          notification.error({
            message: "Không tìm thấy hoá đơn",
            description: `Không có hoá đơn nào tìm thấy với Session ID: ${id}`,
          });
          setShowNoDataAlert(true); // Show the no data alert when session data is not found
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
    setSessionId("");
    if (value) {
      const newUrl = `${window.location.pathname}?sessionId=${value}`;
      window.history.pushState({}, "", newUrl);
      fetchSessionData(value, true);
      setSessionId(value);
    } else {
      notification.error({
        message: "Lỗi",
        description: "Vui lòng nhập Session ID!",
      });
    }
  };

  return (
    <Flex vertical align="center" style={{ paddingTop: "28px" }}>
      <Flex vertical align="center">
        <SVGLogoComponent width={250} />
      </Flex>
      <h2 style={{ marginTop: "20px" }}>Tìm kiếm hoá đơn</h2>
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
            onSearch={handleSearch}
          />
        </Form.Item>
      </Form>

      {/* Check if sessionId is empty and show message */}
      {sessionId === "" && (
        <Alert
          style={{ marginTop: 20 }}
          message="Vui lòng nhập Session ID để tìm kiếm!"
          type="warning"
        />
      )}

      {sessionData && sessionId !== "" ? (
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
            <SessionTables sessionData={sessionData} />
          </Card>
        </div>
      ) : (
        sessionId !== "" &&
        showNoDataAlert && (
          <Alert
            style={{ marginTop: 20 }}
            message="Không tìm thấy dữ liệu! Vui lòng tìm với Session ID khác."
            type="warning"
          />
        )
      )}
    </Flex>
  );
};

export default SessionSearch;
