import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Ranking from "./pages/Ranking";
import Players from "./pages/Players";
import PlayerDetail from "./pages/PlayerDetail";
import Matches from "./pages/Matches";
import MatchDetail from "./pages/MatchDetail";
import Champions from "./pages/Champions";
import Roles from "./pages/Roles";
import NewMatch from "./pages/NewMatch";
import HeadToHead from "./pages/HeadToHead";
import SupabaseTest from "./pages/SupabaseTest";
import Login from "./pages/Login";

function App() {
  return (
    <BrowserRouter>
      <div style={{ padding: "24px" }}>
        <Navbar />

        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/rankings" element={<Ranking />} />
          <Route path="/players" element={<Players />} />
          <Route path="/players/:id" element={<PlayerDetail />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/matches/:id" element={<MatchDetail />} />
          <Route path="/champions" element={<Champions />} />
          <Route path="/roles" element={<Roles />} />
          <Route path="/new-match" element={<NewMatch />} />
          <Route path="/head-to-head" element={<HeadToHead />} />
          <Route path="/supabase-test" element={<SupabaseTest />} />
          
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;