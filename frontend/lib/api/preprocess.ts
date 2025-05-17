import { WordScore } from "@/types";

export function preprocess(words: WordScore[]): WordScore[] {


  let processed = removePunctuation(words);
  processed = removeWhitespace(processed);
  processed = removeNewlines(processed);
  processed = removeNumbers(processed);


  processed = removeEmptyWords(processed);
  processed = removeStopWords(processed);
  processed = removeNonAlphabetic(processed);


  processed = dedup(processed);

  return processed;
}

export function removeStopWords(words: WordScore[]): WordScore[] {
  const stopWords = new Set(["the", "and", "of", "a", "an", "in", "to", "for", "with", "on", "at", "by", "from", "up", "down", "out", "over", "under", "again", "further", "then", "once", "here", "there", "when", "where", "why", "how", "all", "any", "some", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"]);
  return words.filter(word => !stopWords.has(word.text.toLowerCase()));
}

export function removePunctuation(words: WordScore[]): WordScore[] {
  return words.map(word => ({
    text: word.text.replace(/[^\w\s]/g, ''),
    value: word.value
  }));
}

export function removeWhitespace(words: WordScore[]): WordScore[] {
  return words.map(word => ({
    text: word.text.trim().replace(/\s+/g, ' '),
    value: word.value
  }));
}

export function removeNewlines(words: WordScore[]): WordScore[] {
  return words.map(word => ({
    text: word.text.replace(/\n/g, ' '),
    value: word.value
  }));
}

export function removeNumbers(words: WordScore[]): WordScore[] {
  return words.map(word => ({
    text: word.text.replace(/[0-9]/g, ''),
    value: word.value
  }));
}

export function removeNonAlphabetic(words: WordScore[]): WordScore[] {
  return words.filter(word => /^[a-zA-Z]+$/.test(word.text));
}

export function removeEmptyWords(words: WordScore[]): WordScore[] {
  return words.filter(word => word.text.trim().length > 0);
}

export function dedup(words: WordScore[]): WordScore[] {
  const wordMap = new Map<string, { totalValue: number; count: number; originalCase: string }>();

  for (const word of words) {
    const lowerText = word.text.toLowerCase();
    if (!wordMap.has(lowerText)) {
      wordMap.set(lowerText, {
        totalValue: 0,
        count: 0,
        originalCase: word.text
      });
    }

    const entry = wordMap.get(lowerText)!;
    entry.totalValue += word.value;
    entry.count += 1;


    if (word.text[0] === word.text[0].toUpperCase() && word.text[0] !== word.text[0].toLowerCase()) {
      entry.originalCase = word.text;
    }
  }

  const dedupedWords: WordScore[] = [];
  for (const [lowerText, data] of wordMap.entries()) {
    dedupedWords.push({
      text: data.originalCase,
      value: data.totalValue / data.count
    });
  }

  return dedupedWords.sort((a, b) => b.value - a.value);
}