import Link from "next/link";
import { signOut } from "@/auth";

export function Nav() {
  return (
    <header className="topbar">
      <Link href="/" className="brand">Octavio Stories</Link>
      <nav>
        <Link href="/new">Nuevo cuento</Link>
        <Link href="/library">Biblioteca</Link>
        <Link href="/family">Familia</Link>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button className="linkButton" type="submit">Salir</button>
        </form>
      </nav>
    </header>
  );
}
