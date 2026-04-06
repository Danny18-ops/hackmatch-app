import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Events from './pages/Events';
import Search from './pages/Search';
import Profile from './pages/Profile';
import './index.css';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/"        element={<Layout><Home /></Layout>} />
        <Route path="/events"  element={<Layout><Events /></Layout>} />
        <Route path="/search"  element={<Layout><Search /></Layout>} />
        <Route path="/profile" element={<Layout><Profile /></Layout>} />
      </Routes>
    </Router>
  );
}