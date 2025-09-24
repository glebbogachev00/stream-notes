export const BOLD_DELIMITER = '**';

const LIST_ITEM_PATTERN = /^(\s*)(\*\*)?(\d+\.|[•\-*])\s+/;
const LIST_MARKER_REGEX = /^(?:\d+\.\s+|[•\-*]\s+)/;

const getMarkerForStyle = (style, index) => {
  switch (style) {
    case 'numbers':
      return `${index + 1}.`;
    case 'dashes':
      return '-';
    case 'plain':
      return '-';
    default:
      return '•';
  }
};

const lineHasListMarker = (line = '') => {
  if (!line.trim()) {
    return false;
  }
  return LIST_ITEM_PATTERN.test(line);
};

const stripListMarker = (line = '') => {
  if (!line.trim()) {
    return line;
  }

  let cleaned = line;
  let safety = 0;
  while (safety < 5 && LIST_ITEM_PATTERN.test(cleaned)) {
    cleaned = cleaned.replace(
      LIST_ITEM_PATTERN,
      (_, leading = '', boldPrefix = '') => `${leading}${boldPrefix}`
    );
    safety += 1;
  }

  if (cleaned.startsWith('*') && !cleaned.startsWith(BOLD_DELIMITER) && cleaned.includes(BOLD_DELIMITER)) {
    cleaned = `${BOLD_DELIMITER}${cleaned.slice(1)}`;
  }

  return cleaned;
};

const applyListMarkers = (lines, style) => {
  let itemIndex = 0;

  return lines.map((line) => {
    if (line.trim() === '') {
      return line;
    }

    const leadingWhitespaceMatch = line.match(/^\s*/);
    const leadingWhitespace = leadingWhitespaceMatch ? leadingWhitespaceMatch[0] : '';
    const trimmedContent = line.trim();
    const marker = getMarkerForStyle(style, itemIndex);
    itemIndex += 1;

    return `${leadingWhitespace}${marker} ${trimmedContent}`;
  });
};

const sanitizeContentForBold = (text = '') => text.replace(/\*\*/g, '');

const parseLineForBlockBold = (line = '') => {
  const original = line;

  if (line === '') {
    return {
      original,
      leading: '',
      marker: '',
      content: '',
      hasOuterBold: false
    };
  }

  let working = line;

  const leadingMatch = working.match(/^(\s*)/);
  const leading = leadingMatch ? leadingMatch[0] : '';
  working = working.slice(leading.length);

  let trailingWhitespace = '';
  const trailingMatch = working.match(/(\s*)$/);
  if (trailingMatch) {
    trailingWhitespace = trailingMatch[0];
    working = working.slice(0, working.length - trailingWhitespace.length);
  }

  let marker = '';

  const markerBeforeBold = working.match(LIST_MARKER_REGEX);
  if (markerBeforeBold) {
    marker = markerBeforeBold[0];
    working = working.slice(marker.length);
  }

  let hasOuterBold = false;

  if (working.startsWith(BOLD_DELIMITER) && working.endsWith(BOLD_DELIMITER) && working.length > BOLD_DELIMITER.length * 2) {
    hasOuterBold = true;
    working = working.slice(BOLD_DELIMITER.length, -BOLD_DELIMITER.length);
  } else if (working.startsWith(BOLD_DELIMITER) && working.length > BOLD_DELIMITER.length * 2) {
    const candidate = working.slice(BOLD_DELIMITER.length, -BOLD_DELIMITER.length);
    const markerInside = candidate.match(LIST_MARKER_REGEX);
    if (!marker && markerInside) {
      marker = markerInside[0];
      working = candidate.slice(marker.length);
      hasOuterBold = true;
    }
  }

  if (!marker) {
    const markerAfter = working.match(LIST_MARKER_REGEX);
    if (markerAfter) {
      marker = markerAfter[0];
      working = working.slice(marker.length);
    }
  }

  const content = working + trailingWhitespace;

  return {
    original,
    leading,
    marker,
    content,
    hasOuterBold
  };
};

const isLineEmpty = (lineInfo) => {
  if (!lineInfo) return true;
  const contentEmpty = lineInfo.content.trim() === '';
  const markerEmpty = !lineInfo.marker.trim();
  return contentEmpty && markerEmpty;
};

const toggleBlockBold = (selection = '') => {
  const lines = selection.split('\n');
  const parsed = lines.map(parseLineForBlockBold);

  const hasAnyContent = parsed.some((info) => !isLineEmpty(info));
  if (!hasAnyContent) {
    return {
      text: selection,
      changed: false,
      removed: false,
      handled: true
    };
  }

  const allBold = parsed.every((info) => isLineEmpty(info) || info.hasOuterBold);

  if (allBold) {
    const newLines = parsed.map((info) => {
      if (!info.hasOuterBold) {
        return info.original;
      }
      return `${info.leading}${info.marker}${info.content}`;
    });

    const text = newLines.join('\n');
    return {
      text,
      changed: text !== selection,
      removed: true,
      handled: true
    };
  }

  const newLines = parsed.map((info) => {
    if (isLineEmpty(info)) {
      return info.original;
    }

    const sanitizedContent = sanitizeContentForBold(info.content);
    if (sanitizedContent.trim() === '') {
      return info.original;
    }

    return `${info.leading}${info.marker}${BOLD_DELIMITER}${sanitizedContent}${BOLD_DELIMITER}`;
  });

  const text = newLines.join('\n');

  return {
    text,
    changed: text !== selection,
    removed: false,
    handled: true
  };
};

export const toggleListFormatting = (text, style = 'bullets') => {
  const lines = text.split('\n');
  const nonEmptyLines = lines.filter((line) => line.trim() !== '');

  if (nonEmptyLines.length === 0) {
    return { text, changed: false, removed: false };
  }

  const formattedCount = nonEmptyLines.filter(lineHasListMarker).length;
  const allFormatted = formattedCount === nonEmptyLines.length;

  if (allFormatted) {
    const unformattedLines = lines.map(stripListMarker);
    return {
      text: unformattedLines.join('\n'),
      changed: true,
      removed: true
    };
  }

  const cleanedLines = lines.map(stripListMarker);
  const formattedLines = applyListMarkers(cleanedLines, style);

  return {
    text: formattedLines.join('\n'),
    changed: true,
    removed: false
  };
};

export const toggleBoldFormatting = (value, selectionStart, selectionEnd) => {
  if (selectionStart === selectionEnd) {
    return {
      text: value,
      selectionStart,
      selectionEnd
    };
  }

  const selectedText = value.substring(selectionStart, selectionEnd);
  const selectionStartsLine = selectionStart === 0 || value[selectionStart - 1] === '\n';
  const selectionEndsLine = selectionEnd === value.length || value[selectionEnd] === '\n';

  if (selectionStartsLine && selectionEndsLine) {
    const blockResult = toggleBlockBold(selectedText);
    if (blockResult.changed) {
      const updatedText = value.substring(0, selectionStart) + blockResult.text + value.substring(selectionEnd);
      return {
        text: updatedText,
        selectionStart,
        selectionEnd: selectionStart + blockResult.text.length
      };
    }
    if (blockResult.handled) {
      return {
        text: value,
        selectionStart,
        selectionEnd
      };
    }
  }

  const beforeSelection = value.substring(Math.max(0, selectionStart - 2), selectionStart);
  const afterSelection = value.substring(selectionEnd, selectionEnd + 2);

  if (selectedText.startsWith(BOLD_DELIMITER) && selectedText.endsWith(BOLD_DELIMITER) && selectedText.length > 4) {
    const innerText = selectedText.slice(2, -2);
    const updatedText = value.substring(0, selectionStart) + innerText + value.substring(selectionEnd);

    return {
      text: updatedText,
      selectionStart,
      selectionEnd: selectionStart + innerText.length
    };
  }

  if (beforeSelection === BOLD_DELIMITER && afterSelection === BOLD_DELIMITER) {
    const updatedText =
      value.substring(0, selectionStart - 2) +
      selectedText +
      value.substring(selectionEnd + 2);

    const newStart = selectionStart - 2;
    return {
      text: updatedText,
      selectionStart: newStart,
      selectionEnd: newStart + selectedText.length
    };
  }

  const boldPairRegex = /\*\*([\s\S]+?)\*\*/g;
  const matchedBoldSegments = selectedText.match(boldPairRegex);

  if (matchedBoldSegments) {
    const withoutBoldPairs = selectedText.replace(/\*\*([\s\S]+?)\*\*/g, '');
    const hasUnmatchedDelimiters = withoutBoldPairs.includes(BOLD_DELIMITER);

    if (withoutBoldPairs.trim() === '' && !hasUnmatchedDelimiters) {
      const cleanedSelection = selectedText.replace(/\*\*([\s\S]+?)\*\*/g, '$1');
      const updatedText = value.substring(0, selectionStart) + cleanedSelection + value.substring(selectionEnd);

      return {
        text: updatedText,
        selectionStart,
        selectionEnd: selectionStart + cleanedSelection.length
      };
    }
  }

  const cleanedSelection = selectedText.replace(/\*\*/g, '');
  const bolded = `${BOLD_DELIMITER}${cleanedSelection}${BOLD_DELIMITER}`;
  const updatedText = value.substring(0, selectionStart) + bolded + value.substring(selectionEnd);

  return {
    text: updatedText,
    selectionStart: selectionStart + BOLD_DELIMITER.length,
    selectionEnd: selectionStart + BOLD_DELIMITER.length + cleanedSelection.length
  };
};
