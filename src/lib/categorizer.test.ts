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

  // ========== NEW AU + TH RULES ==========

  describe("AU Food & Dining (new)", () => {
    it("categorises AU fast food chains", () => {
      expect(categorizeTransaction("RED ROOSTER CHATSWOOD")).toBe("Food & Dining");
      expect(categorizeTransaction("GUZMAN Y GOMEZ SYDNEY")).toBe("Food & Dining");
      expect(categorizeTransaction("OPORTO LANE COVE")).toBe("Food & Dining");
      expect(categorizeTransaction("GRILL'D BURGERS")).toBe("Food & Dining");
      expect(categorizeTransaction("ZAMBRERO NORTH SYDNEY")).toBe("Food & Dining");
      expect(categorizeTransaction("SCHNITZ CHATSWOOD")).toBe("Food & Dining");
      expect(categorizeTransaction("BETTY'S BURGERS")).toBe("Food & Dining");
      expect(categorizeTransaction("RASHAYS BANKSTOWN")).toBe("Food & Dining");
      expect(categorizeTransaction("MAD MEX PARRAMATTA")).toBe("Food & Dining");
      expect(categorizeTransaction("NOODLE BOX")).toBe("Food & Dining");
      expect(categorizeTransaction("PIE FACE CENTRAL")).toBe("Food & Dining");
      expect(categorizeTransaction("SUSHI HUB")).toBe("Food & Dining");
      expect(categorizeTransaction("FISHBOWL BARANGAROO")).toBe("Food & Dining");
    });

    it("categorises AU cafes and bakeries", () => {
      expect(categorizeTransaction("GLORIA JEANS COFFEE")).toBe("Food & Dining");
      expect(categorizeTransaction("COFFEE CLUB")).toBe("Food & Dining");
      expect(categorizeTransaction("JAMAICA BLUE")).toBe("Food & Dining");
      expect(categorizeTransaction("HUDSONS COFFEE")).toBe("Food & Dining");
      expect(categorizeTransaction("MUFFIN BREAK")).toBe("Food & Dining");
      expect(categorizeTransaction("BAKERS DELIGHT")).toBe("Food & Dining");
      expect(categorizeTransaction("BRUMBY'S BAKERY")).toBe("Food & Dining");
      expect(categorizeTransaction("DONUT KING")).toBe("Food & Dining");
      expect(categorizeTransaction("BASKIN ROBBINS")).toBe("Food & Dining");
      expect(categorizeTransaction("SIZZLER")).toBe("Food & Dining");
    });
  });

  describe("TH Food & Dining (new)", () => {
    it("categorises Thai restaurant chains", () => {
      expect(categorizeTransaction("MK RESTAURANT CENTRAL")).toBe("Food & Dining");
      expect(categorizeTransaction("MK SUKI")).toBe("Food & Dining");
      expect(categorizeTransaction("BAR-B-Q PLAZA MEGA")).toBe("Food & Dining");
      expect(categorizeTransaction("SHABUSHI CENTRAL")).toBe("Food & Dining");
      expect(categorizeTransaction("BONCHON SIAM")).toBe("Food & Dining");
      expect(categorizeTransaction("AFTER YOU SIAM")).toBe("Food & Dining");
      expect(categorizeTransaction("SNP FOOD")).toBe("Food & Dining");
      expect(categorizeTransaction("THE PIZZA COMPANY")).toBe("Food & Dining");
      expect(categorizeTransaction("SWENSENS CENTRAL")).toBe("Food & Dining");
      expect(categorizeTransaction("DAIRY QUEEN TERMINAL")).toBe("Food & Dining");
      expect(categorizeTransaction("OISHI BUFFET")).toBe("Food & Dining");
      expect(categorizeTransaction("BLACK CANYON COFFEE")).toBe("Food & Dining");
      expect(categorizeTransaction("MOS BURGER SIAM")).toBe("Food & Dining");
    });

    it("categorises Thai coffee chains", () => {
      expect(categorizeTransaction("CAFE AMAZON BANGNA")).toBe("Food & Dining");
      expect(categorizeTransaction("INTHANIN COFFEE")).toBe("Food & Dining");
      expect(categorizeTransaction("WAWEE COFFEE")).toBe("Food & Dining");
      expect(categorizeTransaction("PUNTHAI COFFEE")).toBe("Food & Dining");
    });

    it("categorises Thai food delivery", () => {
      expect(categorizeTransaction("GRABFOOD BANGKOK")).toBe("Food & Dining");
      expect(categorizeTransaction("GRAB*FOOD")).toBe("Food & Dining");
      expect(categorizeTransaction("FOODPANDA")).toBe("Food & Dining");
      expect(categorizeTransaction("LINE MAN WONGNAI")).toBe("Food & Dining");
      expect(categorizeTransaction("LINEMAN")).toBe("Food & Dining");
    });
  });

  describe("AU Groceries (new)", () => {
    it("categorises AU grocery chains", () => {
      expect(categorizeTransaction("FOODWORKS EPPING")).toBe("Groceries");
      expect(categorizeTransaction("DRAKES SUPERMARKET")).toBe("Groceries");
      expect(categorizeTransaction("SPUDSHED")).toBe("Groceries");
      expect(categorizeTransaction("IGA X-PRESS")).toBe("Groceries");
      expect(categorizeTransaction("IGA XPRESS")).toBe("Groceries");
    });
  });

  describe("TH Groceries (new)", () => {
    it("categorises Thai convenience stores and supermarkets", () => {
      expect(categorizeTransaction("CP ALL PUBLIC")).toBe("Groceries");
      expect(categorizeTransaction("CPALL")).toBe("Groceries");
      expect(categorizeTransaction("FAMILYMART SIAM")).toBe("Groceries");
      expect(categorizeTransaction("LAWSON 108")).toBe("Groceries");
      expect(categorizeTransaction("MINI BIG C")).toBe("Groceries");
      expect(categorizeTransaction("CJ EXPRESS")).toBe("Groceries");
      expect(categorizeTransaction("LOTUS'S BANGNA")).toBe("Groceries");
      expect(categorizeTransaction("EK-CHAI DISTRIBUTION")).toBe("Groceries");
      expect(categorizeTransaction("GOURMET MARKET SIAM")).toBe("Groceries");
      expect(categorizeTransaction("VILLA MARKET")).toBe("Groceries");
      expect(categorizeTransaction("MAXVALU TANJAI")).toBe("Groceries");
      expect(categorizeTransaction("CP FRESHMART")).toBe("Groceries");
      expect(categorizeTransaction("CENTRAL FOOD HALL")).toBe("Groceries");
    });
  });

  describe("AU Transport (new)", () => {
    it("categorises AU fuel stations", () => {
      expect(categorizeTransaction("AMPOL LANE COVE")).toBe("Transport");
      expect(categorizeTransaction("CALTEX CHATSWOOD")).toBe("Transport");
      expect(categorizeTransaction("UNITED PETROLEUM")).toBe("Transport");
      expect(categorizeTransaction("PUMA ENERGY")).toBe("Transport");
    });

    it("categorises AU tolls and parking", () => {
      expect(categorizeTransaction("LINKT TOLL")).toBe("Transport");
      expect(categorizeTransaction("ROAM EXPRESS")).toBe("Transport");
      expect(categorizeTransaction("E-TOLL NSW")).toBe("Transport");
      expect(categorizeTransaction("WILSON PARKING")).toBe("Transport");
      expect(categorizeTransaction("SECURE PARKING")).toBe("Transport");
    });

    it("categorises AU auto services", () => {
      expect(categorizeTransaction("SUPERCHEAP AUTO")).toBe("Transport");
      expect(categorizeTransaction("REPCO")).toBe("Transport");
      expect(categorizeTransaction("AUTOBARN")).toBe("Transport");
    });
  });

  describe("TH Transport (new)", () => {
    it("categorises Thai transit", () => {
      expect(categorizeTransaction("BTS SKYTRAIN")).toBe("Transport");
      expect(categorizeTransaction("RABBIT CARD")).toBe("Transport");
      expect(categorizeTransaction("MRT BANGKOK")).toBe("Transport");
      expect(categorizeTransaction("BEM EXPRESSWAY")).toBe("Transport");
      expect(categorizeTransaction("BOLT.EU RIDE")).toBe("Transport");
    });

    it("categorises Thai fuel stations", () => {
      expect(categorizeTransaction("PTT STATION BANGNA")).toBe("Transport");
      expect(categorizeTransaction("BANGCHAK FUEL")).toBe("Transport");
    });

    it("categorises Thai toll roads", () => {
      expect(categorizeTransaction("EXAT EXPRESSWAY")).toBe("Transport");
      expect(categorizeTransaction("EASY PASS TOLL")).toBe("Transport");
      expect(categorizeTransaction("M-PASS")).toBe("Transport");
    });
  });

  describe("AU Shopping (new)", () => {
    it("categorises AU hardware / home", () => {
      expect(categorizeTransaction("BUNNINGS WAREHOUSE")).toBe("Shopping");
      expect(categorizeTransaction("HARVEY NORMAN")).toBe("Shopping");
      expect(categorizeTransaction("FANTASTIC FURNITURE")).toBe("Shopping");
      expect(categorizeTransaction("THE GOOD GUYS")).toBe("Shopping");
      expect(categorizeTransaction("NICK SCALI")).toBe("Shopping");
    });

    it("categorises AU liquor stores", () => {
      expect(categorizeTransaction("DAN MURPHYS CHATSWOOD")).toBe("Shopping");
      expect(categorizeTransaction("BWS LANE COVE")).toBe("Shopping");
      expect(categorizeTransaction("LIQUORLAND")).toBe("Shopping");
      expect(categorizeTransaction("FIRST CHOICE LIQUOR")).toBe("Shopping");
    });

    it("categorises AU beauty / eyewear", () => {
      expect(categorizeTransaction("SEPHORA SYDNEY")).toBe("Shopping");
      expect(categorizeTransaction("DECATHLON")).toBe("Shopping");
    });
  });

  describe("TH Shopping (new)", () => {
    it("categorises Thai department stores", () => {
      expect(categorizeTransaction("CENTRAL DEPT STORE")).toBe("Shopping");
      expect(categorizeTransaction("ROBINSON BANGRAK")).toBe("Shopping");
      expect(categorizeTransaction("SIAM PARAGON")).toBe("Shopping");
      expect(categorizeTransaction("EMPORIUM")).toBe("Shopping");
      expect(categorizeTransaction("EMQUARTIER")).toBe("Shopping");
      expect(categorizeTransaction("TERMINAL 21")).toBe("Shopping");
      expect(categorizeTransaction("ICONSIAM")).toBe("Shopping");
      expect(categorizeTransaction("MBK CENTER")).toBe("Shopping");
    });

    it("categorises Thai home / electronics", () => {
      expect(categorizeTransaction("HOMEPRO MEGA")).toBe("Shopping");
      expect(categorizeTransaction("THAIWATSADU")).toBe("Shopping");
      expect(categorizeTransaction("DOHOME")).toBe("Shopping");
      expect(categorizeTransaction("GLOBAL HOUSE")).toBe("Shopping");
      expect(categorizeTransaction("POWER BUY")).toBe("Shopping");
      expect(categorizeTransaction("BANANA IT")).toBe("Shopping");
      expect(categorizeTransaction("STUDIO 7")).toBe("Shopping");
      expect(categorizeTransaction("IT CITY")).toBe("Shopping");
    });

    it("categorises Thai drugstores", () => {
      expect(categorizeTransaction("WATSONS SIAM")).toBe("Shopping");
      expect(categorizeTransaction("BOOTS PHARMACY")).toBe("Shopping");
    });
  });

  describe("AU Bills & Utilities (new)", () => {
    it("categorises AU energy providers", () => {
      expect(categorizeTransaction("AGL ENERGY")).toBe("Bills & Utilities");
      expect(categorizeTransaction("ENERGYAUSTRALIA")).toBe("Bills & Utilities");
      expect(categorizeTransaction("ALINTA ENERGY")).toBe("Bills & Utilities");
      expect(categorizeTransaction("RED ENERGY")).toBe("Bills & Utilities");
    });

    it("categorises AU telcos", () => {
      expect(categorizeTransaction("AUSSIE BROADBAND")).toBe("Bills & Utilities");
      expect(categorizeTransaction("AMAYSIM")).toBe("Bills & Utilities");
      expect(categorizeTransaction("FOXTEL")).toBe("Bills & Utilities");
    });
  });

  describe("TH Bills & Utilities (new)", () => {
    it("categorises Thai utilities", () => {
      expect(categorizeTransaction("METROPOLITAN ELECTRICITY AUTHORITY")).toBe("Bills & Utilities");
      expect(categorizeTransaction("PROVINCIAL WATERWORKS")).toBe("Bills & Utilities");
    });

    it("categorises Thai telcos", () => {
      expect(categorizeTransaction("AIS FIBRE")).toBe("Bills & Utilities");
      expect(categorizeTransaction("TRUEMOVE H")).toBe("Bills & Utilities");
      expect(categorizeTransaction("DTAC PREPAID")).toBe("Bills & Utilities");
      expect(categorizeTransaction("3BB INTERNET")).toBe("Bills & Utilities");
      expect(categorizeTransaction("TRUE MONEY TOPUP")).toBe("Bills & Utilities");
      expect(categorizeTransaction("COUNTER SERVICE")).toBe("Bills & Utilities");
    });
  });

  describe("AU Insurance (new)", () => {
    it("categorises AU insurers", () => {
      expect(categorizeTransaction("NRMA INSURANCE")).toBe("Insurance");
      expect(categorizeTransaction("AAMI CAR")).toBe("Insurance");
      expect(categorizeTransaction("SUNCORP INSURANCE")).toBe("Insurance");
      expect(categorizeTransaction("RACV MEMBERSHIP")).toBe("Insurance");
      expect(categorizeTransaction("RACQ")).toBe("Insurance");
      expect(categorizeTransaction("QBE INSURANCE")).toBe("Insurance");
      expect(categorizeTransaction("YOUI")).toBe("Insurance");
      expect(categorizeTransaction("BUDGET DIRECT")).toBe("Insurance");
      expect(categorizeTransaction("HCF HEALTH")).toBe("Insurance");
    });
  });

  describe("TH Insurance (new)", () => {
    it("categorises Thai insurers", () => {
      expect(categorizeTransaction("MUANG THAI LIFE")).toBe("Insurance");
      expect(categorizeTransaction("VIRIYAH INSURANCE")).toBe("Insurance");
      expect(categorizeTransaction("AIA THAILAND")).toBe("Insurance");
      expect(categorizeTransaction("FWD INSURANCE")).toBe("Insurance");
      expect(categorizeTransaction("PRUDENTIAL LIFE")).toBe("Insurance");
      expect(categorizeTransaction("KRUNGTHAI-AXA")).toBe("Insurance");
      expect(categorizeTransaction("TOKIO MARINE")).toBe("Insurance");
    });
  });

  describe("AU Health (new)", () => {
    it("categorises AU health services", () => {
      expect(categorizeTransaction("SPECSAVERS CHATSWOOD")).toBe("Health");
      expect(categorizeTransaction("OPSM MACQUARIE")).toBe("Health");
      expect(categorizeTransaction("PHYSIO FIRST")).toBe("Health");
      expect(categorizeTransaction("QML PATHOLOGY")).toBe("Health");
      expect(categorizeTransaction("BLOOMS CHEMIST")).toBe("Health");
      expect(categorizeTransaction("DISCOUNT DRUG STORES")).toBe("Health");
    });
  });

  describe("TH Health (new)", () => {
    it("categorises Thai hospitals", () => {
      expect(categorizeTransaction("BUMRUNGRAD HOSPITAL")).toBe("Health");
      expect(categorizeTransaction("SAMITIVEJ SUKHUMVIT")).toBe("Health");
      expect(categorizeTransaction("BANGKOK HOSPITAL")).toBe("Health");
      expect(categorizeTransaction("PHYATHAI HOSPITAL")).toBe("Health");
      expect(categorizeTransaction("PAOLO HOSPITAL")).toBe("Health");
      expect(categorizeTransaction("RAMKHAMHAENG HOSPITAL")).toBe("Health");
    });
  });

  describe("AU Subscriptions (new)", () => {
    it("categorises AU gym memberships", () => {
      expect(categorizeTransaction("ANYTIME FITNESS")).toBe("Subscriptions");
      expect(categorizeTransaction("F45 TRAINING")).toBe("Subscriptions");
      expect(categorizeTransaction("JETTS FITNESS")).toBe("Subscriptions");
      expect(categorizeTransaction("FITNESS FIRST")).toBe("Subscriptions");
    });
  });

  describe("Pets (new)", () => {
    it("categorises AU pet stores", () => {
      expect(categorizeTransaction("PETBARN CHATSWOOD")).toBe("Pets");
      expect(categorizeTransaction("PET STOCK")).toBe("Pets");
      expect(categorizeTransaction("CITY FARMERS")).toBe("Pets");
      expect(categorizeTransaction("GREENCROSS VETS")).toBe("Pets");
    });
  });

  describe("Charity (new)", () => {
    it("categorises AU charities", () => {
      expect(categorizeTransaction("WORLD VISION AUST")).toBe("Charity");
      expect(categorizeTransaction("SALVATION ARMY")).toBe("Charity");
      expect(categorizeTransaction("AUST RED CROSS")).toBe("Charity");
      expect(categorizeTransaction("BEYOND BLUE")).toBe("Charity");
      expect(categorizeTransaction("CANCER COUNCIL")).toBe("Charity");
    });
  });

  describe("Transfer / BNPL (new)", () => {
    it("categorises BNPL repayments", () => {
      expect(categorizeTransaction("AFTERPAY PAYMENT")).toBe("Transfer");
      expect(categorizeTransaction("ZIP PAY")).toBe("Transfer");
      expect(categorizeTransaction("KLARNA PAYMENT")).toBe("Transfer");
      expect(categorizeTransaction("SHOPHUMM")).toBe("Transfer");
    });
  });

  describe("GrabFood vs Grab (conflict check)", () => {
    it("GrabFood → Food & Dining, Grab → Transport", () => {
      expect(categorizeTransaction("GRABFOOD BANGKOK")).toBe("Food & Dining");
      expect(categorizeTransaction("GRAB*FOOD")).toBe("Food & Dining");
      expect(categorizeTransaction("GRAB RIDE")).toBe("Transport");
      expect(categorizeTransaction("GRAB TAXI")).toBe("Transport");
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
