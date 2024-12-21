import BillSplitter from "./BillSplitter";
import SearchPage from "./SearchPage";
import "./App.css";

function App() {
  const queryParams = new URLSearchParams(window.location.search);
  const sessionId = queryParams.get("sessionId");
  console.log(sessionId);

  const shouldRenderSearchPage = sessionId !== null;

  return <>{shouldRenderSearchPage ? <SearchPage /> : <BillSplitter />}</>;
}

export default App;
