const LEGACY_LABEL = /^(?:[-•*]|\d+\.)?\s*\*\*([^*:]+):\*\*\s*/;
const BOLD_HEADING = /^\*\*[^*]+\*\*$/;

function stripMarkdown(text) {
  return text.replace(/\*+/g, '').trim();
}

export function parseAnalysis(text) {
  const result = { basic: '', contextual: null, usages: [] };
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
  let heading = null;

for (const [index, line] of lines.entries()) {
  if (index === 0 && BOLD_HEADING.test(line)){
    heading = stripMarkdown(line);
    continue;
  }
    const labeled = line.match(LEGACY_LABEL);
    if (labeled) {
      const label = labeled[1].trim();
      const rest = stripMarkdown(line.slice(labeled[0].length));
if ((/anlam|meaning/i.test(label) || index === 0) && !result.basic) {
        result.basic = rest;
      } else {
        result.usages.push({ term: label, meaning: rest });
      }
      continue;
    }

    if (line.startsWith('→')) {
      result.contextual = stripMarkdown(line.slice(1));
    } else if (/^[-•*]\s/.test(line)) {
      const content = line.slice(2);
      const colon = content.indexOf(':');
      if (colon > 0) {
        result.usages.push({
          term: content.slice(0, colon).trim(),
          meaning: content.slice(colon + 1).trim()
        });
      } else {
        result.usages.push({ term: null, meaning: content.trim() });
      }
    } else {
      const clean = stripMarkdown(line);
      result.basic = result.basic ? result.basic + ' ' + clean : clean;
    }
  }
  if (!result.basic && heading) result.basic = heading;
  return result;
}

export function shortMeaning(parsed) {
  const full = parsed.contextual ?? parsed.basic;
  const short = full.replace(/\s*\([^]*\)/g, '').trim();
  return firstSentence(short || full);
}

function firstSentence(text) {
    const match = text.match(/^.*?[.!?;](\s|$)/);
    return match ? match[0].replace(/[.;]\s*$/, '').trim() : text;
}