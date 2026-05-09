import { useEffect, useRef, useState } from "react";
import type { HubConnection } from "@microsoft/signalr";
import {
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";

const API_BASE_URL = "http://localhost:8081";
const AUTH_HUB_URL = `${API_BASE_URL}/authHub`;
const REGISTRATION_TIMEOUT_MS = 120_000;

type RegistrationConfirmedDto = {
  registrationId: string;
  userName: string;
  token: string;
};

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

function saveRegistration(payload: RegistrationConfirmedDto) {
  localStorage.setItem("authToken", payload.token);
  localStorage.setItem("registrationId", payload.registrationId);
  localStorage.setItem("authUserName", payload.userName);
  window.dispatchEvent(new CustomEvent("auth:registered", { detail: payload }));
}

export function SignUpButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [telegramName, setTelegramName] = useState("");
  const [authorizedUserName, setAuthorizedUserName] = useState(
    () => localStorage.getItem("authUserName") ?? "",
  );
  const [responseCode, setResponseCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWaitingForConfirmation, setIsWaitingForConfirmation] = useState(false);
  const connectionRef = useRef<HubConnection | null>(null);

  useEffect(() => {
    return () => {
      void stopHubConnection();
    };
  }, []);

  async function stopHubConnection() {
    const connection = connectionRef.current;
    connectionRef.current = null;

    if (!connection) {
      return;
    }

    connection.off("RegistrationConfirmed");
    connection.off("Registration is already pending");

    if (connection.state !== HubConnectionState.Disconnected) {
      await connection.stop();
    }
  }

  async function createRegistrationConnection(userName: string) {
    await stopHubConnection();

    const connection = new HubConnectionBuilder()
      .withUrl(AUTH_HUB_URL)
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    connectionRef.current = connection;

    await connection.start();
    await connection.invoke("JoinRegistration", userName);

    return connection;
  }

  async function handleRegister() {
    const trimmedName = telegramName.trim();

    if (!trimmedName) {
      setErrorMessage("Введите ник в Telegram.");
      return;
    }

    setIsSubmitting(true);
    setIsWaitingForConfirmation(false);
    setErrorMessage("");
    setResponseCode("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/Auth/Register?userName=${encodeURIComponent(trimmedName)}`,
      );

      if (!response.ok) {
        throw new Error(`Ошибка запроса: ${response.status}`);
      }

      const contentType = response.headers.get("content-type") ?? "";
      const apiPayload = contentType.includes("application/json")
        ? await response.json()
        : await response.text();

      setResponseCode(getResponseCode(apiPayload));
      setIsWaitingForConfirmation(true);

      const connection = await createRegistrationConnection(trimmedName);
      const registrationConfirmed = new Promise<RegistrationConfirmedDto>(
        (resolve, reject) => {
          const timeoutId = window.setTimeout(() => {
            reject(new Error("Истекло время ожидания подтверждения регистрации."));
          }, REGISTRATION_TIMEOUT_MS);

          connection.on(
            "RegistrationConfirmed",
            (payload: RegistrationConfirmedDto) => {
              window.clearTimeout(timeoutId);
              resolve(payload);
            },
          );

          connection.on("Registration is already pending", () => {
            window.clearTimeout(timeoutId);
            reject(new Error("Регистрация для этого пользователя уже ожидает подтверждения."));
          });
        },
      );

      const payload = await registrationConfirmed;
      saveRegistration(payload);
      setAuthorizedUserName(payload.userName);
      setIsModalOpen(false);
      setTelegramName("");
      setResponseCode("");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Не удалось выполнить запрос.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
      setIsWaitingForConfirmation(false);
      await stopHubConnection();
    }
  }

  function handleOpenModal() {
    if (authorizedUserName) {
      return;
    }

    setIsModalOpen(true);
    setTelegramName("");
    setResponseCode("");
    setErrorMessage("");
    setIsSubmitting(false);
    setIsWaitingForConfirmation(false);
  }

  function handleCloseModal() {
    void stopHubConnection();
    setIsSubmitting(false);
    setIsWaitingForConfirmation(false);
    setIsModalOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpenModal}
        className="fixed top-6 right-6 px-6 py-2 bg-[#005254] text-white rounded-lg font-semibold hover:bg-[#003536] transition-colors z-50"
      >
        {authorizedUserName ? `@${authorizedUserName.replace(/^@/, "")}` : "Sign Up"}
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
                disabled={isSubmitting}
                onChange={(event) => setTelegramName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !isSubmitting) {
                    void handleRegister();
                  }
                }}
                placeholder="@username"
                className="w-full rounded-xl border border-[#b7c7c8] px-4 py-3 outline-none transition focus:border-[#005254] focus:ring-2 focus:ring-[#005254]/20 disabled:bg-[#eef3f3] disabled:text-[#6a8f90]"
              />
            </label>

            <button
              type="button"
              onClick={() => void handleRegister()}
              disabled={isSubmitting}
              className="mt-5 w-full rounded-xl bg-[#005254] px-4 py-3 font-semibold text-white transition hover:bg-[#003536] disabled:cursor-not-allowed disabled:bg-[#6a8f90]"
            >
              {isWaitingForConfirmation
                ? "Ожидание подтверждения..."
                : isSubmitting
                  ? "Отправка..."
                  : "Далее"}
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

            {isWaitingForConfirmation ? (
              <p className="mt-4 rounded-xl bg-[#eef6f6] px-4 py-3 text-sm text-[#456567]">
                Подтвердите регистрацию в Telegram. Окно закроется автоматически.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
