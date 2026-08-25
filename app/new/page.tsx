import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Nav } from "@/components/nav";
import { StoryBuilder } from "@/components/story-builder";
import { recommendedDurationMinutes } from "@/lib/age";

export default async function NewStoryPage() {
  const oauthConfigured = Boolean(
    process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
  );
  const session = oauthConfigured ? await auth() : null;
  if (oauthConfigured && !session?.user) redirect("/");

  const birthDate = process.env.CHILD_BIRTH_DATE || "";
  const recommended = birthDate ? recommendedDurationMinutes(birthDate) : 10;

  return (
    <>
      <Nav />
      <main className="shell narrow">
        {!oauthConfigured && <p className="eyebrow">MODO DEMO · SIN GOOGLE DRIVE</p>}
        <p className="eyebrow">NUEVO CUENTO</p>
        <h1>Cuéntame qué quieres contar.</h1>
        <StoryBuilder recommendedDuration={recommended} />
      </main>
    </>
  );
}
