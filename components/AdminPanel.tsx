"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Users, DollarSign, FileText, TrendingUp } from "lucide-react";

interface AdminReport {
  user_id: number;
  username: string;
  email: string;
  files_count: number;
  total_uploaded_amount: number;
  last_upload: string | null;
  files: FileAnalysis[];
}

interface FileAnalysis {
  id: number;
  filename: string;
  upload_date: string;
  ai_analysis: string;
  total_amount: number;
  transactions_count: number;
  category_stats: string;
}

interface AdminPanelProps {
  token: string;
}

export default function AdminPanel({ token }: AdminPanelProps) {
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAdminReports();
  }, [token]);

  const fetchAdminReports = async () => {
    try {
      const response = await fetch("http://localhost:8000/admin/reports", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setReports(data);
      } else {
        setError("Ошибка загрузки данных");
      }
    } catch (err) {
      setError("Ошибка соединения с сервером");
    } finally {
      setLoading(false);
    }
  };

  const parseCategoryStats = (categoryStats: string) => {
    try {
      return JSON.parse(categoryStats);
    } catch {
      return [];
    }
  };

  // Подсчет общей статистики
  const totalUsers = reports.length;
  const totalFiles = reports.reduce(
    (sum, report) => sum + report.files_count,
    0
  );
  const totalAmount = reports.reduce(
    (sum, report) => sum + report.total_uploaded_amount,
    0
  );

  // Подсчет статистики по категориям
  const categoryTotals = new Map<string, number>();
  reports.forEach((report) => {
    report.files.forEach((file) => {
      const categories = parseCategoryStats(file.category_stats);
      categories.forEach((cat: any) => {
        categoryTotals.set(
          cat.category,
          (categoryTotals.get(cat.category) || 0) + cat.amount
        );
      });
    });
  });

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center">Загрузка данных...</div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-red-600 text-center">{error}</div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Общая статистика */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Всего пользователей</p>
              <p className="text-3xl font-bold text-blue-700">{totalUsers}</p>
            </div>
            <Users className="w-12 h-12 text-blue-500" />
          </div>
        </Card>

        <Card className="p-6 bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Всего файлов</p>
              <p className="text-3xl font-bold text-green-700">{totalFiles}</p>
            </div>
            <FileText className="w-12 h-12 text-green-500" />
          </div>
        </Card>

        <Card className="p-6 bg-purple-50 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Общая сумма расходов</p>
              <p className="text-3xl font-bold text-purple-700">
                {totalAmount.toLocaleString("ru-RU")} ₸
              </p>
            </div>
            <DollarSign className="w-12 h-12 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Статистика по категориям */}
      {categoryTotals.size > 0 && (
        <Card className="p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            Расходы по категориям
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Array.from(categoryTotals.entries())
              .sort((a, b) => b[1] - a[1])
              .map(([category, amount]) => (
                <div
                  key={category}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-md"
                >
                  <span className="text-sm font-medium">{category}:</span>
                  <span className="font-bold text-green-600">
                    {amount.toLocaleString("ru-RU")} ₸
                  </span>
                </div>
              ))}
          </div>
        </Card>
      )}

      {/* Детали по пользователям */}
      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4">Пользователи и их файлы</h3>
        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report.user_id}
              className="border rounded-lg p-4 bg-gray-50"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-semibold text-lg">{report.username}</h4>
                  <p className="text-sm text-gray-600">{report.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">
                    {report.total_uploaded_amount.toLocaleString("ru-RU")} ₸
                  </p>
                  <p className="text-sm text-gray-600">
                    {report.files_count} файлов
                  </p>
                </div>
              </div>

              {report.files.length > 0 && (
                <div className="space-y-2">
                  {report.files.map((file) => {
                    const categories = parseCategoryStats(file.category_stats);
                    return (
                      <div
                        key={file.id}
                        className="bg-white p-3 rounded border border-gray-200"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium">{file.filename}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(file.upload_date).toLocaleDateString(
                                "ru-RU"
                              )}
                            </p>
                          </div>
                          <p className="font-bold text-green-600">
                            {file.total_amount.toLocaleString("ru-RU")} ₸
                          </p>
                        </div>
                        {categories.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <p className="text-xs font-medium mb-1">
                              Категории:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {categories.slice(0, 3).map((cat: any, idx) => (
                                <span
                                  key={idx}
                                  className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded"
                                >
                                  {cat.category}:{" "}
                                  {cat.amount.toLocaleString("ru-RU")} ₸
                                </span>
                              ))}
                              {categories.length > 3 && (
                                <span className="text-xs text-gray-500">
                                  +{categories.length - 3} еще
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {report.files.length === 0 && (
                <p className="text-sm text-gray-500 italic">
                  Пользователь еще не загрузил файлы
                </p>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
