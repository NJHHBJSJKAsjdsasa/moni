// atlas-ui/react/static/js/Utils/ContentFilter.jsx

class ContentFilter {
  constructor() {
    this.forbiddenWords = ["nigga", "nigger", "negro", "coon", "chink", "gook", "spic", "wetback", "kike", "heeb", "raghead", "towelhead", "sandnigger", "paki", "pancho", "panchito", "faggot", "fag", "dyke", "tranny", "shemale", "ladyboy", "gay", "queer", "hitler", "nazi", "heil", "sieg", "aryan", "swastika", "1488", "14/88", "white power", "white supremacy", "kkk", "ku klux", "bitch", "whore", "slut", "cunt", "hoe", "thot", "kys", "murder", "rape", "terrorist", "genocide", "holocaust", "clickhere", "buynow", "freemoney", "winner", "prize", "urgent", "fuck", "shit", "damn", "ass", "piss", "cock", "dick", "pussy", "dildo", "jewrat", "mudslime", "christcuck", "islamist", "jihadist", "zionist", "infidel", "kafir", "goyim", "crusader", "heathen", "blasphemy", "卐", "卍", "tripleparen", "pepe", "kek", "based", "redpilled"];

    this.urlPatterns = [/https?:\/\/[^\s]+/gi, /www\.[^\s]+/gi, /[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}/gi, /bit\.ly\/[^\s]+/gi, /tinyurl\.com\/[^\s]+/gi, /t\.co\/[^\s]+/gi];

    this.personalInfoPatterns = [
      /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, // Phone (US format)
      /\b\d{3}[-.\s]?\d{2}[-.\s]?\d{2}[-.\s]?\d{2}[-.\s]?\d{2}\b/g, // Phone (International format)
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Emails
    ];

    this.obfuscationMap = {
      "@": "a",
      4: "a",
      3: "e",
      1: "i",
      "!": "i",
      0: "o",
      5: "s",
      7: "t",
      "+": "t",
      ph: "f",
      ck: "ck",

      rn: "m",
      rrn: "rn",
      rrrn: "rrn",

      а: "a", // Cyrillic a
      е: "e", // Cyrillic e
      о: "o", // Cyrillic o
      р: "p", // Cyrillic p
      с: "c", // Cyrillic c
      х: "x", // Cyrillic x
      у: "y", // Cyrillic y
      і: "i", // Cyrillic i
      ѕ: "s", // Cyrillic s
      ј: "j", // Cyrillic j
      ӏ: "l", // Cyrillic l

      α: "a",
      ο: "o",
      ρ: "p",
      υ: "y",
      ν: "v",

      " ": "", // Various Unicode spaces
      "​": "", // Zero-width space
      "‌": "", // Zero-width non-joiner
      "‍": "", // Zero-width joiner

      ii: "i",
      oo: "o",
      aa: "a",
      ee: "e",
    };
  }

  normalizeText(text) {
    if (!text || typeof text !== "string") return "";

    let normalized = text.toLowerCase();

    // 1
    normalized = normalized.replace(/[\s\-_\.]+/g, "");

    // 2
    for (let pass = 0; pass < 3; pass++) {
      Object.entries(this.obfuscationMap).forEach(([obfuscated, normal]) => {
        try {
          const escapedObfuscated = obfuscated.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const regex = new RegExp(escapedObfuscated, "g");
          normalized = normalized.replace(regex, normal);
        } catch (e) {
          normalized = normalized.replace(new RegExp(obfuscated, "g"), normal);
        }
      });
    }

    // 3
    normalized = normalized.replace(/rn/g, "m");
    normalized = normalized.replace(/vv/g, "w");
    normalized = normalized.replace(/\|V\|/g, "m");
    normalized = normalized.replace(/\\/g, "l");

    // 4
    normalized = normalized.replace(/[^a-z0-9]/g, "");

    // 5
    normalized = normalized.trim();

    return normalized;
  }

  detectEvasionPatterns(text) {
    for (const word of this.forbiddenWords) {
      const separatedPattern = word.split("").join("[\\s\\-_\\.]*");
      const regex = new RegExp(separatedPattern, "i");

      if (regex.test(text)) {
        return true;
      }
    }

    return false;
  }

  containsForbiddenWords(text) {
    const normalized = this.normalizeText(text);

    if (this.detectEvasionPatterns(text)) {
      return {
        found: true,
        word: "evasion pattern",
        reason: "Hate Speech",
      };
    }

    for (const word of this.forbiddenWords) {
      const wordLower = word.toLowerCase();

      if (normalized.includes(wordLower)) {
        return {
          found: true,
          word: word,
          reason: "Hate Speech",
        };
      }

      try {
        const escapedWord = wordLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const wordRegex = new RegExp(`\\b${escapedWord}\\b`, "i");
        if (wordRegex.test(normalized)) {
          return {
            found: true,
            word: word,
            reason: "Hate Speech",
          };
        }
      } catch (e) {}

      if (this.isSimilarWord(normalized, wordLower)) {
        return {
          found: true,
          word: word,
          reason: "Hate Speech",
        };
      }
    }

    return { found: false };
  }

  isSimilarWord(text, targetWord) {
    if (Math.abs(text.length - targetWord.length) > 3) return false;

    let matches = 0;
    const minLength = Math.min(text.length, targetWord.length);

    for (let i = 0; i < minLength; i++) {
      if (text[i] === targetWord[i]) matches++;
    }

    return matches / minLength > 0.8 && minLength > 4;
  }

  containsUrls(text) {
    for (const pattern of this.urlPatterns) {
      if (pattern.test(text)) {
        return {
          found: true,
          reason: "URL/Link",
        };
      }
    }
    return { found: false };
  }

  containsSpam(text) {
    for (const pattern of this.personalInfoPatterns) {
      if (pattern.test(text)) {
        return {
          found: true,
          reason: "Personal Info",
        };
      }
    }

    const words = text.toLowerCase().split(/\s+/);
    const wordCounts = {};

    for (const word of words) {
      if (word.length > 2) {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
        if (wordCounts[word] > 5) {
          return {
            found: true,
            reason: "Excessive Repetition",
          };
        }
      }
    }

    return { found: false };
  }

  filterContent(text) {
    if (!text || typeof text !== "string" || text.trim() === "") {
      return {
        isBlocked: false,
        originalText: text,
        filteredText: text,
        reason: null,
      };
    }

    const forbiddenCheck = this.containsForbiddenWords(text);
    if (forbiddenCheck.found) {
      return {
        isBlocked: true,
        originalText: text,
        filteredText: "Hate Speech",
        reason: "Hate Speech",
        details: `Contains prohibited word: ${forbiddenCheck.word}`,
      };
    }

    const urlCheck = this.containsUrls(text);
    if (urlCheck.found) {
      return {
        isBlocked: true,
        originalText: text,
        filteredText: "URL/Link",
        reason: "URL/Link",
        details: "Contains URLs or links",
      };
    }

    const spamCheck = this.containsSpam(text);
    if (spamCheck.found) {
      return {
        isBlocked: true,
        originalText: text,
        filteredText: "Spam",
        reason: "Spam",
        details: `Spam pattern detected: ${spamCheck.reason}`,
      };
    }

    return {
      isBlocked: false,
      originalText: text,
      filteredText: text,
      reason: null,
    };
  }

  filterSeed(seed) {
    return this.filterContent(seed);
  }

  shouldDisplayContent(text) {
    const result = this.filterContent(text);
    return !result.isBlocked;
  }

  getDisplayText(text) {
    const result = this.filterContent(text);
    return result.filteredText;
  }
}

const contentFilter = new ContentFilter();

export default contentFilter;

export { ContentFilter };
