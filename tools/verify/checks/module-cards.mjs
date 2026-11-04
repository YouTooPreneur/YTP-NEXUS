export const SECTIONS = [
  '## Data',
  '## Rules',
  '## Screens',
  '## Window',
  '## Announcements',
  '## Night checklist',
];

function getSectionContent(card, sectionHeading) {
  const idx = card.indexOf(sectionHeading);
  if (idx === -1) return '';
  const start = idx + sectionHeading.length;
  const rest = card.slice(start);
  const nextHeadingMatch = rest.match(/\r?\n##\s/);
  if (nextHeadingMatch) {
    return rest.slice(0, nextHeadingMatch.index);
  }
  return rest;
}

export function checkModuleCards({ modules = [], routes = [], announcements = [] } = {}) {
  const problems = [];
  const moduleMap = new Map();

  for (const m of modules) {
    moduleMap.set(m.name, m.card);
    if (m.card === null) {
      problems.push(`module ${m.name} has no MODULE.md`);
    } else {
      for (const section of SECTIONS) {
        if (!m.card.includes(section)) {
          problems.push(`MODULE.md of ${m.name} is missing the section ${section}`);
        }
      }
    }
  }

  for (const r of routes) {
    if (!moduleMap.has(r.module)) {
      problems.push(`${r.operationId} belongs to module ${r.module}, which has no folder`);
      continue;
    }
    const card = moduleMap.get(r.module);
    if (card === null) {
      continue;
    }
    const windowContent = getSectionContent(card, '## Window');
    if (!windowContent.includes(`\`${r.operationId}\``)) {
      problems.push(`${r.operationId} is not listed under Window in ${r.module}/MODULE.md`);
    }
  }

  for (const a of announcements) {
    if (!moduleMap.has(a.module)) {
      problems.push(`${a.name} belongs to module ${a.module}, which has no folder`);
      continue;
    }
    const card = moduleMap.get(a.module);
    if (card === null) {
      continue;
    }
    const announcementsContent = getSectionContent(card, '## Announcements');
    if (!announcementsContent.includes(`\`${a.name}\``)) {
      problems.push(`${a.name} is not listed under Announcements in ${a.module}/MODULE.md`);
    }
  }

  return problems.sort();
}
