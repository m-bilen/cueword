const LEGACY_LABEL = /^[-•*]?\s*\*\*([^*:]+):\*\*\s*/;

function stripMarkdown(text) {
  return text.replace(/\*+/g, '').trim();
}

export function parseAnalysis(text) {
  const result = { basic: '', contextual: null, usages: [] };
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);

for (const [index, line] of lines.entries()) {
    const labeled = line.match(LEGACY_LABEL);
    if (labeled) {
      const label = labeled[1].trim();
      const rest = stripMarkdown(line.slice(labeled[0].length));
if ((/anlam/i.test(label) || index === 0) && !result.basic) {
        result.basic = rest;
      } else {
        result.usages.push({ term: label, meaning: rest });
      }
      continue;
    }

    if (line.startsWith('→')) {
      result.contextual = line.slice(1).trim();
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
      result.basic = result.basic ? result.basic + ' ' + line : line;
    }
  }
  return result;
}

export function shortMeaning(parsed) {
  return firstSentence(parsed.contextual ?? parsed.basic);
}

function firstSentence(text) {
    const match = text.match(/^.*?[.!?;](\s|$)/);
    return match ? match[0].replace(/;\s*$/, '').trim() : text;
}