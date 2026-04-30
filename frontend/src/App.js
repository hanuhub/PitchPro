import { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import About from "@/pages/About";
import Coaches from "@/pages/Coaches";
import Games from "@/pages/Games";
import Dashboard from "@/pages/Dashboard";
import BookLane from "@/pages/BookLane";
import Coaching from "@/pages/Coaching";
import Admin from "@/pages/Admin";
import Staff from "@/pages/Staff";
import ThemePicker from "@/pages/themes/Picker";
import ThemeSage from "@/pages/themes/Sage";
import ThemeSky from "@/pages/themes/Sky";
import ThemePitch from "@/pages/themes/Pitch";

function Layout({ children }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  );
}

function App() {
  return (
    <div className="App">
      <ThemeProvider>
        <AuthProvider>
        <BrowserRouter>
          <Toaster position="top-right" theme="dark" richColors closeButton />
          <Routes>
            <Route path="/" element={<Layout><Landing /></Layout>} />
            <Route path="/login" element={<Layout><Login /></Layout>} />
            <Route path="/register" element={<Layout><Register /></Layout>} />
            <Route path="/about" element={<Layout><About /></Layout>} />
            <Route path="/coaches" element={<Layout><Coaches /></Layout>} />
            <Route path="/games" element={<Layout><Games /></Layout>} />
            <Route path="/dashboard" element={
              <ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>
            } />
            <Route path="/book" element={
              <ProtectedRoute><Layout><BookLane /></Layout></ProtectedRoute>
            } />
            <Route path="/coaching" element={
              <ProtectedRoute><Layout><Coaching /></Layout></ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute roles={["platform_admin", "academy_admin"]}><Layout><Admin /></Layout></ProtectedRoute>
            } />
            <Route path="/staff" element={
              <ProtectedRoute roles={["platform_admin", "academy_admin", "coach"]}><Layout><Staff /></Layout></ProtectedRoute>
            } />
            <Route path="/themes" element={<Layout><ThemePicker /></Layout>} />
            <Route path="/themes/sage" element={<ThemeSage />} />
            <Route path="/themes/sky" element={<ThemeSky />} />
            <Route path="/themes/pitch" element={<ThemePitch />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
      </ThemeProvider>
    </div>
  );
}

export default App;
