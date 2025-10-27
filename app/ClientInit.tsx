"use client";

import { useEffect } from "react";

export default function ClientInit() {
  useEffect(() => {
    // 🧹 Удаляем токен при старте фронта
    localStorage.removeItem("token");
    console.log("🔄 Токен очищен при запуске приложения");
  }, []);

  return null;
}
