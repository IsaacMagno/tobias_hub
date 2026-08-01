"use client";

import Image from "next/image";
import { useState } from "react";
import TobiasLoginArt from "/public/tobias-login.webp";
import TobiasRegisterArt from "/public/tobias-register.webp";
import TobiasLoginMobile from "/public/tobias-login-mobile.png";
import TobiasRegisterMobile from "/public/tobias-register-mobile.png";
import { signIn } from "next-auth/react";
import toast from "react-hot-toast";
import InstallAppButton from "@/components/InstallAppButton";
import { Spinner } from "@/components/LoadingUI";
import { actionRegisterChampion } from "../services/requests";

const Login = () => {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);

  const desktopArt = mode === "register" ? TobiasRegisterArt : TobiasLoginArt;
  const mobileArt =
    mode === "register" ? TobiasRegisterMobile : TobiasLoginMobile;

  const handleLogin = async () => {
    const response = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    if (!response?.ok || response?.error) {
      toast.error("Login inválido");
      return false;
    }
    window.location.assign("/");
    return true;
  };

  const handleRegister = async () => {
    const result = await actionRegisterChampion({
      name,
      username,
      password,
      inviteCode,
    });
    if (!result?.ok) {
      toast.error(result?.message || "Falha no cadastro");
      return false;
    }
    toast.success("Conta criada");
    return handleLogin();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      if (mode === "register") await handleRegister();
      else await handleLogin();
    } finally {
      setLoading(false);
    }
  };

  const formFields = (
    <>
      <div className="flex gap-1 rounded-xl border border-copper/15 bg-ink-950/50 p-1">
        <button
          type="button"
          className={`flex-1 rounded-lg px-3 py-2 text-sm transition ${
            mode === "login"
              ? "bg-copper/20 text-copper-bright"
              : "text-ash-400 hover:text-ash-300"
          }`}
          onClick={() => setMode("login")}
          disabled={loading}
        >
          Entrar
        </button>
        <button
          type="button"
          className={`flex-1 rounded-lg px-3 py-2 text-sm transition ${
            mode === "register"
              ? "bg-copper/20 text-copper-bright"
              : "text-ash-400 hover:text-ash-300"
          }`}
          onClick={() => setMode("register")}
          disabled={loading}
        >
          Criar conta
        </button>
      </div>

      <form
        key={mode}
        onSubmit={handleSubmit}
        className="flex animate-[fadeRise_420ms_ease-out] flex-col gap-3"
      >
        {mode === "register" && (
          <>
            <label className="space-y-1.5">
              <span className="text-xs uppercase tracking-wider text-ash-400">
                Nome
              </span>
              <input
                className="input-field"
                type="text"
                autoComplete="name"
                value={name}
                onChange={({ target }) => setName(target.value)}
                required
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs uppercase tracking-wider text-ash-400">
                Código de convite
              </span>
              <input
                className="input-field"
                type="text"
                autoComplete="off"
                value={inviteCode}
                onChange={({ target }) => setInviteCode(target.value)}
                required
              />
            </label>
          </>
        )}

        <label className="space-y-1.5">
          <span className="text-xs uppercase tracking-wider text-ash-400">
            Usuário
          </span>
          <input
            className="input-field"
            id="username"
            type="text"
            autoComplete="username"
            value={username}
            onChange={({ target }) => setUsername(target.value)}
            required
          />
        </label>

        <label className="space-y-1.5">
          <span className="text-xs uppercase tracking-wider text-ash-400">
            Senha
          </span>
          <input
            className="input-field"
            id="password"
            type="password"
            autoComplete={
              mode === "register" ? "new-password" : "current-password"
            }
            value={password}
            onChange={({ target }) => setPassword(target.value)}
            required
          />
          {mode === "register" ? (
            <span className="block text-[11px] text-ash-500">
              Mín. 6 caracteres, com letra e número.
            </span>
          ) : null}
        </label>

        <button
          className="btn-primary mt-2 w-full"
          type="submit"
          disabled={loading}
        >
          {loading ? (
            <span className="inline-flex items-center justify-center gap-2">
              <Spinner />
              {mode === "login" ? "Entrando…" : "Criando…"}
            </span>
          ) : mode === "login" ? (
            "Entrar"
          ) : (
            "Criar conta"
          )}
        </button>
      </form>
    </>
  );

  return (
    <>
      {/* —— Mobile: hero full-bleed + folha do formulário —— */}
      <div className="relative min-h-screen bg-ink-950 md:hidden">
        <div className="relative h-[46vh] min-h-[220px] max-h-[360px] overflow-hidden">
          <Image
            key={mode === "register" ? "reg-m" : "login-m"}
            alt=""
            src={mobileArt}
            fill
            priority
            sizes="100vw"
            className="animate-[heroDrift_1.1s_ease-out] object-cover object-[center_20%]"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink-950/25 via-transparent to-ink-950" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-ink-950 to-transparent" />

          <div className="absolute inset-x-0 bottom-8 px-6 text-center">
            <p className="font-display text-[2.35rem] leading-none tracking-wide text-ash-200 drop-shadow-[0_2px_18px_rgba(0,0,0,0.65)]">
              Tobias
            </p>
          </div>
        </div>

        <div className="relative -mt-5 rounded-t-[1.75rem] border-t border-copper/20 bg-ink-900/95 px-5 pb-10 pt-7 shadow-[0_-12px_40px_rgba(0,0,0,0.45)] backdrop-blur-md">
          <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-copper/25" />
          <div className="mx-auto max-w-md space-y-5">
            <div className="space-y-1">
              <h1 className="font-display text-xl text-ash-200">
                {mode === "login" ? "Entrar" : "Criar conta"}
              </h1>
            </div>
            {formFields}
            <div className="pt-1">
              <InstallAppButton />
            </div>
            <p className="pt-2 text-center text-[11px] text-ash-600">
              © {new Date().getFullYear()} Tobias
            </p>
          </div>
        </div>
      </div>

      {/* —— Desktop: painel em duas colunas —— */}
      <div className="relative hidden min-h-screen items-center justify-center bg-ink-950 bg-ink-radial px-4 py-10 md:flex">
        <div className="panel grid w-full max-w-3xl overflow-hidden md:grid-cols-2">
          <div className="relative min-h-[28rem] overflow-hidden bg-ink-900">
            <Image
              key={mode === "register" ? "reg-d" : "login-d"}
              alt={
                mode === "register" ? "Tobias — criar conta" : "Tobias — entrar"
              }
              src={desktopArt}
              fill
              priority
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover object-top opacity-90 animate-[heroDrift_1.1s_ease-out]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-transparent to-transparent" />
            <p className="absolute bottom-6 left-6 right-6 font-display text-2xl text-ash-200">
              Tobias
            </p>
          </div>

          <div className="flex flex-col justify-center gap-6 p-8 sm:p-10">
            <div className="space-y-1">
              <h1 className="font-display text-2xl text-ash-200">
                {mode === "login" ? "Entrar" : "Criar conta"}
              </h1>
            </div>
            {formFields}
            <InstallAppButton />
            <p className="text-center text-[11px] text-ash-600">
              © {new Date().getFullYear()} Tobias
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
