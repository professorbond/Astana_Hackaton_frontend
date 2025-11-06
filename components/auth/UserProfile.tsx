"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  created_at: string;
}

interface UserProfileProps {
  token: string;
  onLogout: () => void;
}

export default function UserProfile({ token, onLogout }: UserProfileProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserProfile();
  }, [token]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch("http://localhost:8000/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error("Ошибка получения профиля:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    onLogout();
  };

  if (loading) {
    return (
      <Card className="p-4">
        <div className="text-center">Загрузка профиля...</div>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="p-4">
        <div className="text-center text-red-600">Ошибка загрузки профиля</div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-bold">Профиль пользователя</h2>
          <p className="text-gray-600">Добро пожаловать, {user.username}!</p>
        </div>
        <Button onClick={handleLogout} variant="outline">
          Выйти
        </Button>
      </div>

      <div className="space-y-3">
        <div>
          <span className="font-medium">Имя пользователя:</span>
          <span className="ml-2">{user.username}</span>
        </div>
        <div>
          <span className="font-medium">Email:</span>
          <span className="ml-2">{user.email}</span>
        </div>
        <div>
          <span className="font-medium">Роль:</span>
          <span
            className={`ml-2 px-2 py-1 rounded text-sm ${
              user.role === "admin"
                ? "bg-red-100 text-red-800"
                : "bg-blue-100 text-blue-800"
            }`}
          >
            {user.role === "admin" ? "Администратор" : "Пользователь"}
          </span>
        </div>
        <div>
          <span className="font-medium">Дата регистрации:</span>
          <span className="ml-2">
            {new Date(user.created_at).toLocaleDateString("ru-RU")}
          </span>
        </div>
      </div>
    </Card>
  );
}




