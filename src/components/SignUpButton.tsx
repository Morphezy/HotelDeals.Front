import { useState } from "react";

function getResponseCode(payload: unknown): string {
  if (typeof payload === "string") {
    return payload;
  }

  if (typeof payload === "number" || typeof payload === "boolean") {
    return String(payload);
  }

  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    const value = record.code ?? record.Code ?? record.result ?? record.Result;

    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      return String(value);
    }
  }

  return JSON.stringify(payload);
}

export function SignUpButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [telegramName, setTelegramName] = useState("");
  const [responseCode, setResponseCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleRegister() {
    const trimmedName = telegramName.trim();

    if (!trimmedName) {
      setErrorMessage("Введите ник в Telegram.");
      setResponseCode("");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setResponseCode("");

    try {
      const response = await fetch(
        `http://localhost:8081/Auth/Register?userName=${encodeURIComponent(trimmedName)}`,
      );

      if (!response.ok) {
        throw new Error(`Ошибка запроса: ${response.status}`);
      }

      const contentType = response.headers.get("content-type") ?? "";
      const payload = contentType.includes("application/json")
        ? await response.json()
        : await response.text();

      setResponseCode(getResponseCode(payload));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Не удалось выполнить запрос.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleOpenModal() {
    setIsModalOpen(true);
    setTelegramName("");
    setResponseCode("");
    setErrorMessage("");
    setIsSubmitting(false);
  }

  function handleCloseModal() {
    setIsModalOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpenModal}
        className="fixed top-6 right-6 px-6 py-2 bg-[#005254] text-white rounded-lg font-semibold hover:bg-[#003536] transition-colors z-50"
      >
        Sign Up
      </button>

      {isModalOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 text-[#123133] shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">Регистрация</h2>
                <p className="mt-2 text-sm text-[#456567]">
                  Введите свой ник в Telegram и нажмите далее.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseModal}
                className="text-2xl leading-none text-[#456567] transition-colors hover:text-[#123133]"
                aria-label="Закрыть окно"
              >
                ×
              </button>
            </div>

            <label className="mt-6 block">
              <span className="mb-2 block text-sm font-medium text-[#123133]">
                Telegram ник
              </span>
              <input
                type="text"
                value={telegramName}
                onChange={(event) => setTelegramName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !isSubmitting) {
                    void handleRegister();
                  }
                }}
                placeholder="@username"
                className="w-full rounded-xl border border-[#b7c7c8] px-4 py-3 outline-none transition focus:border-[#005254] focus:ring-2 focus:ring-[#005254]/20"
              />
            </label>

            <button
              type="button"
              onClick={() => void handleRegister()}
              disabled={isSubmitting}
              className="mt-5 w-full rounded-xl bg-[#005254] px-4 py-3 font-semibold text-white transition hover:bg-[#003536] disabled:cursor-not-allowed disabled:bg-[#6a8f90]"
            >
              {isSubmitting ? "Отправка..." : "Далее"}
            </button>

            {errorMessage ? (
              <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </p>
            ) : null}

            {responseCode ? (
              <div className="mt-4 rounded-xl bg-[#eef6f6] px-4 py-3">
                <p className="text-sm text-[#456567]">Код из API</p>
                <p className="mt-1 break-all text-xl font-bold text-[#005254]">
                  {responseCode}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
