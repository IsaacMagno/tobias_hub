"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import TobiasLoginArt from "/public/tobias-login.webp";
import TobiasRegisterArt from "/public/tobias-register.webp";
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
  const router = useRouter();
  const art = mode === "register" ? TobiasRegisterArt : TobiasLoginArt;

  const handleLogin = async () => {
    const response = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    if (response?.error) {
      toast.error("Login inválido");
      return false;
    }
    router.replace("/");
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

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-ink-950 bg-ink-radial px-4 py-10">
      <div className="panel grid w-full max-w-3xl overflow-hidden md:grid-cols-2">
        <div className="relative hidden min-h-[28rem] bg-ink-900 md:block">
          <Image
            alt={mode === "register" ? "Tobias — criar conta" : "Tobias — entrar"}
            src={art}
            className="h-full w-full object-cover object-top opacity-90"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-transparent to-transparent" />
          <p className="absolute bottom-6 left-6 right-6 font-display text-2xl text-ash-200">
            Tobias
          </p>
        </div>

        <div className="flex flex-col justify-center gap-8 p-8 sm:p-10">
          <div className="space-y-2 md:hidden">
            <p className="font-display text-2xl text-copper">Tobias</p>
            <p className="text-sm text-ash-400">Guia de progressão pessoal</p>
          </div>

          <div className="space-y-1">
            <h1 className="font-display text-2xl text-ash-200">
              {mode === "login" ? "Entrar" : "Criar conta"}
            </h1>
            <p className="text-sm text-ash-400">
              {mode === "login"
                ? "Continue de onde parou — uma missão por vez."
                : "Entrada só com código de convite de alguém que já está no Tobias."}
            </p>
          </div>

          <div className="flex gap-2 text-sm">
            <button
              type="button"
              className={`rounded-lg border px-3 py-1.5 ${
                mode === "login"
                  ? "border-copper/40 text-copper"
                  : "border-copper/15 text-ash-400"
              }`}
              onClick={() => setMode("login")}
              disabled={loading}
            >
              Entrar
            </button>
            <button
              type="button"
              className={`rounded-lg border px-3 py-1.5 ${
                mode === "register"
                  ? "border-copper/40 text-copper"
                  : "border-copper/15 text-ash-400"
              }`}
              onClick={() => setMode("register")}
              disabled={loading}
            >
              Criar conta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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

          <InstallAppButton />

          <p className="text-center text-[11px] text-ink-600">
            © {new Date().getFullYear()} Tobias
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
