export const SECTIONS = [
  '## Data',
  '## Rules',
  '## Screens',
  '## Window',
  '## Announcements',
  '## Night checklist',
];

// A card's lines, without the \r a Windows editor may leave.
function cardLines(card) {
  return card.split('\n').map((line) => line.replace(/\r$/, ''));
}

// A section exists only when one whole line is its heading (so `## Windows` or `### Window notes` do not count).
function hasSection(card, heading) {
  return cardLines(card).some((line) => line.trimEnd() === heading);
}

// The lines between a section's heading and the next line that starts with `## `.
function sectionLines(card, heading) {
  const lines = cardLines(card);
  const start = lines.findIndex((line) => line.trimEnd() === heading);
  if (start === -1) return [];
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => line.startsWith('## '));
  return end === -1 ? rest : rest.slice(0, end);
}

// The name in backticks at the start of each list item: `- \`name\`: ...`.
function listedNames(card, heading) {
  return sectionLines(card, heading)
    .map((line) => line.match(/^- `([^`]+)`/))
    .filter(Boolean)
    .map((match) => match[1]);
}

export function checkModuleCards({ modules = [], routes = [], announcements = [] } = {}) {
  const problems = [];
  const cards = new Map(modules.map((m) => [m.name, m.card]));

  for (const { name, card } of modules) {
    if (card === null) {
      problems.push(`module ${name} has no MODULE.md`);
      continue;
    }
    for (const section of SECTIONS) {
      if (!hasSection(card, section)) {
        problems.push(`MODULE.md of ${name} is missing the section ${section}`);
      }
    }
    const doors = new Set(routes.filter((r) => r.module === name).map((r) => r.operationId));
    for (const listed of listedNames(card, '## Window')) {
      if (!doors.has(listed)) {
        problems.push(
          `${listed} is listed under Window in ${name}/MODULE.md but is not one of its doors`,
        );
      }
    }
    const posted = new Set(announcements.filter((a) => a.module === name).map((a) => a.name));
    for (const listed of listedNames(card, '## Announcements')) {
      if (!posted.has(listed)) {
        problems.push(
          `${listed} is listed under Announcements in ${name}/MODULE.md but is not one of its announcements`,
        );
      }
    }
  }

  for (const r of routes) {
    if (!cards.has(r.module)) {
      problems.push(`${r.operationId} belongs to module ${r.module}, which has no folder`);
      continue;
    }
    const card = cards.get(r.module);
    if (card === null) continue;
    if (!listedNames(card, '## Window').includes(r.operationId)) {
      problems.push(`${r.operationId} is not listed under Window in ${r.module}/MODULE.md`);
    }
  }

  for (const a of announcements) {
    if (!cards.has(a.module)) {
      problems.push(`${a.name} belongs to module ${a.module}, which has no folder`);
      continue;
    }
    const card = cards.get(a.module);
    if (card === null) continue;
    if (!listedNames(card, '## Announcements').includes(a.name)) {
      problems.push(`${a.name} is not listed under Announcements in ${a.module}/MODULE.md`);
    }
  }

  return problems.sort();
}
