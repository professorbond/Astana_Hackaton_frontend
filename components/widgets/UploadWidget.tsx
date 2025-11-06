"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle, AlertTriangle, PiggyBank } from "lucide-react";
import FinanceCharts from "./FinanceCharts";
import { CreditCard } from "lucide-react";
import { useEffect } from "react";

type ApiResponse = {
  reply: string;
  transactions: { date: string; category: string; amount: number }[];
  by_category: { name: string; value: number }[];
  by_date: { date: string; amount: number }[];
};

type CardDTO = {
  id: number;
  number: string;
  balance: number;
  status: string;
  created_at: string;
};

interface UploadWidgetProps {
  token: string;
  onUploadComplete?: () => void;
}

export default function UploadWidget({
  token,
  onUploadComplete,
}: UploadWidgetProps) {
  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<ApiResponse | null>(null);
  const [card, setCard] = useState<CardDTO | null>(null);
  const [cardNumber, setCardNumber] = useState("");
  const [cardChecked, setCardChecked] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("http://localhost:8000/cards", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const cards: CardDTO[] = await res.json();
          setCard(cards[0] ?? null);
        }
      } catch {}
    })();
  }, [token]);

  async function handleAnalyze() {
    // Упрощённый анализ: генерируем советы и графики локально
    if (!card) return;
    setLoading(true);
    setReply(null);
    setError(null);
    setChartData(null);

    try {
      const tips = [
        "Сократи траты на доставку еды на 20% — готовь дома 2 раза в неделю.",
        "Привяжи кэшбэк-карту к супермаркетам: это вернёт до 3–5% в месяц.",
        "Такси заменяй общественным транспортом 2–3 раза в неделю — экономия до 10 000 ₸.",
        "Планируй крупные покупки: правило 24 часов снижает импульсные траты.",
        "Автоматическое накопление 10% с каждого пополнения ускорит достижение цели.",
        "Откажись от ненужных подписок — проверь списания за последние 3 месяца.",
      ];
      const replyText = tips
        .sort(() => 0.5 - Math.random())
        .slice(0, 3)
        .join("\n\n");

      // Генерируем условные транзакции по датам (30 дней)
      const categories = [
        { name: "Продукты", sign: -1, avg: 4000 },
        { name: "Такси", sign: -1, avg: 2000 },
        { name: "Рестораны", sign: -1, avg: 3500 },
        { name: "Учёба", sign: -1, avg: 8000 },
        { name: "Пополнение", sign: 1, avg: 50000 },
        { name: "Зарплата", sign: 1, avg: 250000 },
      ];

      const transactions: { date: string; category: string; amount: number }[] =
        [];
      const now = new Date();
      for (let i = 0; i < 30; i++) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const c = categories[Math.floor(Math.random() * categories.length)];
        const amount = Math.round(c.avg * (0.5 + Math.random()) * 100) / 100;
        transactions.push({
          date: d.toISOString().slice(0, 10),
          category: c.name,
          amount: c.sign * amount,
        });
      }

      // by_category и by_date
      const byCatMap = new Map<string, number>();
      const byDateMap = new Map<string, number>();
      for (const t of transactions) {
        byCatMap.set(t.category, (byCatMap.get(t.category) || 0) + t.amount);
        byDateMap.set(t.date, (byDateMap.get(t.date) || 0) + t.amount);
      }
      const by_category = Array.from(byCatMap.entries()).map(
        ([name, value]) => ({ name, value })
      );
      const by_date = Array.from(byDateMap.entries()).map(([date, amount]) => ({
        date,
        amount,
      }));

      setReply(formatResponse(replyText));
      setChartData({ reply: replyText, transactions, by_category, by_date });
      if (onUploadComplete) onUploadComplete();
    } catch (err: any) {
      setError(err.message || "Ошибка анализа");
    } finally {
      setLoading(false);
    }
  }

  // 🧹 Форматируем ответ AI в список
  function formatResponse(text: string): string[] {
    if (!text) return [];
    const cleaned = text
      .replaceAll("\\n", "\n")
      .replaceAll("\\u003e", ">")
      .replaceAll("\\", "")
      .replace(/руб(?!\w)/g, "₸")
      .replace(/рублей/g, "₸")
      .replace(/руб\./g, "₸")
      .trim();

    const parts = cleaned.split(/\d+\.\s/).filter(Boolean);
    return parts;
  }

  const listVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.25 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <CardContent>
      <p className="text-sm text-muted-foreground mb-3">
        Загрузите банковскую выписку (.pdf, .xlsx или .csv), и AI проанализирует
        ваши расходы.
      </p>

      {/* Привязка карты */}
      <div className="mt-3 flex items-end gap-2">
        <div className="flex-1">
          <label className="text-sm text-muted-foreground">Номер карты</label>
          <input
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            placeholder="**** **** **** 1234"
            className="block w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <Button
          variant="outline"
          onClick={async () => {
            setError(null);
            try {
              const res = await fetch(
                `http://localhost:8000/cards/lookup?number=${encodeURIComponent(cardNumber)}`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              if (!res.ok) throw new Error("Карта не найдена");
              const c = (await res.json()) as CardDTO;
              setCard(c);
              setCardChecked(true);
            } catch (e: any) {
              setCard(null);
              setCardChecked(true);
              setError(e.message || "Карта не найдена");
            }
          }}
        >
          Проверить
        </Button>
      </div>

      {/* Кнопка анализа */}
      <div className="flex justify-end mt-3">
        <Button
          onClick={handleAnalyze}
          disabled={!card || loading}
          className="flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Анализируем...
            </>
          ) : (
            "Анализировать"
          )}
        </Button>
      </div>

      {/* Прогресс */}
      <AnimatePresence>
        {loading && (
          <motion.div
            className="mt-4 h-1 w-full bg-muted overflow-hidden rounded-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="h-1 bg-primary"
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{
                repeat: Infinity,
                duration: 1.1,
                ease: "easeInOut",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ответ AI */}
      <AnimatePresence>
        {reply && (
          <motion.div
            key="reply"
            className="mt-5 p-5 rounded-xl border bg-muted text-sm leading-relaxed space-y-3"
            initial={{ opacity: 0, y: 15, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h3 className="font-semibold flex items-center gap-2 mb-2 text-lg">
              💡 Рекомендации AI
            </h3>

            <motion.ul
              variants={listVariants}
              initial="hidden"
              animate="visible"
              className="space-y-3"
            >
              {reply.map((item, i) => {
                const Icon =
                  i === 0 ? AlertTriangle : i === 1 ? CheckCircle : PiggyBank;
                return (
                  <motion.li
                    key={i}
                    variants={itemVariants}
                    className="flex items-start gap-3"
                  >
                    <Icon className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-muted-foreground">{item.trim()}</p>
                  </motion.li>
                );
              })}
            </motion.ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Графики после анализа */}
      <AnimatePresence>
        {chartData && chartData.transactions?.length > 0 && (
          <motion.div
            key="charts"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-8"
          >
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              📊 Визуализация данных
            </h3>
            <FinanceCharts data={chartData.transactions} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Карта пользователя (из Эмулятора банка) */}
      <div className="mt-10 max-w-xl">
        <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
          <CreditCard className="w-5 h-5" /> Ваша карта
        </h3>
        {card ? (
          <div className="relative overflow-hidden bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white p-6 rounded-2xl shadow-xl">
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-2xl font-bold tracking-wider font-mono">
                    {card.number}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium">
                  {card.status === "active" ? "Активна" : "Неактивна"}
                </span>
              </div>
              <div className="mt-6 pt-6 border-t border-white/20">
                <p className="text-sm opacity-90 mb-2">Баланс</p>
                <p className="text-4xl font-bold">
                  {card.balance.toLocaleString("ru-RU")} ₸
                </p>
              </div>
              <div className="flex justify-end mt-4">
                <Button
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  Проанализировать транзакции
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Карта пока не создана. Зайдите в эмулятор банка, чтобы
            инициализировать карту.
          </p>
        )}
      </div>

      {/* Ошибка */}
      <AnimatePresence>
        {error && (
          <motion.p
            key="error"
            className="text-red-500 mt-3 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            ❌ {error}
          </motion.p>
        )}
      </AnimatePresence>
    </CardContent>
  );
}
