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
  refreshTrigger?: number;
}

export default function MyFiles({ token, refreshTrigger }: MyFilesProps) {
  const [files, setFiles] = useState<FileAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMyFiles();
  }, [token, refreshTrigger]);

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

  // Проверяем, является ли файл seed данными (старым форматом)
  const isSeedData = (categories: any[]) => {
    const seedCategories = [
      "продукты",
      "развлечения",
      "одежда",
      "услуги",
      "медицина",
      "образование",
      "покупки",
    ];
    return categories.some((cat: any) => {
      const catName = (cat.category || "").toLowerCase();
      return seedCategories.some((seed) => catName.includes(seed));
    });
  };

  // Проверяем, является ли файл новым загруженным файлом (с фиксированными данными)
  const isNewUploadedFile = (categories: any[]) => {
    return categories.some((cat: any) => {
      const catName = cat.category || "";
      return (
        catName.includes("Пополнения") ||
        catName.includes("Такси (YANDEX.GO)") ||
        catName.includes("Переводы")
      );
    });
  };

  // Маппинг категорий для новых файлов
  const getCategoryDisplayNameNew = (category: string) => {
    const categoryMap: { [key: string]: string } = {
      Пополнения: "💵 Пополнения",
      Переводы: "💸 Переводы",
      "Такси (YANDEX.GO)": "🚖 Такси (YANDEX.GO)",
      Продукты: "🛒 Продукты",
    };
    return categoryMap[category] || category;
  };

  // Маппинг категорий для красивого отображения (для seed данных)
  const getCategoryDisplayName = (category: string) => {
    const categoryMap: { [key: string]: string } = {
      Пополнения: "💰 Пополнения",
      "Переводы (входящие)": "💸 Переводы входящие",
      "Переводы (исходящие)": "💸 Переводы исходящие",
      Комиссии: "💳 Комиссии",
      Прочее: "📋 Прочее",
      Транспорт: "🚗 Транспорт",
      Продукты: "🛒 Продукты",
      Образование: "🎓 Образование",
      Медицина: "💊 Медицина",
      "Покупки онлайн": "🛍️ Покупки онлайн",
      Аренда: "🏠 Аренда",
      Покупки: "🛒 Покупки",
      "Коммунальные услуги": "💡 Коммунальные услуги",
      Развлечения: "🎉 Развлечения",
      "Банкомат/Снятие": "🏧 Банкомат",
      "Не указано": "❓ Не указано",
      Услуги: "⚙️ Услуги",
      Одежда: "👔 Одежда",
      // Старые
      "Переводы/Пополнения": "Переводы",
      Переводы: "Переводы",
      "transfer/deposit": "Переводы",
      purchase: "Покупки",
      utilities: "Коммунальные услуги",
      cash: "Банкомат",
    };

    return categoryMap[category] || category;
  };

  // Фильтруем и группируем категории для отображения только 3 категорий (для новых файлов)
  const filterAndGroupCategories = (categories: any[]) => {
    const result: { [key: string]: number } = {
      Пополнения: 0,
      Переводы: 0,
      Такси: 0,
    };

    categories.forEach((cat: any) => {
      const categoryName = (cat.category || "").toLowerCase();
      const amount = cat.amount || 0;

      // Определяем к какой категории относится (приоритет по названию категории)
      if (
        categoryName.includes("транспорт") ||
        categoryName.includes("такси") ||
        categoryName.includes("yandex") ||
        categoryName.includes("яндекс") ||
        categoryName.includes("uber")
      ) {
        // Такси/Транспорт - всегда расход
        result["Такси"] += Math.abs(amount);
      } else if (
        categoryName.includes("перевод") ||
        categoryName.includes("transfer") ||
        categoryName.includes("входящ") ||
        categoryName.includes("исходящ")
      ) {
        // Переводы (входящие и исходящие объединяем)
        result["Переводы"] += Math.abs(amount);
      } else if (
        categoryName.includes("пополнени") ||
        categoryName.includes("deposit") ||
        amount > 0
      ) {
        // Пополнения (доходы)
        if (amount > 0) {
          result["Пополнения"] += amount;
        }
      }
    });

    // Формируем массив только с ненулевыми категориями
    return Object.entries(result)
      .filter(([_, amount]) => amount !== 0)
      .map(([category, amount]) => ({
        category,
        amount:
          category === "Пополнения"
            ? Math.abs(result["Пополнения"])
            : -Math.abs(amount), // Переводы и Такси всегда отрицательные для отображения
      }));
  };

  // Форматирование числа с пробелами
  const formatNumber = (num: number) => {
    return Math.abs(num)
      .toLocaleString("ru-RU", { useGrouping: true })
      .replace(/,/g, " ");
  };

  // Подсчет количества транзакций YANDEX.GO из категорий и ai_analysis
  const countTaxiTrips = (categories: any[], aiAnalysis?: string) => {
    let totalAmount = 0;
    let tripCount = 0;

    // Сначала пытаемся извлечь количество поездок из ai_analysis
    if (aiAnalysis) {
      // Ищем паттерны типа "7 поездок", "25 поездок", "7 trips" и т.д.
      const tripPatterns = [
        /(\d+)\s*(?:поезд|рейс|trip)/i,
        /(?:поезд|рейс|trip).*?(\d+)/i,
      ];

      for (const pattern of tripPatterns) {
        const match = aiAnalysis.match(pattern);
        if (match) {
          tripCount = parseInt(match[1]);
          break;
        }
      }
    }

    // Суммируем сумму такси из категорий
    categories.forEach((cat: any) => {
      const categoryName = (cat.category || "").toLowerCase();
      const amount = Math.abs(cat.amount || 0);

      if (
        categoryName.includes("транспорт") ||
        categoryName.includes("такси") ||
        categoryName.includes("yandex") ||
        categoryName.includes("яндекс") ||
        categoryName.includes("uber")
      ) {
        totalAmount += amount;
      }
    });

    // Если не нашли количество поездок в ai_analysis, считаем по средней стоимости
    if (tripCount === 0 && totalAmount > 0) {
      // Средняя стоимость поездки YANDEX.GO ~1500-2000 тенге, используем 1500 для консервативной оценки
      tripCount = Math.max(1, Math.round(totalAmount / 1500));
    }

    return { totalAmount, tripCount };
  };

  // Генерация текстового анализа
  const generateTextAnalysis = (
    categories: any[],
    totalAmount: number,
    aiAnalysis?: string
  ) => {
    const filtered = filterAndGroupCategories(categories);
    const expenses = filtered.filter((c) => c.amount < 0);
    const sortedExpenses = [...expenses].sort(
      (a, b) => Math.abs(b.amount) - Math.abs(a.amount)
    );

    let analysis = "";

    // Самая большая категория трат
    if (sortedExpenses.length > 0) {
      const biggest = sortedExpenses[0];
      const biggestName =
        biggest.category === "Такси"
          ? "Такси"
          : biggest.category === "Переводы"
            ? "Переводы"
            : biggest.category;
      analysis += `Самая большая категория трат: ${biggestName} (${formatNumber(biggest.amount)} ₸). `;
    }

    // Расчет экономии на такси
    const taxiCategory = filtered.find((c) => c.category === "Такси");
    if (taxiCategory && taxiCategory.amount < 0) {
      const { tripCount } = countTaxiTrips(categories, aiAnalysis);
      const taxiAmount = Math.abs(taxiCategory.amount);

      if (tripCount > 0) {
        const busCost = tripCount * 100;
        const savings = taxiAmount - busCost;

        if (savings > 0) {
          analysis += `Если бы вместо такси использовался автобус (${tripCount} поездок × 100 ₸ = ${formatNumber(busCost)} ₸), можно было бы сэкономить ${formatNumber(savings)} ₸. `;
        }
      }
    }

    // Вторая по величине категория расходов
    if (sortedExpenses.length > 1) {
      const second = sortedExpenses[1];
      const secondName =
        second.category === "Такси"
          ? "Такси"
          : second.category === "Переводы"
            ? "Переводы"
            : second.category;
      analysis += `Вторая по величине категория: ${secondName} (${formatNumber(second.amount)} ₸). `;
    }

    // Совет
    if (taxiCategory && taxiCategory.amount < 0) {
      analysis += `Рекомендуем использовать общественный транспорт для снижения расходов на передвижение.`;
    } else if (sortedExpenses.length > 0) {
      analysis += `Рекомендуем пересмотреть расходы по категории "${sortedExpenses[0].category}" для оптимизации бюджета.`;
    }

    return analysis.trim();
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
            const allCategories = parseCategoryStats(file.category_stats);
            const isSeed = isSeedData(allCategories);
            const isNewFile = isNewUploadedFile(allCategories);

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
                    {isNewFile && (
                      <div className="text-sm text-gray-600 mb-1">
                        Остаток на карте:
                      </div>
                    )}
                    <div
                      className={`text-lg font-bold ${
                        (file.total_amount || 0) >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {isNewFile
                        ? "💳 " + formatNumber(file.total_amount || 0) + " ₸"
                        : (file.total_amount || 0).toLocaleString("ru-RU") +
                          " ₸"}
                    </div>
                    <div className="text-sm text-gray-600">
                      {file.transactions_count} транзакций
                    </div>
                  </div>
                </div>

                {file.ai_analysis && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Анализ ИИ:</h4>
                    <div className="bg-blue-50 p-3 rounded-md text-sm whitespace-pre-line">
                      {file.ai_analysis}
                    </div>
                  </div>
                )}

                {allCategories.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">
                      Детализация по категориям:
                    </h4>
                    <div className="space-y-2">
                      {allCategories.map((category: any, index: number) => {
                        const isIncome = category.amount > 0;
                        const isExpense = category.amount < 0;

                        // Для новых файлов - специальный формат
                        if (isNewFile) {
                          const isGreen = category.category === "Пополнения";
                          const isRed =
                            category.category === "Переводы" ||
                            category.category === "Такси (YANDEX.GO)" ||
                            category.category === "Продукты";

                          return (
                            <div
                              key={index}
                              className={`flex justify-between text-sm p-2 rounded ${
                                isGreen
                                  ? "bg-green-50 border border-green-200"
                                  : isRed
                                    ? "bg-red-50 border border-red-200"
                                    : "bg-gray-50"
                              }`}
                            >
                              <span className="font-medium">
                                {getCategoryDisplayNameNew(category.category)}
                              </span>
                              <span
                                className={`font-bold ${
                                  isGreen
                                    ? "text-green-600"
                                    : isRed
                                      ? "text-red-600"
                                      : "text-gray-600"
                                }`}
                              >
                                {formatNumber(category.amount)}{" "}
                                {category.category === "Продукты"
                                  ? "₸ (примерно)"
                                  : "₸"}
                              </span>
                            </div>
                          );
                        }

                        // Для seed данных - старый формат
                        return (
                          <div
                            key={index}
                            className={`flex justify-between text-sm p-2 rounded ${
                              isIncome
                                ? "bg-green-50 border border-green-200"
                                : isExpense
                                  ? "bg-red-50 border border-red-200"
                                  : "bg-gray-50"
                            }`}
                          >
                            <span className="font-medium">
                              {getCategoryDisplayName(category.category)}
                            </span>
                            <span
                              className={`font-bold ${
                                isIncome
                                  ? "text-green-600"
                                  : isExpense
                                    ? "text-red-600"
                                    : "text-gray-600"
                              }`}
                            >
                              {isIncome ? "+" : ""}
                              {category.amount?.toLocaleString("ru-RU")} ₸
                            </span>
                          </div>
                        );
                      })}
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
