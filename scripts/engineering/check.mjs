import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { lstatSync, readFileSync } from "node:fs";
import path from "node:path";
import { isBuiltin } from "node:module";
import { pathToFileURL } from "node:url";
import prettier from "prettier";
import ts from "typescript";

const composition = "src/modules/composition.ts";

const envModule = "src/infrastructure/config/env.ts";

const targetLoader = "src/infrastructure/config/portfolio-database.ts";

const errors = new Map([
  [
    "src/infrastructure/google-calendar/types.ts",
    new Set(["CalendarAvailabilityError", "CalendarEventError"]),
  ],
  ["src/modules/meeting/types.ts", new Set(["MeetingBookingError"])],
]);

const vendor = /^(openai|googleapis|resend|pg|@supabase\/supabase-js|@prisma\/adapter-pg)(\/|$)/;

const sourceExtension = /\.(?:[cm]?[jt]s|jsx|tsx)$/;

const formatExtension = /\.(?:[cm]?[jt]s|jsx|tsx|json|md|mdx|css|scss|ya?ml)$/;

const secretPart =
  /(^\.env|secret|credential|(?:^|[-_.])(?:tokens?|cookies?)(?:[-_.]|$)|private[-_.]?key|^\.aws$|^\.ssh$|\.(?:pem|key|p12|pfx)$)/i;

export function safeCandidate(file) {
  const parts = file.split("/");

  if (parts.some((part) => secretPart.test(part) || part === "..") || path.isAbsolute(file)) {
    return false;
  }

  if (/^(?:node_modules|\.next|dist|coverage|src\/generated)(?:\/|$)/.test(file)) {
    return false;
  }

  return (
    formatExtension.test(file) &&
    (parts.length === 1 ||
      /^(src|tests|scripts|docs|prisma|\.github)\//.test(file) ||
      file === ".agents/skills/nextjs-architecture/SKILL.md")
  );
}

export function candidates(root) {
  const names = execFileSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
    { cwd: root, encoding: "utf8" },
  );

  return [
    ...new Set(
      names.split("\0").filter((name) => name && safeCandidate(name) && worktreeExists(root, name)),
    ),
  ].sort();
}

export function worktreeExists(root, file) {
  let current = root;

  try {
    for (const part of file.split("/")) {
      current = path.join(current, part);
      if (lstatSync(current).isSymbolicLink()) {
        return true; // Preserve it as a candidate so safeRead fails before following it.
      }
    }

    return true;
  } catch (error) {
    if (error.code === "ENOENT") {
      return false;
    }

    throw error;
  }
}

function safeRead(root, file) {
  if (!safeCandidate(file)) {
    throw new Error(`SCAN: unsafe or unsupported path: ${file}`);
  }

  let current = root;

  for (const part of file.split("/")) {
    current = path.join(current, part);
    if (lstatSync(current).isSymbolicLink()) {
      throw new Error(`SCAN: symlink is not an inspected source file: ${file}`);
    }
  }

  return readFileSync(current, "utf8");
}

function owner(node) {
  let variable;

  for (let current = node; current; current = current.parent) {
    if ((ts.isFunctionDeclaration(current) || ts.isMethodDeclaration(current)) && current.name) {
      return current.name.getText();
    }

    if (!variable && ts.isVariableDeclaration(current) && current.name) {
      variable = current.name.getText();
    }
  }

  return variable ?? "<module>";
}

function property(node) {
  if (ts.isPropertyAccessExpression(node)) {
    return node.name.text;
  }

  if (ts.isElementAccessExpression(node) && ts.isStringLiteralLike(node.argumentExpression)) {
    return node.argumentExpression.text;
  }

  return null;
}

function isProcessEnv(node, processNames) {
  return (
    property(node) === "env" &&
    ((ts.isIdentifier(node.expression) && processNames.has(node.expression.text)) ||
      (property(node.expression) === "process" &&
        node.expression.expression?.getText() === "globalThis"))
  );
}

function resolveLocal(from, specifier, files) {
  if (
    specifier.startsWith("#") ||
    path.posix.isAbsolute(specifier) ||
    /^(file|data|https?):/.test(specifier)
  ) {
    throw new Error(`SCAN: unsupported import resolution in ${from}: ${specifier}`);
  }

  if (!specifier.startsWith("@/") && !specifier.startsWith(".")) {
    return null;
  }

  const base = specifier.startsWith("@/")
    ? `src/${specifier.slice(2)}`
    : path.posix.normalize(path.posix.join(path.posix.dirname(from), specifier));

  const choices = [
    base,
    ...[
      ".ts",
      ".tsx",
      ".mts",
      ".cts",
      ".js",
      ".mjs",
      ".cjs",
      "/index.ts",
      "/index.tsx",
      "/index.mts",
      "/index.cts",
      "/index.js",
    ].map((suffix) => base + suffix),
  ];

  if (/\.[cm]js$/.test(base)) {
    choices.push(base.replace(/js$/, "ts"));
  }

  if (/\.[cm]?js$/.test(base)) {
    choices.push(base.replace(/\.[cm]?js$/, ".ts"), base.replace(/\.[cm]?js$/, ".tsx"));
  }

  const match = choices.find((candidate) => files.has(candidate));

  if (match) {
    return match;
  }

  // Generated Prisma and non-code assets are terminal graph nodes, not source exemptions.
  if (base.startsWith("src/generated/") || /\.(css|scss|svg|png|jpe?g|webp|woff2?)$/.test(base)) {
    return base;
  }

  throw new Error(`SCAN: unresolved local import in ${from}: ${specifier}`);
}

function sourceComments(sf) {
  // Leaf tokens include JSX/template raw text. Only the gaps can contain real trivia.
  const tokens = [];

  const collect = (node) => {
    const children = node.getChildren(sf);

    if (children.length) {
      children.forEach(collect);
    } else if (node.kind !== ts.SyntaxKind.EndOfFileToken) {
      tokens.push({ start: ts.isJsxText(node) ? node.pos : node.getStart(sf), end: node.end });
    }
  };

  collect(sf);
  tokens.sort((a, b) => a.start - b.start);
  const comments = [];

  let cursor = 0;

  for (const token of [...tokens, { start: sf.end, end: sf.end }]) {
    if (token.start > cursor) {
      const scanner = ts.createScanner(
        ts.ScriptTarget.Latest,
        false,
        ts.LanguageVariant.Standard,
        sf.text.slice(cursor, token.start),
      );

      for (
        let kind = scanner.scan();
        kind !== ts.SyntaxKind.EndOfFileToken;
        kind = scanner.scan()
      ) {
        if (
          [ts.SyntaxKind.SingleLineCommentTrivia, ts.SyntaxKind.MultiLineCommentTrivia].includes(
            kind,
          )
        ) {
          comments.push({ pos: cursor + scanner.getTokenPos(), text: scanner.getTokenText() });
        }
      }
    }

    cursor = Math.max(cursor, token.end);
  }

  return comments;
}

function moduleImplementation(target) {
  if (!target.startsWith("src/modules/")) {
    return false;
  }

  const ownedPath = target.split("/").slice(3).join("/");

  return (
    /(?:^|\/)(?:repositories|services|providers|factories|repository|service|runner|factory)\//.test(
      ownedPath,
    ) ||
    /(?:^|\/)(?:[^/]+\.)?(?:repository|service|runner|composition|factory)\.[cm]?[jt]sx?$/.test(
      ownedPath,
    )
  );
}

export function scanSource(files) {
  const findings = [];

  const parsed = new Map();

  const edges = [];

  const add = (rule, file, node, details, hint) => {
    const sf = parsed.get(file);

    findings.push({
      rule,
      file,
      ...details,
      line: sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1,
      hint,
    });
  };

  for (const [file, content] of files) {
    const sf = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true);

    if (sf.parseDiagnostics.length) {
      throw new Error(`SCAN: parse failed in ${file}`);
    }

    parsed.set(file, sf);
    if (
      !/^src\/(app|modules|infrastructure|entrypoints|contracts)\//.test(file) &&
      file !== "src/proxy.ts"
    ) {
      add(
        "ARC-002",
        file,
        sf,
        { kind: "source-root" },
        "Use an accepted production owner; do not introduce a parallel source root.",
      );
    }

    for (const comment of sourceComments(sf)) {
      if (
        /^\/[/*]+\s*(?:eslint-disable(?:-next-line|-line)?|@ts-(?:ignore|expect-error|nocheck)|prettier-ignore)(?:\s|$|\*\/)/.test(
          comment.text,
        )
      ) {
        add(
          "STD-024",
          file,
          { getStart: () => comment.pos },
          { kind: "suppression", offset: comment.pos },
          "No suppression approval is registered; use the scoped exception/ADR review process.",
        );
      }
    }
  }

  for (const [file, sf] of parsed) {
    const processNames = new Set(["process"]);

    for (const statement of sf.statements) {
      if (
        ts.isImportDeclaration(statement) &&
        ["process", "node:process"].includes(statement.moduleSpecifier.text)
      ) {
        const clause = statement.importClause;

        if (clause?.name) {
          processNames.add(clause.name.text);
        }

        if (clause?.namedBindings && ts.isNamespaceImport(clause.namedBindings)) {
          processNames.add(clause.namedBindings.name.text);
        }
      }
    }

    const edge = (node, specifier, imported, local, typeOnly, syntax) => {
      const target = resolveLocal(file, specifier, files) ?? specifier;

      edges.push({ file, target, imported, local, typeOnly, syntax, node });
    };

    const visit = (node) => {
      if (ts.isImportDeclaration(node)) {
        const clause = node.importClause;

        if (!clause) {
          edge(node, node.moduleSpecifier.text, "<side-effect>", "<side-effect>", false, "import");
        } else {
          if (clause.name) {
            edge(
              node,
              node.moduleSpecifier.text,
              "default",
              clause.name.text,
              clause.isTypeOnly,
              "import",
            );
          }

          const bindings = clause.namedBindings;

          if (bindings && ts.isNamespaceImport(bindings)) {
            edge(
              node,
              node.moduleSpecifier.text,
              "*",
              bindings.name.text,
              clause.isTypeOnly,
              "import",
            );
          } else if (bindings) {
            if (bindings.elements.length === 0) {
              edge(
                node,
                node.moduleSpecifier.text,
                "<side-effect>",
                "<side-effect>",
                clause.isTypeOnly,
                "import",
              );
            }

            for (const binding of bindings.elements) {
              edge(
                node,
                node.moduleSpecifier.text,
                binding.propertyName?.text ?? binding.name.text,
                binding.name.text,
                clause.isTypeOnly || binding.isTypeOnly,
                "import",
              );
            }
          }
        }
      } else if (ts.isExportDeclaration(node) && node.moduleSpecifier) {
        if (node.exportClause && ts.isNamedExports(node.exportClause)) {
          if (node.exportClause.elements.length === 0) {
            edge(
              node,
              node.moduleSpecifier.text,
              "<side-effect>",
              "<side-effect>",
              node.isTypeOnly,
              "export",
            );
          }

          for (const binding of node.exportClause.elements) {
            edge(
              node,
              node.moduleSpecifier.text,
              binding.propertyName?.text ?? binding.name.text,
              binding.name.text,
              node.isTypeOnly || binding.isTypeOnly,
              "export",
            );
          }
        } else {
          edge(
            node,
            node.moduleSpecifier.text,
            "*",
            node.exportClause?.name?.text ?? "*",
            node.isTypeOnly,
            "export",
          );
        }
      } else if (
        ts.isImportTypeNode(node) &&
        ts.isLiteralTypeNode(node.argument) &&
        ts.isStringLiteralLike(node.argument.literal)
      ) {
        edge(node, node.argument.literal.text, "*", "<type-query>", true, "type-query");
      } else if (ts.isImportEqualsDeclaration(node)) {
        throw new Error(`SCAN: unsupported import-equals declaration in ${file}`);
      } else if (
        ts.isCallExpression(node) &&
        (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
          node.expression.getText(sf) === "require")
      ) {
        if (node.arguments.length !== 1 || !ts.isStringLiteralLike(node.arguments[0])) {
          throw new Error(`SCAN: computed import/require is unsupported in ${file}`);
        }

        edge(node, node.arguments[0].text, "*", "<dynamic>", false, "dynamic");
      }

      if (isProcessEnv(node, processNames) && file !== envModule) {
        const parent = node.parent;

        const direct =
          (ts.isPropertyAccessExpression(parent) || ts.isElementAccessExpression(parent)) &&
          parent.expression === node;

        const name = direct ? (property(parent) ?? "<computed>") : "<object>";

        const targetLoading =
          file === targetLoader &&
          !direct &&
          ts.isCallExpression(parent) &&
          parent.expression.getText(sf) === "verifyPortfolioTarget";

        // A spread forwards inherited process context; it is not a configuration lookup.
        // Only the inspected child_process spawn options shape qualifies, not arbitrary object spread.
        const options = parent.parent?.parent;

        const spawnCall = options?.parent?.parent;

        const passthrough =
          !direct &&
          ts.isSpreadAssignment(parent) &&
          ts.isPropertyAssignment(options) &&
          options.name.getText(sf) === "env" &&
          ts.isCallExpression(spawnCall) &&
          ["spawn", "spawnSync", "execFile", "execFileSync"].includes(
            spawnCall.expression.getText(sf),
          ) &&
          sf.statements.some(
            (s) =>
              ts.isImportDeclaration(s) &&
              ["node:child_process", "child_process"].includes(s.moduleSpecifier.text) &&
              s.importClause?.namedBindings?.elements?.some(
                (b) => b.name.text === spawnCall.expression.getText(sf),
              ),
          );

        if (!targetLoading && !passthrough) {
          add(
            "ARC-009",
            file,
            node,
            { kind: "env", owner: owner(node), name },
            "Use central environment configuration; preserve verified subprocess target handling.",
          );
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(sf);
  }

  const runtime = (file) => edges.filter((edge) => edge.file === file && !edge.typeOnly);

  const inert = (file, seen = new Set()) => {
    if (seen.has(file)) {
      return true;
    }

    seen.add(file);
    const sf = parsed.get(file);

    if (!sf) {
      return false;
    }

    for (const edge of runtime(file)) {
      if (!errors.get(edge.target)?.has(edge.imported) || !inert(edge.target, seen)) {
        return false;
      }
    }

    return sf.statements.every((statement) => {
      if (
        ts.isInterfaceDeclaration(statement) ||
        ts.isTypeAliasDeclaration(statement) ||
        ts.isImportDeclaration(statement) ||
        ts.isExportDeclaration(statement)
      ) {
        return true;
      }

      if (
        !ts.isClassDeclaration(statement) ||
        !errors.get(file)?.has(statement.name?.text) ||
        statement.heritageClauses?.length !== 1 ||
        statement.heritageClauses[0].token !== ts.SyntaxKind.ExtendsKeyword ||
        statement.heritageClauses[0].types.length !== 1 ||
        statement.heritageClauses[0].types[0].expression.getText(sf) !== "Error"
      ) {
        return false;
      }

      if (statement.modifiers?.some((m) => m.kind !== ts.SyntaxKind.ExportKeyword)) {
        return false;
      }

      if (
        statement.members.length !== 1 ||
        !statement.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
      ) {
        return false;
      }

      return statement.members.every((member) => {
        if (
          !ts.isConstructorDeclaration(member) ||
          member.modifiers?.length ||
          member.body?.statements.length !== 1
        ) {
          return false;
        }

        const parameters = new Set(member.parameters.map((p) => p.name.getText(sf)));

        const safeValue = (value) =>
          ts.isStringLiteralLike(value) ||
          ts.isNumericLiteral(value) ||
          [
            ts.SyntaxKind.TrueKeyword,
            ts.SyntaxKind.FalseKeyword,
            ts.SyntaxKind.NullKeyword,
          ].includes(value.kind) ||
          (ts.isIdentifier(value) && parameters.has(value.text)) ||
          (ts.isObjectLiteralExpression(value) &&
            value.properties.every(
              (p) =>
                (ts.isShorthandPropertyAssignment(p) && parameters.has(p.name.text)) ||
                (ts.isPropertyAssignment(p) &&
                  !ts.isComputedPropertyName(p.name) &&
                  safeValue(p.initializer)),
            ));

        const boundedCode = (type) =>
          type &&
          (ts.isUnionTypeNode(type) ? type.types : [type]).every(
            (t) => ts.isLiteralTypeNode(t) && ts.isStringLiteral(t.literal),
          );

        const validParameters = member.parameters.every(
          (p) =>
            ts.isIdentifier(p.name) &&
            (!p.initializer || safeValue(p.initializer)) &&
            (!p.modifiers?.length ||
              (p.modifiers.every((m) => m.kind === ts.SyntaxKind.ReadonlyKeyword) &&
                boundedCode(p.type))),
        );

        const expression = member.body.statements[0];

        return (
          validParameters &&
          member.parameters.some((p) =>
            p.modifiers?.some((m) => m.kind === ts.SyntaxKind.ReadonlyKeyword),
          ) &&
          ts.isExpressionStatement(expression) &&
          ts.isCallExpression(expression.expression) &&
          expression.expression.expression.kind === ts.SyntaxKind.SuperKeyword &&
          expression.expression.arguments.every(safeValue)
        );
      });
    });
  };

  const permittedError = (edge) =>
    errors.get(edge.target)?.has(edge.imported) && inert(edge.target);

  const capability = (file) =>
    file.startsWith("src/modules/") && file !== composition ? file.split("/")[2] : null;

  for (const edge of edges) {
    const { file, target, typeOnly } = edge;

    let rule;

    if (
      (capability(file) && (target.startsWith("src/app/") || target === composition)) ||
      (file.startsWith("src/infrastructure/") &&
        (target.startsWith("src/app/") || (!typeOnly && target.startsWith("src/modules/")))) ||
      (target === composition && !/^(src\/app|src\/entrypoints)\//.test(file))
    ) {
      rule = "ARC-003";
    } else if (
      !typeOnly &&
      capability(file) &&
      (target.startsWith("src/infrastructure/") || vendor.test(target)) &&
      !permittedError(edge)
    ) {
      rule = "ARC-006";
    } else if (
      !typeOnly &&
      capability(file) &&
      capability(target) &&
      capability(file) !== capability(target) &&
      !permittedError(edge)
    ) {
      rule = "ARC-007";
    } else if (
      !typeOnly &&
      /^(src\/app|src\/entrypoints)\//.test(file) &&
      (vendor.test(target) ||
        target.startsWith("src/generated/") ||
        /^src\/infrastructure\/(?:database\/prisma|[^/]+\/clients?)(?:\.|\/)/.test(target) ||
        moduleImplementation(target))
    ) {
      rule = "ARC-002";
    }

    if (rule) {
      add(
        rule,
        file,
        edge.node,
        {
          kind: "import",
          target,
          imported: edge.imported,
          local: edge.local,
          typeOnly,
          syntax: edge.syntax,
        },
        "Use the owning public type/injected operation or composition; no private client/helper imports.",
      );
    }

    if (
      !typeOnly &&
      ["node:process", "process"].includes(target) &&
      edge.imported === "env" &&
      file !== envModule
    ) {
      add(
        "ARC-009",
        file,
        edge.node,
        { kind: "env-import", target, imported: edge.imported, local: edge.local },
        "Read runtime configuration through the central environment module.",
      );
    }

    if (!typeOnly && /^dotenv(?:\/|$)/.test(target) && file !== targetLoader) {
      const callOwners = [];

      const inspectCalls = (node) => {
        if (
          ts.isCallExpression(node) &&
          (node.expression.getText() === edge.local ||
            (property(node.expression) === "config" &&
              node.expression.expression?.getText() === edge.local))
        ) {
          callOwners.push(owner(node));
        }

        ts.forEachChild(node, inspectCalls);
      };

      inspectCalls(parsed.get(file));
      add(
        "ARC-009",
        file,
        edge.node,
        {
          kind: "dotenv",
          callOwners,
          target,
          imported: edge.imported,
          local: edge.local,
          typeOnly,
          syntax: edge.syntax,
        },
        "Use infrastructure-owned target loading; do not load configuration in an adapter.",
      );
    }
  }

  const clients = [...parsed]
    .filter(([, sf]) =>
      sf.statements.some(
        (s) =>
          ts.isExpressionStatement(s) &&
          ts.isStringLiteral(s.expression) &&
          s.expression.text === "use client",
      ),
    )
    .map(([file]) => file);

  for (const client of clients) {
    const visited = new Set();

    const traverse = (file) => {
      if (visited.has(file)) {
        return;
      }

      visited.add(file);
      for (const edge of edges.filter((e) => e.file === file)) {
        if (
          /^src\/(modules|infrastructure|generated)\//.test(edge.target) ||
          /^(server-only|@prisma\/client)(\/|$)/.test(edge.target) ||
          vendor.test(edge.target) ||
          isBuiltin(edge.target)
        ) {
          add(
            "ARC-004",
            edge.file,
            edge.node,
            {
              kind: "browser",
              client,
              target: edge.target,
              imported: edge.imported,
              local: edge.local,
              typeOnly: edge.typeOnly,
              syntax: edge.syntax,
            },
            "Keep server dependencies out of the client graph, including transitive local helpers.",
          );
        } else if (!edge.typeOnly && parsed.has(edge.target)) {
          traverse(edge.target);
        }
      }
    };

    traverse(client);
  }

  return findings;
}

export function compareBaseline(findings, entries) {
  const key = ({ line, hint, id, count, ...entry }) =>
    JSON.stringify(
      Object.fromEntries(Object.entries(entry).sort(([a], [b]) => a.localeCompare(b))),
    );

  const observed = new Map();

  for (const finding of findings) {
    const k = key(finding);

    observed.set(k, (observed.get(k) ?? 0) + 1);
  }

  const expected = new Map();

  for (const entry of entries) {
    if (entry.count !== 1 || expected.has(key(entry))) {
      throw new Error("BASELINE: entries must be unique exact single occurrences");
    }

    expected.set(key(entry), entry);
  }

  const failures = findings.filter(
    (finding) => (observed.get(key(finding)) ?? 0) !== (expected.get(key(finding))?.count ?? 0),
  );

  for (const [k, entry] of expected) {
    if (!observed.has(k)) {
      failures.push({
        ...entry,
        hint: `STALE BASELINE ${entry.id}: remove only after reviewing the resolved finding; never regenerate.`,
      });
    }
  }

  return failures;
}

export async function scanFormat(root, names, baseline) {
  const config = JSON.parse(safeRead(root, ".prettierrc.json"));

  const findings = [];

  for (const file of names) {
    const content = safeRead(root, file);

    let formatted;

    try {
      formatted = await prettier.check(content, { ...config, filepath: file });
    } catch {
      throw new Error(`SCAN: formatter parse failed in ${file}`);
    }

    if (!formatted) {
      findings.push({
        rule: "STD-004",
        file,
        sha256: createHash("sha256").update(content).digest("hex"),
        hint: "Format this exact file; changed legacy content must satisfy Prettier.",
      });
    }
  }

  return { findings, failures: compareBaseline(findings, baseline) };
}

export function printResult(failures, count, label) {
  for (const finding of failures) {
    console.error(
      `${finding.rule} ${finding.file}${finding.line ? `:${finding.line}` : ""}: ${finding.imported ?? finding.name ?? finding.sha256 ?? ""} ${finding.hint}`,
    );
  }

  console.log(
    `${label}: ${failures.length ? "FAIL" : "PASS (non-regression only)"}; ${count} observed findings, ${failures.length} new/increased/stale findings.`,
  );

  return failures.length ? 1 : 0;
}

export async function main(args = process.argv.slice(2), root = process.cwd()) {
  if (args.length !== 1 || !["source", "format"].includes(args[0])) {
    throw new Error("SCAN: use exactly one supported mode: source or format");
  }

  const baseline = JSON.parse(safeRead(root, "scripts/engineering/baseline.json"));

  const names = candidates(root);

  if (args[0] === "source") {
    const configuration = JSON.parse(safeRead(root, "tsconfig.json")).compilerOptions;

    if (
      JSON.stringify(configuration?.paths) !== JSON.stringify({ "@/*": ["./src/*"] }) ||
      configuration?.baseUrl
    ) {
      throw new Error(
        "SCAN: unsupported TypeScript alias/baseUrl configuration; update resolution coverage before verifying",
      );
    }

    const source = names.filter((name) => name.startsWith("src/") && sourceExtension.test(name));

    if (!source.length) {
      throw new Error("SCAN: no authored source files found");
    }

    const findings = scanSource(new Map(source.map((file) => [file, safeRead(root, file)])));

    console.log(
      `Parsed ${source.length} authored source files; generated/vendor files are terminal or external, not inspected.`,
    );

    return printResult(compareBaseline(findings, baseline.source), findings.length, "Architecture");
  }

  const { findings, failures } = await scanFormat(root, names, baseline.format);

  console.log(`Checked ${names.length} safe tracked/untracked authored formatter candidates.`);

  return printResult(failures, findings.length, "Formatting");
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main()
    .then((code) => {
      process.exitCode = code;
    })
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 2;
    });
}
