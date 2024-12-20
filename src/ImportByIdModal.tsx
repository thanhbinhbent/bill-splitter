import React, { useState } from "react";
import SessionTables from "./SessionTables";
import { Form, Input, Button, Spin, Typography, Flex } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { firebaseService } from "./services/firebaseService"; // Make sure the Firebase service is imported
import { useSessionSearchStore } from "./states/useSessionSearchStore";
import { Session } from "./utils/types";

const { Search } = Input;
const { Text } = Typography;

interface ImportByIdModalProps {
  importFromDatabase: (session: Session) => void; // The function passed from BillSplitter
}

const ImportByIdModal: React.FC<ImportByIdModalProps> = ({
  importFromDatabase,
}) => {
  const { sessionId, session, setSessionId, setSession } =
    useSessionSearchStore((state) => state);
  const [loading, setLoading] = useState<boolean>(false);
  const [buttonDisabled, setButtonDisabled] = useState<boolean>(true);
  const [messageText, setMessageText] = useState<string>("");

  const handleSearch = async (value: string) => {
    if (!value) return;

    setLoading(true);
    setMessageText(""); // Clear previous message

    try {
      const sessionData = await firebaseService.getSessionData(value);

      if (sessionData) {
        setSession(sessionData);
        setButtonDisabled(false); // Enable the "OK" button
      } else {
        setSession(null);
        setButtonDisabled(true); // Disable the "OK" button
        setMessageText("Không tìm thấy dữ liệu cho Session ID này");
      }
    } catch (error) {
      console.error("Error fetching session data:", error);
      setMessageText("Đã xảy ra lỗi khi tìm kiếm dữ liệu");
      setButtonDisabled(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex style={{ textAlign: "center" }} vertical>
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
            style={{ width: 300, marginTop: 12, marginBottom: 20 }}
            onChange={(e) => setSessionId(e.target.value)}
            onSearch={handleSearch}
          />
        </Form.Item>
      </Form>

      {loading && (
        <Spin tip="Đang tìm kiếm dữ liệu..." style={{ marginBottom: 20 }} />
      )}

      {messageText && (
        <Text type="danger" style={{ display: "block", marginTop: 5 }}>
          {messageText}
        </Text>
      )}

      {session && <SessionTables sessionData={session} />}
      {session && (
        <Button
          type="primary"
          disabled={buttonDisabled}
          loading={loading} // Spinner on button while loading
          style={{ marginTop: 30 }}
          onClick={() => importFromDatabase(session)}
        >
          Nhập dữ liệu
        </Button>
      )}
    </Flex>
  );
};

export default ImportByIdModal;
