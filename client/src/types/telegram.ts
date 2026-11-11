export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}

export interface TelegramThemeParams {
  [key: string]: string | undefined;
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
  secondary_bg_color?: string;
  header_bg_color?: string;
  bottom_bar_bg_color?: string;
  accent_text_color?: string;
  section_bg_color?: string;
  section_header_text_color?: string;
  subtitle_text_color?: string;
  destructive_text_color?: string;
}

export interface TelegramMainButton {
  text: string;
  color: string;
  textColor: string;
  isVisible: boolean;
  isActive: boolean;
  isProgressVisible: boolean;
  setText: (text: string) => TelegramMainButton;
  onClick: (callback: () => void) => TelegramMainButton;
  offClick: (callback: () => void) => TelegramMainButton;
  show: () => TelegramMainButton;
  hide: () => TelegramMainButton;
  enable: () => TelegramMainButton;
  disable: () => TelegramMainButton;
  showProgress: (leaveActive?: boolean) => TelegramMainButton;
  hideProgress: () => TelegramMainButton;
  setParams: (params: {
    text?: string;
    color?: string;
    text_color?: string;
    is_active?: boolean;
    is_visible?: boolean;
  }) => TelegramMainButton;
}

export interface TelegramBackButton {
  isVisible: boolean;
  onClick: (callback: () => void) => TelegramBackButton;
  offClick: (callback: () => void) => TelegramBackButton;
  show: () => TelegramBackButton;
  hide: () => TelegramBackButton;
}

export interface TelegramHapticFeedback {
  impactOccurred: (
    style: "light" | "medium" | "heavy" | "rigid" | "soft"
  ) => TelegramHapticFeedback;
  notificationOccurred: (
    type: "error" | "success" | "warning"
  ) => TelegramHapticFeedback;
  selectionChanged: () => TelegramHapticFeedback;
}

export interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    query_id?: string;
    user?: TelegramUser;
    receiver?: TelegramUser;
    start_param?: string;
    auth_date?: number;
    hash?: string;
  };
  version: string;
  platform: string;
  colorScheme: "light" | "dark";
  themeParams: TelegramThemeParams;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  headerColor: string;
  backgroundColor: string;
  isClosingConfirmationEnabled: boolean;
  BackButton: TelegramBackButton;
  MainButton: TelegramMainButton;
  HapticFeedback: TelegramHapticFeedback;
  openLink: (url: string, options?: { try_instant_view?: boolean }) => void;
  openTelegramLink: (url: string) => void;
  openInvoice: (url: string, callback?: (status: string) => void) => void;
  showPopup: (
    params: {
      title?: string;
      message: string;
      buttons?: Array<{ id?: string; type?: string; text?: string }>;
    },
    callback?: (buttonId: string) => void
  ) => void;
  showAlert: (message: string, callback?: () => void) => void;
  showConfirm: (message: string, callback?: (isConfirmed: boolean) => void) => void;
  ready: () => void;
  expand: () => void;
  close: () => void;
  sendData: (data: string) => void;
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  enableClosingConfirmation: () => void;
  disableClosingConfirmation: () => void;
  onEvent: (eventType: string, eventHandler: () => void) => void;
  offEvent: (eventType: string, eventHandler: () => void) => void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

// Store & Product Data Models
export interface Product {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  price: number; // in USD
  starsPrice: number; // in Telegram Stars (approx $0.02 each, so $10 = 500 stars)
  tonPrice: number; // in TON (e.g. 1.8 TON)
  category: "all" | "tech" | "streetwear" | "digital" | "accessories";
  rating: number;
  reviewsCount: number;
  image: string;
  badge?: "Trending" | "Limited" | "Best Seller" | "New Drop";
  inStock: boolean;
  variants?: {
    type: "Size" | "Storage" | "Color";
    options: string[];
  }[];
  specs?: { label: string; value: string }[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedVariant?: string;
}

export interface OrderDetails {
  orderId: string;
  items: {
    id: string;
    name: string;
    quantity: number;
    price: number;
    variant?: string;
  }[];
  totalAmount: number;
  customerName: string;
  telegramUserId?: number;
  telegramUsername?: string;
  deliveryAddress: string;
  paymentMethod: "stars" | "ton" | "card";
  notes?: string;
  createdAt: string;
}
