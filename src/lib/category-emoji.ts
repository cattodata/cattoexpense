/** Category → emoji mapping for display */
const CATEGORY_EMOJIS: Record<string, string> = {
  "Travel": "✈️",
  "Food & Dining": "🍕",
  "Groceries": "🛒",
  "Transport": "🚗",
  "Shopping": "🛍️",
  "Bills & Utilities": "🏠",
  "Subscriptions": "📺",
  "Housing": "🏡",
  "Health": "💊",
  "Entertainment": "🎮",
  "Education": "📚",
  "Transfer": "💸",
  "Income": "💰",
  "Refund": "🔄",
  "Insurance": "🛡️",
  "Personal Care": "💅",
  "Pets": "🐾",
  "Charity": "🎗️",
  "Other": "📦",
};

export function getCategoryEmoji(category: string): string {
  return CATEGORY_EMOJIS[category] || "📦";
}
