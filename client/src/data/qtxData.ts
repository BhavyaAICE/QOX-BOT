  export interface QTXPlan {
    id: string;
    tag: string;
    duration: string;
    price: number;
    inrPrice?: number;
    buttonText: string;
    isPopular?: boolean;
    features: string[];
  }

  export const QTX_PLANS: QTXPlan[] = [
    {
      id: "initiate-10d",
      tag: "INITIATE",
      duration: "10 DAYS",
      price: 200,
      inrPrice: 20000,
      buttonText: "BEGIN JOURNEY",
      features: [
        "30 Signals Daily",
        "Full AI Signal Analysis",
        "Chart Screenshot Upload",
        "10 Days Access",
        "24/7 Support",
      ],
    },
    {
      id: "enlightened-1m",
      tag: "ENLIGHTENED",
      duration: "1 MONTH",
      price: 300,
      inrPrice: 30000,
      buttonText: "ACCEPT INITIATION",
      isPopular: true,
      features: [
        "100 Signals Daily",
        "Full AI Signal Analysis",
        "Chart Screenshot Upload",
        "30 Days Access",
        "Priority Support",
      ],
    },
    {
      id: "grandmaster-perm",
      tag: "GRANDMASTER",
      duration: "PERMANENT",
      price: 500,
      inrPrice: 50000,
      buttonText: "BEGIN JOURNEY",
      features: [
        "Unlimited Signals Daily",
        "Full AI Signal Analysis",
        "Chart Screenshot Upload",
        "Lifetime Access",
        "VIP Support",
        "Future Updates",
      ],
    },
  ];

  // Helper function to safely get formatted INR amount for any plan
  export function getPlanInrAmount(plan: QTXPlan): number {
    if (plan.inrPrice !== undefined && plan.inrPrice > 0) {
      return plan.inrPrice;
    }
    return Math.round(plan.price * (PAYMENT_CONFIG.usdToInrRate || 90));
  }

  // Official Deposit Wallets Configuration (Easily updated with your addresses)
  export const PAYMENT_CONFIG = {
    // USDT BEP-20 (Binance Smart Chain) for Binance Pay
    usdtBep20Address: "0xE738EE875eE27ECF7Fb39A767fa446174E0522A3",
    // USDT TRC-20 (Tron Network) for Trust Wallet & Tron Wallets
    usdtTrc20Address: "TS2QqJjTKGxiLixdeainoqJjqU5DxFmQrM",
    // Binance Pay ID
    binancePayId: "589214792",
    // UPI Configuration (Google Pay / PhonePe / Paytm / BHIM)
    upiId: "BHARATPE2K0N0N9V0A50573@unitype",
    upiName: "SATYAM RAJAK",
    usdToInrRate: 100, // Standard OTC exchange rate ($1 = ₹100)
    // Official Direct Quotex Server Gateway (Synchronized Broker Portal)
    quotexPortalUrl: "https://broker-qx.pro/sign-up/?lid=2421270",
  };

  // 50 unique realistic buyer names for the live purchase popup (No repeats)
  export const LIVE_BUYERS = [
    "SHAHBAZ GILL",
    "PRATEEK ROY",
    "VISHAL SAXENA",
    "BILAL KHAN",
    "ZAINAB AKHTAR",
    "ZUBAIR HASHMI",
    "HARSH VARDHAN",
    "IMRAN QURESHI",
    "ADITYA KAPOOR",
    "RAHIM UDDIN",
    "AYESHA SIDDIQUI",
    "VARUN KHANNA",
    "SAAD MALIK",
    "VIKRAMADITYA RAO",
    "ROHAN VERMA",
    "KABIR SINGHANIA",
    "FARHAN AKHTAR",
    "DEVENDRA PATEL",
    "TARIQ MANSOOR",
    "AMAN SHARMA",
    "NAVEEN CHOUDHARY",
    "HAMZA SHEIKH",
    "PRANAV MENON",
    "REHAN AHMED",
    "ARJUN MEHTA",
    "DANISH ALI",
    "SIDDHARTH JAIN",
    "USMAN RIAZ",
    "KUNAL DESHMUKH",
    "FAIZAN MALIK",
    "KARTHIK REDDY",
    "WAQAS BUTT",
    "ANKIT AGRAWAL",
    "MOHSIN NAQVI",
    "RISHABH SHAH",
    "ASIF IQBAL",
    "SOURAV CHATTERJEE",
    "HAMMAD TAHIR",
    "GAURAV TIWARI",
    "NOMAN CHAUDHRY",
    "HARISH IYER",
    "SAMEER KHURANA",
    "BILAWAL BHATTI",
    "CHETAN MALHOTRA",
    "JUNAID MIR",
    "MAYANK GUPTA",
    "AHSAN RAZA",
    "DEEPAK NAIR",
    "TALHA FAROOQ",
    "YASHWANT CHAUHAN",
  ];

  export interface QTXReview {
    id: string;
    name: string;
    rating: number;
    text: string;
    timeAgo: string;
    tier: string;
    badge: string;
  }

// 20 unique circulating reviews with varied member names (No emojis - Pure executive typography)
export const QTX_REVIEWS: QTXReview[] = [
  {
    id: "rev-1",
    name: "ARJUN MEHTA",
    rating: 5,
    text: "Best decision I ever made was buying QOX Software. Truly life changing.",
    timeAgo: "3m ago",
    tier: "ENLIGHTENED 1M",
    badge: "+$2,450 Profit",
  },
  {
    id: "rev-2",
    name: "DANISH ALI",
    rating: 5,
    text: "QOX Software made me financially free. Can't thank the team enough.",
    timeAgo: "7m ago",
    tier: "PERMANENT VIP",
    badge: "96.4% Win Rate",
  },
  {
    id: "rev-3",
    name: "SHAHBAZ GILL",
    rating: 5,
    text: "Best trading tool in 2026. QOX is miles ahead of any competition.",
    timeAgo: "12m ago",
    tier: "ENLIGHTENED 1M",
    badge: "Top Tier AI",
  },
  {
    id: "rev-4",
    name: "HARSH VARDHAN",
    rating: 5,
    text: "Ye rha aapke mehnat ka fal! QOX Software ki kamai se maine bike le liya sir.",
    timeAgo: "18m ago",
    tier: "PERMANENT VIP",
    badge: "Verified Payout",
  },
  {
    id: "rev-5",
    name: "IMRAN QURESHI",
    rating: 5,
    text: "Trading is now easy and stress-free thanks to QOX Software.",
    timeAgo: "24m ago",
    tier: "INITIATE 10D",
    badge: "+$1,850 Win",
  },
  {
    id: "rev-6",
    name: "ZAINAB AKHTAR",
    rating: 5,
    text: "Top 5 rank achieved thanks to QOX signals. Feeling so proud.",
    timeAgo: "32m ago",
    tier: "ENLIGHTENED 1M",
    badge: "Rank #5 Trader",
  },
  {
    id: "rev-7",
    name: "ZUBAIR HASHMI",
    rating: 5,
    text: "Best customer service I've ever experienced. QOX cares about users.",
    timeAgo: "41m ago",
    tier: "PERMANENT VIP",
    badge: "24/7 Verified",
  },
  {
    id: "rev-8",
    name: "BILAL KHAN",
    rating: 5,
    text: "Har trade win hota hai QOX ke saath. Zabardast software.",
    timeAgo: "49m ago",
    tier: "ENLIGHTENED 1M",
    badge: "95% Accuracy",
  },
  {
    id: "rev-9",
    name: "ADITYA KAPOOR",
    rating: 5,
    text: "My profits doubled in just 10 days of following the automated signals.",
    timeAgo: "1h ago",
    tier: "INITIATE 10D",
    badge: "2x Portfolio",
  },
  {
    id: "rev-10",
    name: "RAHIM UDDIN",
    rating: 5,
    text: "Me Pakistan ka hu janab. Aapke QOX Software ka user hu. Leaderboard me rank 12 pe hu.",
    timeAgo: "1h ago",
    tier: "ENLIGHTENED 1M",
    badge: "Leaderboard #12",
  },
  {
    id: "rev-11",
    name: "AYESHA SIDDIQUI",
    rating: 5,
    text: "QOX signals are 95% accurate on OTC market. Unbelievable performance.",
    timeAgo: "2h ago",
    tier: "PERMANENT VIP",
    badge: "OTC Master",
  },
  {
    id: "rev-12",
    name: "VARUN KHANNA",
    rating: 5,
    text: "The AI signal analysis is mind-blowing. Never seen accuracy like QOX before.",
    timeAgo: "2h ago",
    tier: "ENLIGHTENED 1M",
    badge: "AI Signals",
  },
  {
    id: "rev-13",
    name: "SAAD MALIK",
    rating: 5,
    text: "From losing capital to winning back-to-back sessions. QOX Software is unreal.",
    timeAgo: "3h ago",
    tier: "PERMANENT VIP",
    badge: "+$4,200 Recovered",
  },
  {
    id: "rev-14",
    name: "KABIR SINGHANIA",
    rating: 5,
    text: "Executing signals on Quotex and PocketOption is effortless with these instant alerts.",
    timeAgo: "3h ago",
    tier: "ENLIGHTENED 1M",
    badge: "OTC Specialist",
  },
  {
    id: "rev-15",
    name: "ROHAN VERMA",
    rating: 5,
    text: "Started with Initiate plan, upgraded to Permanent within 3 days. Super worth it.",
    timeAgo: "4h ago",
    tier: "PERMANENT VIP",
    badge: "Permanent VIP",
  },
  {
    id: "rev-16",
    name: "VIKRAMADITYA RAO",
    rating: 5,
    text: "Risk management guidance plus accurate signals make this unbeatable in 2026.",
    timeAgo: "5h ago",
    tier: "ENLIGHTENED 1M",
    badge: "Consistent Win",
  },
  {
    id: "rev-17",
    name: "FARHAN AKHTAR",
    rating: 5,
    text: "Bhai aapka software kamaal hai. Today took 8 trades, 8 wins back to back.",
    timeAgo: "6h ago",
    tier: "INITIATE 10D",
    badge: "8/8 Win Streak",
  },
  {
    id: "rev-18",
    name: "DEVENDRA PATEL",
    rating: 5,
    text: "Institutional grade quantitative analysis in a Telegram mini app. Absolutely brilliant work.",
    timeAgo: "7h ago",
    tier: "PERMANENT VIP",
    badge: "Quant Trader",
  },
  {
    id: "rev-19",
    name: "AMAN SHARMA",
    rating: 5,
    text: "Paid off my subscription investment in my very first trading session with QOX signals.",
    timeAgo: "8h ago",
    tier: "ENLIGHTENED 1M",
    badge: "Instant ROI",
  },
  {
    id: "rev-20",
    name: "HAMZA SHEIKH",
    rating: 5,
    text: "VIP group community and QOX bot signals are the best combo in the market.",
    timeAgo: "9h ago",
    tier: "PERMANENT VIP",
    badge: "VIP Member",
  },
];

