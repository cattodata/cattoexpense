import { describe, it, expect } from "vitest";
import { categorizeTransaction, subcategorizeTransaction, getAllCategories } from "./categorizer";

describe("categorizeTransaction", () => {
  describe("Travel", () => {
    it("categorises flight bookings", () => {
      expect(categorizeTransaction("Qantas Airways")).toBe("Travel");
      expect(categorizeTransaction("Virgin Australia")).toBe("Travel");
      expect(categorizeTransaction("Jetstar")).toBe("Travel");
      expect(categorizeTransaction("AirAsia")).toBe("Travel");
      expect(categorizeTransaction("Emirates")).toBe("Travel");
    });

    it("categorises hotels", () => {
      expect(categorizeTransaction("Booking.com")).toBe("Travel");
      expect(categorizeTransaction("Airbnb")).toBe("Travel");
      expect(categorizeTransaction("Agoda")).toBe("Travel");
      expect(categorizeTransaction("Marriott Hotel")).toBe("Travel");
    });
  });

  describe("Food & Dining", () => {
    it("categorises restaurants", () => {
      expect(categorizeTransaction("McDonald's")).toBe("Food & Dining");
      expect(categorizeTransaction("Starbucks")).toBe("Food & Dining");
      expect(categorizeTransaction("KFC")).toBe("Food & Dining");
    });

    it("categorises food delivery", () => {
      expect(categorizeTransaction("Uber Eats")).toBe("Food & Dining");
      expect(categorizeTransaction("UBER *EATS")).toBe("Food & Dining");
      expect(categorizeTransaction("Menulog")).toBe("Food & Dining");
      expect(categorizeTransaction("HungryPanda")).toBe("Food & Dining");
    });

    it("categorises bubble tea / cafes", () => {
      expect(categorizeTransaction("Gong Cha")).toBe("Food & Dining");
      expect(categorizeTransaction("Chatime")).toBe("Food & Dining");
      expect(categorizeTransaction("Tiger Sugar")).toBe("Food & Dining");
    });

    it("distinguishes Asiana airline vs Asiana Chatswood restaurant", () => {
      expect(categorizeTransaction("Asiana Airlines")).toBe("Travel");
      expect(categorizeTransaction("Asiana Chatswood")).toBe("Food & Dining");
    });
  });

  describe("Groceries", () => {
    it("categorises supermarkets", () => {
      expect(categorizeTransaction("Woolworths")).toBe("Groceries");
      expect(categorizeTransaction("Coles")).toBe("Groceries");
      expect(categorizeTransaction("ALDI")).toBe("Groceries");
    });
  });

  describe("Transport", () => {
    it("categorises rideshare", () => {
      expect(categorizeTransaction("Uber Trip")).toBe("Transport");
      expect(categorizeTransaction("DiDi")).toBe("Transport");
    });

    it("categorises public transport", () => {
      expect(categorizeTransaction("Opal Card")).toBe("Transport");
      expect(categorizeTransaction("Transport NSW")).toBe("Transport");
    });

    it("does not confuse Uber Eats with Uber rideshare", () => {
      expect(categorizeTransaction("UBER *EATS")).toBe("Food & Dining");
      expect(categorizeTransaction("Uber")).toBe("Transport");
    });
  });

  describe("Shopping", () => {
    it("categorises retail stores", () => {
      expect(categorizeTransaction("Amazon")).toBe("Shopping");
      expect(categorizeTransaction("JB Hi-Fi")).toBe("Shopping");
      expect(categorizeTransaction("Kmart")).toBe("Shopping");
      expect(categorizeTransaction("IKEA")).toBe("Shopping");
    });

    it("handles Apple special cases", () => {
      // Apple.com/Bill → Subscriptions
      expect(categorizeTransaction("APPLE.COM/BILL")).toBe("Subscriptions");
      // Apple.com small amount → Subscriptions
      expect(categorizeTransaction("APPLE.COM", -15)).toBe("Subscriptions");
      // Apple.com large amount → Shopping (hardware)
      expect(categorizeTransaction("APPLE.COM", -500)).toBe("Shopping");
    });
  });

  describe("Subscriptions", () => {
    it("categorises streaming services", () => {
      expect(categorizeTransaction("Netflix")).toBe("Subscriptions");
      expect(categorizeTransaction("Spotify")).toBe("Subscriptions");
      expect(categorizeTransaction("Disney+")).toBe("Subscriptions");
    });

    it("categorises software subscriptions", () => {
      expect(categorizeTransaction("Adobe")).toBe("Subscriptions");
      expect(categorizeTransaction("OpenAI")).toBe("Subscriptions");
      expect(categorizeTransaction("GitHub")).toBe("Subscriptions");
    });
  });

  describe("Bills & Utilities", () => {
    it("categorises utility bills", () => {
      expect(categorizeTransaction("Optus")).toBe("Bills & Utilities");
      expect(categorizeTransaction("Telstra")).toBe("Bills & Utilities");
      expect(categorizeTransaction("Sydney Water")).toBe("Bills & Utilities");
    });

    it("categorises bank fees", () => {
      expect(categorizeTransaction("International Transaction Fee")).toBe("Bills & Utilities");
      expect(categorizeTransaction("Account Fee")).toBe("Bills & Utilities");
    });
  });

  describe("Transfer", () => {
    it("categorises transfers", () => {
      expect(categorizeTransaction("Transfer To XX1234")).toBe("Transfer");
      expect(categorizeTransaction("Transfer Amex Repayment")).toBe("Transfer");
      expect(categorizeTransaction("BPAY HSBC Card")).toBe("Transfer");
    });

    it("decodes transfer intent — food", () => {
      expect(categorizeTransaction("Transfer To John Dinner")).toBe("Food & Dining");
      expect(categorizeTransaction("Transfer To Mary Shabu")).toBe("Food & Dining");
    });

    it("decodes transfer intent — rent", () => {
      expect(categorizeTransaction("Transfer To Landlord Rent")).toBe("Housing");
    });
  });

  describe("Other / edge cases", () => {
    it("categorises ATM as Other", () => {
      expect(categorizeTransaction("ATM Withdrawal")).toBe("Other");
    });

    it("categorises coin laundry as Other", () => {
      expect(categorizeTransaction("Coin Laundry")).toBe("Other");
    });

    it("returns Other for unknown merchants", () => {
      expect(categorizeTransaction("XYZZY9999 PTY LTD")).toBe("Other");
    });
  });
});

describe("subcategorizeTransaction", () => {
  it("subcategorises bubble tea as Cafes / Drinks / Desserts", () => {
    expect(subcategorizeTransaction("Gong Cha", "Food & Dining")).toBe("Cafes / Drinks / Desserts");
    expect(subcategorizeTransaction("Tiger Sugar", "Food & Dining")).toBe("Cafes / Drinks / Desserts");
    expect(subcategorizeTransaction("Starbucks", "Food & Dining")).toBe("Cafes / Drinks / Desserts");
  });

  it("subcategorises restaurants as Dining Out", () => {
    expect(subcategorizeTransaction("McDonald's", "Food & Dining")).toBe("Dining Out");
    expect(subcategorizeTransaction("Pepper Lunch", "Food & Dining")).toBe("Dining Out");
  });

  it("subcategorises flights", () => {
    expect(subcategorizeTransaction("Qantas Airways", "Travel")).toBe("Flights");
    expect(subcategorizeTransaction("AirAsia", "Travel")).toBe("Flights");
  });

  it("subcategorises hotels", () => {
    expect(subcategorizeTransaction("Airbnb", "Travel")).toBe("Hotels & Accommodation");
  });

  it("subcategorises electronics shopping", () => {
    expect(subcategorizeTransaction("JB Hi-Fi", "Shopping")).toBe("Electronics");
    expect(subcategorizeTransaction("Apple Store", "Shopping")).toBe("Electronics / Apple");
  });

  it("subcategorises ATM as Cash Withdrawal", () => {
    expect(subcategorizeTransaction("ATM Withdrawal", "Other")).toBe("Cash Withdrawal");
  });

  it("subcategorises CC repayment", () => {
    expect(subcategorizeTransaction("BPAY Amex", "Transfer")).toBe("Credit Card Repayment");
  });

  it("returns undefined for unknown category", () => {
    expect(subcategorizeTransaction("Test", "NonExistentCategory")).toBeUndefined();
  });

  it("detects Optus roaming ($5 charge)", () => {
    expect(subcategorizeTransaction("Optus Roaming", "Bills & Utilities", -5)).toBe("Telecom – Roaming");
  });
});

describe("getAllCategories", () => {
  it("returns all category names including Other", () => {
    const cats = getAllCategories();
    expect(cats).toContain("Travel");
    expect(cats).toContain("Food & Dining");
    expect(cats).toContain("Other");
    expect(cats.length).toBeGreaterThan(10);
  });
});
