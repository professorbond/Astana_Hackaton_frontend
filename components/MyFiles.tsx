"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface FileAnalysis {
  id: number;
  filename: string;
  upload_date: string;
  ai_analysis: string;
  total_amount: number;
  transactions_count: number;
  category_stats: string;
}

interface MyFilesProps {
  token: string;
}

export default function MyFiles({ token }: MyFilesProps) {
  const [files, setFiles] = useState<FileAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMyFiles();
  }, [token]);

  const fetchMyFiles = async () => {
    try {
      const response = await fetch("http://localhost:8000/my-files", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const filesData = await response.json();
        setFiles(filesData);
      } else {
        setError("Ошибка загрузки файлов");
      }
    } catch (error) {
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

  if (loading) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Мои файлы</h2>
        <div className="text-center">Загрузка файлов...</div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Мои файлы</h2>
        <div className="text-red-600 text-center">{error}</div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-4">Мои файлы</h2>

      {files.length === 0 ? (
        <div className="text-center text-gray-600 py-8">
          У вас пока нет загруженных файлов
        </div>
      ) : (
        <div className="space-y-4">
          {files.map((file) => {
            const categories = parseCategoryStats(file.category_stats);

            return (
              <Card key={file.id} className="p-4 border">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{file.filename}</h3>
                    <p className="text-sm text-gray-600">
                      Загружен:{" "}
                      {new Date(file.upload_date).toLocaleDateString("ru-RU")}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      {file.total_amount?.toLocaleString("ru-RU")} ₸
                    </div>
                    <div className="text-sm text-gray-600">
                      {file.transactions_count} транзакций
                    </div>
                  </div>
                </div>

                {file.ai_analysis && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Анализ ИИ:</h4>
                    <div className="bg-blue-50 p-3 rounded-md text-sm">
                      {file.ai_analysis}
                    </div>
                  </div>
                )}

                {categories.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Расходы по категориям:</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {categories.map((category: any, index: number) => (
                        <div
                          key={index}
                          className="flex justify-between text-sm"
                        >
                          <span>{category.category}:</span>
                          <span className="font-medium">
                            {category.amount?.toLocaleString("ru-RU")} ₸
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </Card>
  );
}
