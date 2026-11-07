import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import AuthForm from './components/AuthForm.jsx';
import Closet from './pages/Closet.jsx';
import Avatar from './pages/Avatar.jsx';
import Swipe from './pages/Swipe.jsx';
import Outfits from './pages/Outfits.jsx';
import Builder from './pages/Builder.jsx';
import Suggest from './pages/Suggest.jsx';
import Account from './pages/Account.jsx';
import Privacy from './pages/Privacy.jsx';

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<AuthForm mode="login" />} />
          <Route path="/register" element={<AuthForm mode="register" />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route element={<Layout />}>
            <Route path="/closet" element={<Closet />} />
            <Route path="/avatar" element={<Avatar />} />
            <Route path="/swipe" element={<Swipe />} />
            <Route path="/outfits" element={<Outfits />} />
            <Route path="/outfits/:id" element={<Builder />} />
            <Route path="/suggest" element={<Suggest />} />
            <Route path="/account" element={<Account />} />
          </Route>
          <Route path="*" element={<Navigate to="/closet" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}
