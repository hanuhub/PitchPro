import { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
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
              <ProtectedRoute roles={["admin"]}><Layout><Admin /></Layout></ProtectedRoute>
            } />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}

export default App;
