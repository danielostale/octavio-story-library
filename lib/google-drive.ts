import { google, drive_v3 } from "googleapis";
import { Readable } from "node:stream";
import type { FamilyProfile, LibraryEntry, Story } from "@/lib/types";

const FOLDER_MIME = "application/vnd.google-apps.folder";

function escapeDriveLiteral(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

export function driveClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.drive({ version: "v3", auth });
}

export async function ensureFolder(
  drive: drive_v3.Drive,
  name: string,
  parentId?: string,
) {
  const parentClause = parentId ? ` and '${escapeDriveLiteral(parentId)}' in parents` : "";
  const q = `name = '${escapeDriveLiteral(name)}' and mimeType = '${FOLDER_MIME}' and trashed = false${parentClause}`;
  const found = await drive.files.list({
    q,
    spaces: "drive",
    fields: "files(id,name)",
    pageSize: 10,
  });
  if (found.data.files?.[0]?.id) return found.data.files[0].id;

  const created = await drive.files.create({
    requestBody: {
      name,
      mimeType: FOLDER_MIME,
      ...(parentId ? { parents: [parentId] } : {}),
    },
    fields: "id",
  });
  if (!created.data.id) throw new Error(`Could not create Drive folder: ${name}`);
  return created.data.id;
}

export async function findFile(
  drive: drive_v3.Drive,
  name: string,
  parentId: string,
) {
  const q = `name = '${escapeDriveLiteral(name)}' and '${escapeDriveLiteral(parentId)}' in parents and trashed = false`;
  const found = await drive.files.list({
    q,
    spaces: "drive",
    fields: "files(id,name,mimeType,modifiedTime)",
    pageSize: 10,
  });
  return found.data.files?.[0] ?? null;
}

export async function writeTextFile(
  drive: drive_v3.Drive,
  parentId: string,
  name: string,
  content: string,
  mimeType = "text/plain",
) {
  const existing = await findFile(drive, name, parentId);
  if (existing?.id) {
    await drive.files.update({
      fileId: existing.id,
      media: { mimeType, body: Readable.from([content]) },
      fields: "id",
    });
    return existing.id;
  }

  const created = await drive.files.create({
    requestBody: { name, parents: [parentId] },
    media: { mimeType, body: Readable.from([content]) },
    fields: "id",
  });
  if (!created.data.id) throw new Error(`Could not create Drive file: ${name}`);
  return created.data.id;
}

export async function readTextFile(
  drive: drive_v3.Drive,
  fileId: string,
) {
  const response = await drive.files.get(
    { fileId, alt: "media" },
    { responseType: "text" },
  );
  return response.data as unknown as string;
}

export async function getRootFolder(drive: drive_v3.Drive) {
  return ensureFolder(
    drive,
    process.env.DRIVE_ROOT_FOLDER || "Octavio Story Library",
  );
}

export async function getFamilyProfile(drive: drive_v3.Drive) {
  const root = await getRootFolder(drive);
  const familyFolder = await ensureFolder(drive, "family", root);
  const file = await findFile(drive, "family.json", familyFolder);
  if (!file?.id) return null;
  try {
    return JSON.parse(await readTextFile(drive, file.id)) as FamilyProfile;
  } catch {
    return null;
  }
}

export async function saveFamilyProfile(
  drive: drive_v3.Drive,
  profile: FamilyProfile,
) {
  const root = await getRootFolder(drive);
  const familyFolder = await ensureFolder(drive, "family", root);
  const json = JSON.stringify(profile, null, 2);
  const markdown = familyToMarkdown(profile);
  await writeTextFile(drive, familyFolder, "family.json", json, "application/json");
  await writeTextFile(drive, familyFolder, "family.md", markdown, "text/markdown");
}

function familyToMarkdown(profile: FamilyProfile) {
  const members = profile.members
    .map(
      (m) => `## ${m.name}\n- Relación: ${m.relationship}\n- Rasgos: ${m.traits.join(", ") || "—"}\n- Le gusta: ${m.likes.join(", ") || "—"}\n- Notas: ${m.notes || "—"}`,
    )
    .join("\n\n");
  const memories = profile.memories
    .map((m) => `- **${m.title}**: ${m.detail}`)
    .join("\n");
  return `# Ficha familiar\n\nActualizada: ${profile.updatedAt}\n\n${members}\n\n# Recuerdos\n${memories || "—"}\n`;
}

function storyToMarkdown(story: Story) {
  return `# ${story.title}\n\n- Tipo: ${story.mode}\n- Idioma: ${story.language}\n- Edad objetivo: ${story.childAgeLabel}\n- Duración: ${story.durationMinutes} minutos\n- Creado: ${story.createdAt}\n\n${story.story}\n\n## Lo que hemos aprendido\n\n${story.reflection}\n\n## Escenas sugeridas para ilustrar\n\n${story.illustrationScenes
    .map((scene, i) => `${i + 1}. **${scene.title}** — ${scene.description}`)
    .join("\n")}\n`;
}

export async function loadLibraryIndex(drive: drive_v3.Drive) {
  const root = await getRootFolder(drive);
  const file = await findFile(drive, "library-index.json", root);
  if (!file?.id) return [] as LibraryEntry[];
  try {
    return JSON.parse(await readTextFile(drive, file.id)) as LibraryEntry[];
  } catch {
    return [] as LibraryEntry[];
  }
}

export async function saveStoryToDrive(drive: drive_v3.Drive, story: Story) {
  const root = await getRootFolder(drive);
  const stories = await ensureFolder(drive, "stories", root);
  const modeFolder = await ensureFolder(drive, story.mode, stories);
  const storyFolder = await ensureFolder(drive, `${story.id} - ${story.title}`, modeFolder);

  const jsonFileId = await writeTextFile(
    drive,
    storyFolder,
    "story.json",
    JSON.stringify(story, null, 2),
    "application/json",
  );
  const markdownFileId = await writeTextFile(
    drive,
    storyFolder,
    "story.md",
    storyToMarkdown(story),
    "text/markdown",
  );
  await ensureFolder(drive, "illustrations", storyFolder);
  await ensureFolder(drive, "exports", storyFolder);

  const entry: LibraryEntry = {
    id: story.id,
    title: story.title,
    mode: story.mode,
    language: story.language,
    durationMinutes: story.durationMinutes,
    createdAt: story.createdAt,
    folderId: storyFolder,
    jsonFileId,
    markdownFileId,
  };

  const index = await loadLibraryIndex(drive);
  const next = [entry, ...index.filter((item) => item.id !== story.id)];
  await writeTextFile(
    drive,
    root,
    "library-index.json",
    JSON.stringify(next, null, 2),
    "application/json",
  );

  return entry;
}


export async function saveIllustrationToDrive(
  drive: drive_v3.Drive,
  storyFolderId: string,
  filename: string,
  base64: string,
) {
  const illustrations = await ensureFolder(drive, "illustrations", storyFolderId);
  const bytes = Buffer.from(base64, "base64");
  const existing = await findFile(drive, filename, illustrations);
  if (existing?.id) {
    await drive.files.update({
      fileId: existing.id,
      media: { mimeType: "image/png", body: Readable.from([bytes]) },
      fields: "id",
    });
    return existing.id;
  }

  const created = await drive.files.create({
    requestBody: { name: filename, parents: [illustrations] },
    media: { mimeType: "image/png", body: Readable.from([bytes]) },
    fields: "id",
  });
  if (!created.data.id) throw new Error("Could not save illustration to Drive");
  return created.data.id;
}
