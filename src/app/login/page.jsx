"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import TobiasVintage from "/public/tobiasLogin.webp";
import { signIn } from "next-auth/react";
import toast from "react-hot-toast";
import InstallAppButton from "@/components/InstallAppButton";
import { Spinner } from "@/components/LoadingUI";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    const response = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    setLoading(false);

    if (response?.error) {
      toast.error("Login inválido");
      return;
    }

    router.replace("/");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-ink-950 bg-ink-radial px-4 py-10">
      <div className="panel grid w-full max-w-3xl overflow-hidden md:grid-cols-2">
        <div className="relative hidden bg-ink-900 md:block">
          <Image
            alt="Tobias"
            src={TobiasVintage}
            className="h-full w-full object-cover opacity-90"
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
            <h1 className="font-display text-2xl text-ash-200">Entrar</h1>
            <p className="text-sm text-ash-400">
              Continue de onde parou — uma missão por vez.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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
                autoComplete="current-password"
                value={password}
                onChange={({ target }) => setPassword(target.value)}
                required
              />
            </label>

            <button
              className="btn-primary mt-2 w-full"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <Spinner />
                  Entrando…
                </span>
              ) : (
                "Entrar"
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
