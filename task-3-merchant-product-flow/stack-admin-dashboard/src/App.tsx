import { BrowserRouter } from "react-router-dom";
import { LoadingSpinner } from "./components";
import { ClientProvider } from "./providers";
import Routes from "./routes";
import "@/assets/scss/app.css";
function App() {
  return (
    <ClientProvider>
      <BrowserRouter>
        <Routes />
        <LoadingSpinner />
      </BrowserRouter>
    </ClientProvider>
  );
}

export default App;
