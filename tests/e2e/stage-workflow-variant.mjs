import { constants } from "node:fs";
import { execFileSync } from "node:child_process";
import { copyFile, cp, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

const [, , location, variant] = process.argv;

const target = resolve(location ?? "");

if (
  !location ||
  (!target.startsWith("/private/tmp/") && !target.startsWith("/tmp/")) ||
  !["meeting", "empty", "services"].includes(variant)
) {
  throw new Error("Use a new disposable /tmp directory and a meeting, empty or services variant.");
}

await mkdir(target);
const paths = new Set(
  execFileSync("git", ["ls-files", "-z", "-co", "--exclude-standard"]).toString().split("\0"),
);

for (const path of paths) {
  if (
    !path ||
    path.startsWith("tests/") ||
    (path.startsWith(".") && path !== ".env.example") ||
    /(^|\/)\.env(?!\.example$)/.test(path)
  )
    {continue;}

  if (!(await stat(path).catch(() => null))?.isFile()) {continue;}

  const destination = join(target, path);

  await mkdir(dirname(destination), { recursive: true });
  await copyFile(path, destination);
}

await cp(resolve("node_modules"), join(target, "node_modules"), {
  recursive: true,
  verbatimSymlinks: true,
  mode: constants.COPYFILE_FICLONE,
});
const modules = join(target, "src/modules");

await copyFile("tests/e2e/fixtures/workflow-providers.ts", join(modules, "workflow-fixture.ts"));
const composition = join(modules, "composition.ts");

let source = await readFile(composition, "utf8");

source = source.replace(
  'import "server-only";',
  `import "server-only";
import { fixtureModel, fixturePortfolio${variant === "meeting" ? ", fixtureCalendar, fixtureAvailability, fixtureNotice" : ""} } from "./workflow-fixture";`,
);
source = source.replace(
  "  openAIProvider,\n  logger,\n  new PortfolioSearchService(new PrismaPortfolioSearchRepository(prisma), embeddings),",
  "  fixtureModel,\n  logger,\n  fixturePortfolio,",
);

if (variant === "meeting") {
  source = source
    .replace("new GoogleCalendarClient(getGoogleCalendarConfig)", "fixtureCalendar")
    .replace("new MeetingService(calendar, logger)", "fixtureAvailability")
    .replace(
      /new MeetingOwnerNotice\(resendClient, \(\) => \(\{[\s\S]+?\}\)\)/,
      'new MeetingOwnerNotice(fixtureNotice, () => ({ adminEmail: "owner@example.test", fromEmail: "sender@example.test" }))',
    );
  if (!source.includes("new MeetingOwnerNotice(fixtureNotice"))
    {throw new Error("Meeting notice wiring has changed.");}
} else {
  source = source.replace(
    /^import .* from "(?:\.\/meeting\/|\.\/workflow\/definitions\/meeting-booking\/|@\/infrastructure\/google-calendar\/).*";\n/gm,
    "",
  );
  const start = source.indexOf("const calendar =");

  const end = source.indexOf("export const workflowService", start);

  if (start < 0 || end < 0) {throw new Error("Workflow wiring has changed.");}

  if (variant === "services") {
    await copyFile(
      "tests/e2e/fixtures/request-services.ts",
      join(modules, "request-services-fixture.ts"),
    );
    source = source.replace(
      'import "server-only";',
      'import "server-only";\nimport { RequestServicesDefinition } from "./request-services-fixture";',
    );
  }

  const wiring = source.indexOf("const calendar =");

  const after = source.indexOf("export const workflowService", wiring);

  source =
    source.slice(0, wiring) +
    `const workflowRegistry = new WorkflowRegistry([${variant === "services" ? "new RequestServicesDefinition()" : ""}]);\n\n` +
    source.slice(after);
  for (const path of [
    "src/modules/workflow/definitions/meeting-booking",
    "src/modules/meeting",
    "src/infrastructure/google-calendar",
  ]) {
    await rm(join(target, path), { recursive: true });
  }
}

await writeFile(composition, source);
