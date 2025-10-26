"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { motion, Variants } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Upload,
  MessageSquare,
  Calculator,
  DollarSign,
  Moon,
  Sun,
  Brain,
  User,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import UploadWidget from "@/components/widgets/UploadWidget";
import CurrencyWidget from "@/components/widgets/CurrencyWidget";
import TipWidget from "@/components/widgets/TipWidget";
import FinanceCalculators from "@/components/widgets/FinanceCalculators";
import ChatWidget from "@/components/widgets/ChatWidget";
import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";
import UserProfile from "@/components/auth/UserProfile";
import MyFiles from "@/components/MyFiles";

type AuthState = "login" | "register" | "authenticated";

export default function DashboardPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [authState, setAuthState] = useState<AuthState>("login");
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Проверяем, есть ли сохраненный токен
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      setToken(savedToken);
      setAuthState("authenticated");
    }
  }, []);

  const handleLogin = (newToken: string) => {
    setToken(newToken);
    setAuthState("authenticated");
  };

  const handleRegister = (newToken: string) => {
    setToken(newToken);
    setAuthState("authenticated");
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setAuthState("login");
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number = 0) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.08, duration: 0.3, ease: "easeOut" },
    }),
    hover: {
      scale: 1,
      boxShadow:
        "0 0 20px rgba(16,185,129,0.4), 0 0 10px rgba(16,185,129,0.2) inset",
      transition: { duration: 0.25, ease: "easeOut" },
    },
  };

  // Если пользователь не авторизован, показываем форму входа/регистрации
  if (authState !== "authenticated") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {authState === "login" ? (
            <LoginForm
              onLogin={handleLogin}
              onSwitchToRegister={() => setAuthState("register")}
            />
          ) : (
            <RegisterForm
              onRegister={handleRegister}
              onSwitchToLogin={() => setAuthState("login")}
            />
          )}
        </div>
      </div>
    );
  }

  const cards = [
    {
      title: (
        <div className="flex items-center gap-3">
          <User className="w-7 h-7 text-primary" />
          <span className="text-2xl font-semibold">Профиль</span>
        </div>
      ),
      content: <UserProfile token={token!} onLogout={handleLogout} />,
      span: "md:col-span-1",
    },
    {
      title: (
        <div className="flex items-center gap-3">
          <FileText className="w-7 h-7 text-primary" />
          <span className="text-2xl font-semibold">Мои файлы</span>
        </div>
      ),
      content: <MyFiles token={token!} />,
      span: "md:col-span-2",
    },
    {
      title: (
        <div className="flex items-center gap-3">
          <MessageSquare className="w-7 h-7 text-primary" />
          <span className="text-2xl font-semibold">AI-чат ассистент</span>
        </div>
      ),
      content: <ChatWidget />,
      span: "md:col-span-2",
    },
    {
      title: (
        <div className="flex items-center gap-3">
          <DollarSign className="w-7 h-7 text-primary" />
          <span className="text-2xl font-semibold">Курсы валют</span>
        </div>
      ),
      content: <CurrencyWidget />,
      span: "md:col-span-1",
    },
    {
      title: (
        <div className="flex items-center gap-3">
          <Upload className="w-7 h-7 text-primary" />
          <span className="text-2xl font-semibold">
            Анализ расходов (PDF / Excel)
          </span>
        </div>
      ),
      content: <UploadWidget token={token!} />,
      span: "col-span-1 md:col-span-3",
    },
    {
      title: (
        <div className="flex items-center gap-3">
          <Calculator className="w-7 h-7 text-primary" />
          <span className="text-2xl font-semibold">
            Финансовые калькуляторы
          </span>
        </div>
      ),
      content: <FinanceCalculators />,
      span: "col-span-3 xl:col-span-2",
    },
    {
      title: (
        <div className="flex items-center gap-3">
          <Brain className="w-7 h-7 text-primary" />
          <span className="text-2xl font-semibold">Совет от AI</span>
        </div>
      ),
      content: <TipWidget />,
      span: "col-span-3 xl:col-span-1",
    },
  ];

  return (
    <motion.div
      className={cn(
        "min-h-screen p-4 md:p-6 transition-colors duration-300",
        darkMode ? "dark bg-background text-foreground" : "bg-background"
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Header */}
      <motion.header
        className="flex items-center justify-between mb-4 md:mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="AI Bank Logo"
            width={40}
            height={40}
            priority
          />
          <h1 className="text-3xl font-bold tracking-tight">
            AI Bank Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setDarkMode(!darkMode)}
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </Button>
        </div>
      </motion.header>

      {/* Сетка карточек */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {cards.map((card, i) => (
          <motion.div
            key={i}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            custom={i}
            className={cn(
              "rounded-xl border border-border bg-card/90 backdrop-blur-sm transition duration-300",
              card?.span || ""
            )}
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle>{card?.title}</CardTitle>
              </CardHeader>
              <CardContent>{card?.content}</CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
