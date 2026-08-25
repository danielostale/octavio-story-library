import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Nav } from "@/components/nav";
import { StoryBuilder } from "@/components/story-builder";
import { recommendedDurationMinutes } from "@/lib/age";

export default async function NewStoryPage() {
  const session = await auth();
  if (!session?.user) redirect("/");
  const birthDate = process.env.CHILD_BIRTH_DATE || "";
  const recommended = birthDate ? recommendedDurationMinutes(birthDate) : 10;

  return (
    <>
      <Nav />
      <main className="shell narrow">
        <p className="eyebrow">NUEVO CUENTO</p>
        <h1>Cuéntame qué quieres contar.</h1>
        <StoryBuilder recommendedDuration={recommended} />
      </main>
    </>
  );
}
