import BillSplitter from "./BillSplitter";
import SearchPage from "./SearchPage"; // Giả sử bạn có một trang tìm kiếm có tên là SearchPage
import "./App.css";

function App() {
  const queryParams = new URLSearchParams(window.location.search);
  const sessionId = queryParams.get("sessionId");

  // Nếu có sessionId trong URL, render SearchPage, nếu không render BillSplitter
  return <>{sessionId ? <SearchPage /> : <BillSplitter />}</>;
}

export default App;
