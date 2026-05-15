import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Overview from './pages/Overview';
import Timeline from './pages/Timeline';
import Topics from './pages/Topics';
import Insights from './pages/Insights';
import ConversationDetail from './pages/ConversationDetail';

export default function App() {
  return (
    <BrowserRouter basename="/cognidashboard">
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Overview />} />
          <Route path="timeline" element={<Timeline />} />
          <Route path="topics" element={<Topics />} />
          <Route path="insights" element={<Insights />} />
          <Route path="conversation/:id" element={<ConversationDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
