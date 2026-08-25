import Link from "next/link";
import { auth } from "@/auth";
import { Nav } from "@/components/nav";
import { LoginButton } from "@/components/login-button";

export default async function Home() {
  const oauthConfigured = Boolean(
    process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
  );
  const session = oauthConfigured ? await auth() : null;

  if (!oauthConfigured) {
    return (
      <>
        <Nav />
        <main className="shell">
          <section className="welcome">
            <p className="eyebrow">MODO DEMO · STACKBLITZ</p>
            <h1>¿Qué historia guardamos hoy?</h1>
            <p className="muted">Google y Drive todavía no están conectados. Puedes probar la interfaz y crear cuentos; el guardado en Drive se activará después.</p>
          </section>
          <section className="cardGrid">
            <Link href="/new" className="card actionCard">
              <span className="cardIcon">✦</span>
              <h2>Crear un cuento</h2>
              <p>Histórico o personal, con defaults inteligentes según la edad.</p>
            </Link>
            <div className="card actionCard" aria-disabled="true">
              <span className="cardIcon">▤</span>
              <h2>Biblioteca</h2>
              <p>Se activará cuando conectemos Google Drive.</p>
            </div>
            <div className="card actionCard" aria-disabled="true">
              <span className="cardIcon">◎</span>
              <h2>Ficha familiar</h2>
              <p>Se activará cuando conectemos Google Drive.</p>
            </div>
          </section>
        </main>
      </>
    );
  }

  if (!session?.user) {
    return (
      <main className="landing">
        <section className="hero">
          <p className="eyebrow">BIBLIOTECA FAMILIAR PRIVADA</p>
          <h1>Cuentos que crecen con Octavio.</h1>
          <p className="lead">
            Historia, mitología y recuerdos familiares convertidos en cuentos,
            ilustraciones y, cuando merezca la pena, libros físicos.
          </p>
          <LoginButton />
          <p className="muted small">Google se usa para identificar a la familia y guardar la biblioteca en Drive.</p>
        </section>
      </main>
    );
  }

  return (
    <>
      <Nav />
      <main className="shell">
        <section className="welcome">
          <p className="eyebrow">HOLA, {session.user.name?.toUpperCase() || "FAMILIA"}</p>
          <h1>¿Qué historia guardamos hoy?</h1>
        </section>
        <section className="cardGrid">
          <Link href="/new" className="card actionCard">
            <span className="cardIcon">✦</span>
            <h2>Crear un cuento</h2>
            <p>Histórico o personal, con defaults inteligentes según la edad.</p>
          </Link>
          <Link href="/library" className="card actionCard">
            <span className="cardIcon">▤</span>
            <h2>Biblioteca</h2>
            <p>Todos los cuentos guardados en vuestro Google Drive.</p>
          </Link>
          <Link href="/family" className="card actionCard">
            <span className="cardIcon">◎</span>
            <h2>Ficha familiar</h2>
            <p>Quién es quién, gustos, rasgos y recuerdos que la app puede reutilizar.</p>
          </Link>
        </section>
      </main>
    </>
  );
}
