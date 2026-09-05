import { useContext, useEffect, useMemo, useState, createContext, type ReactNode } from 'react';
import { Link, Route, Switch, useLocation, useParams, Router as WouterRouter } from 'wouter';
import {
  ArrowRight, Check, ChevronDown, ChevronLeft, ChevronRight, Heart, Instagram, Menu,
  Minus, Plus, Search, Send, ShoppingBag, SlidersHorizontal, Sparkles, Star,
  Truck, X, MessageCircle, MapPin, Mail, Phone, Clock, ShieldCheck, Trash2,
  Printer, Languages, Download,
} from 'lucide-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import logo from '@assets/lOgo_1786638003283.jpg';
import { categories as seedCategories, products as seedProducts, type Product } from './data/products';
import { categoryLabel, localizedProduct, t, type Language } from './i18n';
import AdminDashboard from './pages/admin/dashboard';
import { createOrder, fetchCategories, fetchProducts, fetchStoreSettings, validateCoupon, fetchInstallmentPlans, type StoreSettings, defaultStoreSettings, type InstallmentPlan } from './lib/api';
import LoginPage from './pages/auth/login';
import './index.css';

type CartItem = { id: string; quantity: number; variant?: string };
type CustomerInfo = { name: string; idNumber: string; phone: string; governorate: string; city: string; address: string; notes: string; paymentMethod: string; paymentDay: number | ''; };
type OrderRecord = {
  id: string;
  orderNumber?: string;
  createdAt: string;
  customer: CustomerInfo;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  installmentPlanId?: number;
  installmentMonths?: number;
  installmentMonthlyPayment?: number;
  installmentPaymentDay?: number;
};
type StoreContextValue = {
  cart: CartItem[];
  wishlist: string[];
  language: Language;
  setLanguage: (language: Language) => void;
  addToCart: (id: string, quantity?: number, variant?: string) => void;
  updateQuantity: (id: string, quantity: number, variant?: string) => void;
  removeFromCart: (id: string, variant?: string) => void;
  clearCart: () => void;
  toggleWishlist: (id: string) => void;
  cartCount: number;
  cartBump: number;
  products: Product[];
  categories: string[];
  storeSettings: StoreSettings;
  installmentPlans: InstallmentPlan[];
};

const StoreContext = createContext<StoreContextValue | null>(null);
const WHATSAPP = '201023279424';
const money = (value: number, language: Language = 'en') => language === 'ar'
  ? `${value.toLocaleString('ar-EG')} شلن كيني`
  : `KES ${value.toLocaleString('en-KE')}`;

function hexToHsl(hex: string): string {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16) / 255;
  const g = parseInt(value.slice(2, 4), 16) / 255;
  const b = parseInt(value.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const delta = max - min;
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    if (max === r) h = (g - b) / delta + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function useStore() {
  const value = useContext(StoreContext);
  if (!value) throw new Error('Store context is missing');
  return value;
}

function App() {
  const [cart, setCart] = useState<CartItem[]>(() => readStorage<CartItem[]>('pikavibe-cart', []));
  const [wishlist, setWishlist] = useState<string[]>(() => readStorage<string[]>('pikavibe-wishlist', []));
  const [language, setLanguage] = useState<Language>(() => readStorage<Language>('pikavibe-language', 'en'));
  const [cartBump, setCartBump] = useState(0);
  const [catalogProducts, setCatalogProducts] = useState<Product[]>(seedProducts);
  const [catalogCategories, setCatalogCategories] = useState<string[]>(seedCategories);
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(defaultStoreSettings);
  const [installmentPlans, setInstallmentPlans] = useState<InstallmentPlan[]>([]);
  useEffect(() => {
    let mounted = true;
    Promise.all([fetchProducts(), fetchCategories(), fetchStoreSettings(), fetchInstallmentPlans().catch(() => [])]).then(([remoteProducts, remoteCategories, remoteSettings, remotePlans]) => {
      if (!mounted) return;
      if (remoteProducts.length) setCatalogProducts(remoteProducts);
      if (remoteCategories.length) setCatalogCategories(['All', ...remoteCategories.map((category) => category.name)]);
      setStoreSettings(remoteSettings);
      setInstallmentPlans(remotePlans);
    });
    return () => { mounted = false; };
  }, []);
  useEffect(() => {
    const root = document.documentElement;
    const tokens: Record<string, string> = {
      '--primary': hexToHsl(storeSettings.primaryColor),
      '--ring': hexToHsl(storeSettings.primaryColor),
      '--foreground': hexToHsl(storeSettings.inkColor),
      '--card-foreground': hexToHsl(storeSettings.inkColor),
      '--secondary-foreground': hexToHsl(storeSettings.inkColor),
      '--accent-foreground': hexToHsl(storeSettings.inkColor),
      '--background': hexToHsl(storeSettings.backgroundColor),
      '--card': hexToHsl(storeSettings.surfaceColor),
      '--secondary': hexToHsl(storeSettings.secondaryColor),
      '--muted': hexToHsl(storeSettings.secondaryColor),
      '--muted-foreground': hexToHsl(storeSettings.mutedTextColor),
      '--accent': hexToHsl(storeSettings.accentColor),
      '--store-primary': storeSettings.primaryColor,
      '--store-ink': storeSettings.inkColor,
      '--store-background': storeSettings.backgroundColor,
      '--store-surface': storeSettings.surfaceColor,
      '--store-secondary': storeSettings.secondaryColor,
      '--store-accent': storeSettings.accentColor,
      '--store-success': storeSettings.successColor,
      '--store-muted': storeSettings.mutedTextColor,
    };
    Object.entries(tokens).forEach(([name, value]) => root.style.setProperty(name, value));
  }, [storeSettings]);
  useEffect(() => localStorage.setItem('pikavibe-cart', JSON.stringify(cart)), [cart]);
  useEffect(() => localStorage.setItem('pikavibe-wishlist', JSON.stringify(wishlist)), [wishlist]);
  useEffect(() => {
    localStorage.setItem('pikavibe-language', language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);
  const store = useMemo<StoreContextValue>(() => ({
    cart, wishlist, language, setLanguage, cartBump, products: catalogProducts, categories: catalogCategories, installmentPlans,
          addToCart: (id, quantity = 1, variant) => {

      const product = catalogProducts.find((item) => item.id === id);
      if (!product || !product.inStock || quantity < 1) return;
      setCartBump((value) => value + 1);
      setCart((items) => {
        const found = items.find((item) => item.id === id && item.variant === variant);
        const nextQuantity = Math.min(product.stock, (found?.quantity ?? 0) + quantity);
        return found
          ? items.map((item) => item.id === id && item.variant === variant ? { ...item, quantity: nextQuantity } : item)
          : [...items, { id, quantity: Math.min(product.stock, quantity), ...(variant ? { variant } : {}) }];
      });
    },
    updateQuantity: (id, quantity, variant) => setCart((items) => {
      const product = catalogProducts.find((item) => item.id === id);
      if (quantity < 1) return items.filter((item) => item.id !== id || (variant !== undefined && item.variant !== variant));
      return product ? items.map((item) => item.id === id && (variant === undefined || item.variant === variant) ? { ...item, quantity: Math.min(product.stock, quantity) } : item) : items;
    }),
    removeFromCart: (id, variant) => setCart((items) => items.filter((item) => item.id !== id || (variant !== undefined && item.variant !== variant))),
    clearCart: () => setCart([]),
    toggleWishlist: (id) => setWishlist((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]),
    cartCount: cart.reduce((sum, item) => sum + item.quantity, 0),
    storeSettings,
  }), [cart, wishlist, language, cartBump, catalogProducts, catalogCategories, storeSettings, installmentPlans]);

  return (
    <StoreContext.Provider value={store}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <RoutedErrorBoundary>
          <SiteShell>
            <Switch>
              <Route path="/" component={HomePage} />
              <Route path="/products" component={ProductsPage} />
              <Route path="/products/:id" component={ProductPage} />
              <Route path="/cart" component={CartPage} />
              <Route path="/checkout" component={CheckoutPage} />
              <Route path="/receipt/:id" component={ReceiptPage} />
              <Route path="/about" component={AboutPage} />
              <Route path="/contact" component={ContactPage} />
              <Route path="/login" component={LoginPage} />
              <Route path="/admin" component={AdminDashboard} />
              <Route component={NotFoundPage} />
            </Switch>
          </SiteShell>
        </RoutedErrorBoundary>
      </WouterRouter>
      <Toaster />
    </StoreContext.Provider>
  );
}

function readStorage<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function SiteShell({ children }: { children: ReactNode }) {
  const { cartCount, wishlist, language, setLanguage, cartBump, categories, storeSettings } = useStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [cartPulse, setCartPulse] = useState(false);
  const [location] = useLocation();
  useEffect(() => setMobileOpen(false), [location]);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location]);
  useEffect(() => {
    if (!cartBump) return;
    setCartPulse(true);
    const timeout = window.setTimeout(() => setCartPulse(false), 650);
    return () => window.clearTimeout(timeout);
  }, [cartBump]);
  return (
    <div className="grain store-theme min-h-[100dvh] bg-background">
      <div className="bg-[#3D2A1E] px-4 py-2 text-center text-[11px] font-semibold uppercase tracking-[.18em] text-[#E8DFD0]">
        {t(language, 'Free delivery in Nairobi on orders over KES 5,000')}
      </div>
      <header className="sticky top-0 z-40 border-b border-[#d6c8b5] bg-[#f4ecdf]/95 backdrop-blur-md">
        <div className="mx-auto flex h-[74px] max-w-7xl items-center justify-between gap-5 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5" data-testid="link-logo">
            <img src={storeSettings.logoUrl || logo} alt={`${storeSettings.storeName} logo`} className="h-12 w-12 rounded-full object-cover shadow-sm" />
            <div className="hidden leading-none sm:block">
              <span className="font-display text-[25px] font-bold tracking-[-.04em] text-[#3D2A1E]">{storeSettings.storeName}</span>
              <span className="mt-1 block text-[9px] font-bold uppercase tracking-[.18em] text-[#C8722E]">Kenyan kitchenware</span>
            </div>
          </Link>
          <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary navigation">
            <Link href="/" className={navClass(location === '/')} data-testid="link-home">{t(language, 'Home')}</Link>
            <div className="relative">
              <button onClick={() => setCategoryOpen((open) => !open)} className={navClass(location.startsWith('/products')) + ' flex items-center gap-1'} data-testid="button-categories">
                {t(language, 'Shop')} <ChevronDown size={14} className={categoryOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />
              </button>
              {categoryOpen && (
                <div className="absolute left-1/2 top-10 w-52 -translate-x-1/2 rounded-2xl border border-border bg-card p-2 shadow-float animate-rise">
                  {categories.slice(1).map((category) => <Link key={category} onClick={() => setCategoryOpen(false)} href={`/products?category=${encodeURIComponent(category)}`} className="block rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground" data-testid={`link-category-${category.toLowerCase().replaceAll(' ', '-')}`}>{categoryLabel(language, category)}</Link>)}
                  <Link onClick={() => setCategoryOpen(false)} href="/products" className="mt-1 block border-t border-border px-3 pt-3 text-sm font-bold text-primary" data-testid="link-all-products">{t(language, 'View all products')} <ArrowRight size={13} className="ml-1 inline" /></Link>
                </div>
              )}
            </div>
            <Link href="/about" className={navClass(location === '/about')} data-testid="link-about">{t(language, 'Our story')}</Link>
            <Link href="/contact" className={navClass(location === '/contact')} data-testid="link-contact">{t(language, 'Contact')}</Link>
          </nav>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link href="/products" className="hidden h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary sm:flex" aria-label={t(language, 'Search products')} data-testid="link-search"><Search size={19} strokeWidth={1.8} /></Link>
            <Link href="/products?wishlist=true" className="relative flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary" aria-label={t(language, 'View wishlist')} data-testid="link-wishlist"><Heart size={19} strokeWidth={1.8} fill={wishlist.length ? 'currentColor' : 'none'} /><CountBadge count={wishlist.length} /></Link>
            <Link href="/cart" className={`relative flex h-10 w-10 items-center justify-center rounded-full bg-[#3D2A1E] text-[#f4ecdf] transition-transform hover:scale-105 ${cartPulse ? 'animate-cart-bump' : ''}`} aria-label={t(language, 'View cart')} data-testid="link-cart"><ShoppingBag size={18} strokeWidth={1.8} /><CountBadge count={cartCount} inverted /></Link>
            
            <button onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')} className="flex h-10 items-center gap-1 rounded-full border border-border px-2.5 text-[11px] font-bold text-foreground transition-colors hover:bg-secondary" aria-label={language === 'en' ? 'العربية' : 'English'} data-testid="button-language-switcher"><Languages size={15} /><span>{language === 'en' ? 'العربية' : 'English'}</span></button>
            <button onClick={() => setMobileOpen(true)} className="ml-1 flex h-10 w-10 items-center justify-center rounded-full border border-border lg:hidden" aria-label={t(language, 'Open navigation')} data-testid="button-open-menu"><Menu size={20} /></button>
          </div>
        </div>
        {mobileOpen && <MobileMenu close={() => setMobileOpen(false)} />}
      </header>
      <main>{children}</main>
      <Footer />
      <a href={whatsappUrl(language === 'ar' ? 'مرحباً بيكاڤايب، لدي سؤال.' : 'Hello PikaVibe! I have a question.')} target="_blank" rel="noreferrer" className="fixed bottom-5 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#2E9B68] text-white shadow-float transition-transform hover:scale-110" aria-label={language === 'ar' ? 'تواصل مع بيكاڤايب عبر واتساب' : 'Chat with PikaVibe on WhatsApp'} data-testid="link-floating-whatsapp"><MessageCircle size={25} /></a>
    </div>
  );
}

function navClass(active: boolean) {
  return `text-sm font-semibold transition-colors ${active ? 'text-primary' : 'text-foreground/65 hover:text-primary'}`;
}

function CountBadge({ count, inverted = false }: { count: number; inverted?: boolean }) {
  if (!count) return null;
  return <span className={`absolute -right-0.5 -top-0.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full px-1 text-[10px] font-bold ${inverted ? 'bg-[#C8722E] text-white' : 'bg-[#C8722E] text-white'}`}>{count > 99 ? '99+' : count}</span>;
}

function MobileMenu({ close }: { close: () => void }) {
  const { language } = useStore();
  return <div className="absolute inset-x-0 top-[74px] border-b border-border bg-[#f4ecdf] p-5 shadow-float lg:hidden animate-rise">
    <div className="mb-3 flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-[.18em] text-muted-foreground">{t(language, 'Explore PikaVibe')}</span><button onClick={close} aria-label={t(language, 'Close navigation')} data-testid="button-close-menu"><X size={20} /></button></div>
    <div className="grid gap-1">
      {['Home', 'Shop all', 'Our story', 'Contact', 'Your cart'].map((label) => {
        const href = label === 'Home' ? '/' : label === 'Shop all' ? '/products' : label === 'Our story' ? '/about' : label === 'Contact' ? '/contact' : '/cart';
        return <Link key={href} href={href} onClick={close} className="border-b border-border/60 py-3 font-display text-2xl text-foreground" data-testid={`mobile-link-${label.toLowerCase().replaceAll(' ', '-')}`}>{t(language, label)}</Link>;
      })}
    </div>
  </div>;
}

function Footer() {
  const { language, storeSettings } = useStore();
  return <footer className="mt-20 bg-[#3D2A1E] px-4 pb-8 pt-14 text-[#E8DFD0] sm:px-6 lg:px-8">
    <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.5fr_1fr_1fr_1.3fr]">
      <div><div className="flex items-center gap-3"><img src={storeSettings.logoUrl || logo} alt={`${storeSettings.storeName} logo`} className="h-12 w-12 rounded-full object-cover" /><span className="font-display text-3xl">{storeSettings.storeName}</span></div><p className="mt-5 max-w-xs text-sm leading-6 text-[#d5c6b4]">{language === 'ar' ? 'أشياء مدروسة لطريقة طبخك وتنظيفك ولمّ شمل عائلتك وصنع بيتك في كينيا.' : 'Thoughtful things for the way you cook, clean, gather and make a home in Kenya.'}</p></div>
      <div><h3 className="mb-4 text-xs font-bold uppercase tracking-[.18em] text-[#d9a77d]">{t(language, 'Shop')}</h3><div className="grid gap-3 text-sm text-[#d5c6b4]"><Link href="/products" className="hover:text-white" data-testid="footer-link-shop">{t(language, 'All products')}</Link><Link href="/products?category=Cookware" className="hover:text-white" data-testid="footer-link-cookware">{categoryLabel(language, 'Cookware')}</Link><Link href="/products?category=Storage" className="hover:text-white" data-testid="footer-link-storage">{categoryLabel(language, 'Storage')}</Link><Link href="/products?category=Cleaning" className="hover:text-white" data-testid="footer-link-cleaning">{categoryLabel(language, 'Cleaning')}</Link></div></div>
      <div><h3 className="mb-4 text-xs font-bold uppercase tracking-[.18em] text-[#d9a77d]">{storeSettings.storeName}</h3><div className="grid gap-3 text-sm text-[#d5c6b4]"><Link href="/about" className="hover:text-white" data-testid="footer-link-about">{t(language, 'Our story')}</Link><Link href="/contact" className="hover:text-white" data-testid="footer-link-contact">{t(language, 'Contact us')}</Link><a href={whatsappUrl(language === 'ar' ? 'مرحباً بيكاڤايب!' : 'Hello PikaVibe!')} target="_blank" rel="noreferrer" className="hover:text-white" data-testid="footer-link-whatsapp">{t(language, 'WhatsApp support')}</a></div></div>
      <div><h3 className="mb-4 text-xs font-bold uppercase tracking-[.18em] text-[#d9a77d]">{t(language, 'Stay in the loop')}</h3><p className="mb-4 text-sm leading-6 text-[#d5c6b4]">{t(language, 'New drops, useful kitchen notes and the occasional good idea.')}</p><form onSubmit={(event) => { event.preventDefault(); }} className="flex border-b border-[#92745c] pb-2"><input type="email" placeholder={t(language, 'Your email address')} className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#aa927d]" aria-label={t(language, 'Your email address')} data-testid="input-newsletter-email" /><button type="submit" aria-label={language === 'ar' ? 'اشتراك' : 'Subscribe'} className="text-[#e9b98b]" data-testid="button-newsletter-submit"><Send size={17} /></button></form></div>
    </div>
    <div className="mx-auto mt-12 flex max-w-7xl flex-col justify-between gap-3 border-t border-[#604b3a] pt-6 text-xs text-[#aa927d] sm:flex-row"><span>© 2025 {storeSettings.storeName}. {t(language, 'Made for Kenyan homes.')}</span><span className="flex items-center gap-4"><Instagram size={14} /> {t(language, 'Nairobi · Kenya')}</span></div>
  </footer>;
}

function HomePage() {
  const { addToCart, wishlist, toggleWishlist, language, products } = useStore();
  const bestsellers = products.filter((product) => product.isBestSeller).slice(0, 4).map((product) => localizedProduct(product, language));
  const offers = products.filter((product) => product.inStock && Number(product.discount || 0) > 0).slice(0, 4).map((product) => localizedProduct(product, language));
  return <div>
    <section className="relative overflow-hidden bg-[#ead9c0]">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-14 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:grid-cols-[.9fr_1.1fr] lg:px-8 lg:pb-24 lg:pt-20">
        <div className="relative z-10 animate-rise">
          <div className="mb-6 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[.2em] text-primary"><span className="h-px w-9 bg-primary" />{language === 'ar' ? 'أشياء جميلة لكل يوم' : 'The home of good everyday things'}</div>
          <h1 className="max-w-xl font-display text-[clamp(3.5rem,8vw,7.4rem)] leading-[.88] tracking-[-.065em] text-[#3D2A1E]">{language === 'ar' ? <>افسح مكاناً لـ <em className="text-primary">الأفضل</em>.</> : <>Make room for <em className="text-primary">better</em>.</>}</h1>
          <p className="mt-7 max-w-md text-base leading-7 text-[#654c3d] sm:text-lg">{language === 'ar' ? 'أدوات مطبخ وبيت مختارة لتجعل تفاصيل يومك أقرب إليك.' : 'Kitchenware and home tools chosen to make daily rituals feel a little more yours.'}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3"><Link href="/products" className="inline-flex items-center gap-3 rounded-full bg-[#C8722E] px-6 py-3.5 text-sm font-bold text-[#fff8ef] shadow-soft transition-transform hover:-translate-y-0.5" data-testid="hero-shop-button">{language === 'ar' ? 'تسوق المجموعة' : 'Shop the collection'} <ArrowRight size={17} /></Link><Link href="/about" className="rounded-full px-5 py-3.5 text-sm font-bold text-[#3D2A1E] underline decoration-[#c8722e]/40 underline-offset-4 hover:decoration-primary" data-testid="hero-story-link">{language === 'ar' ? 'لماذا بيكاڤايب؟' : 'Why PikaVibe?'}</Link></div>
          <div className="mt-12 flex items-center gap-5 text-xs font-semibold text-[#765e4c]"><span className="flex items-center gap-2"><Truck size={16} className="text-primary" /> {language === 'ar' ? 'توصيل داخل نيروبي' : 'Nairobi delivery'}</span><span className="flex items-center gap-2"><ShieldCheck size={16} className="text-primary" /> {language === 'ar' ? 'محبوب محلياً' : 'Loved locally'}</span></div>
        </div>
        <div className="relative min-h-[390px] animate-rise [animation-delay:120ms] sm:min-h-[500px]">
          <div className="absolute right-[3%] top-[3%] h-[85%] w-[82%] rotate-3 overflow-hidden rounded-[48%_48%_18%_18%] bg-[#d17b48] shadow-float"><img src="https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=1000&q=85" alt="Warm kitchen with a wooden spoon and fresh ingredients" className="h-full w-full object-cover mix-blend-multiply opacity-90" /></div>
          <div className="absolute bottom-0 left-0 w-48 rotate-[-8deg] rounded-[2rem] border-8 border-[#f4ecdf] bg-[#c5a46d] p-2 shadow-float sm:w-60"><img src="https://images.unsplash.com/photo-1556909212-d5b604d0c90d?auto=format&fit=crop&w=600&q=85" alt="Cast iron skillet" className="aspect-square w-full rounded-[1.4rem] object-cover" /></div>
          <div className="animate-drift absolute right-0 top-12 flex h-24 w-24 items-center justify-center rounded-full bg-[#f4ecdf] text-center shadow-soft sm:h-32 sm:w-32"><div><span className="block font-display text-3xl text-primary">local</span><span className="text-[10px] font-bold uppercase tracking-widest text-[#3D2A1E]">by choice</span></div></div>
        </div>
      </div>
      <div className="pointer-events-none absolute -bottom-16 -left-10 font-display text-[180px] leading-none text-[#d8b990]/30">P</div>
    </section>
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div className="mb-8 flex items-end justify-between gap-4"><div><p className="mb-2 text-xs font-bold uppercase tracking-[.2em] text-primary">{language === 'ar' ? 'بداية جميلة' : 'A good place to start'}</p><h2 className="font-display text-4xl tracking-[-.04em] sm:text-5xl">{language === 'ar' ? 'تسوق حسب الإيقاع' : 'Shop by rhythm'}</h2></div><Link href="/products" className="hidden items-center gap-2 text-sm font-bold text-primary sm:flex" data-testid="categories-view-all">{language === 'ar' ? 'شاهد الكل' : 'See everything'} <ArrowRight size={16} /></Link></div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5">{[['Cookware', 'For the lovely mess', 'photo-1556911220-bff31c812dba'], ['Storage', 'Put things in their place', 'photo-1583947215259-38e31be8751f'], ['Cleaning', 'The reset feels good', 'photo-1581578731548-c64695cc6952'], ['Small Appliances', 'Tiny daily luxuries', 'photo-1570222094114-d054a817e56b']].map(([name, tagline, photoId], index) => <Link href={`/products?category=${encodeURIComponent(name)}`} key={name} className={`group relative min-h-[190px] overflow-hidden rounded-2xl ${index % 2 === 0 ? 'bg-[#c98755]' : 'bg-[#a98c70]'} sm:min-h-[250px]`} data-testid={`category-card-${name.toLowerCase().replaceAll(' ', '-')}`}><img src={`https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=700&q=85`} alt="" className="absolute inset-0 h-full w-full object-cover mix-blend-multiply opacity-75 transition-transform duration-500 group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-[#3d2a1e]/75 via-transparent to-transparent" /><div className="absolute bottom-4 left-4 text-[#fff8ef] sm:bottom-5 sm:left-5"><h3 className="font-display text-2xl leading-none sm:text-3xl">{categoryLabel(language, name)}</h3><p className="mt-1 text-xs text-[#f0ddc6] sm:text-sm">{language === 'ar' ? ({ Cookware: 'للفوضى الجميلة', Storage: 'ضع كل شيء في مكانه', Cleaning: 'الترتيب يجعلك أفضل', 'Small Appliances': 'رفاهية يومية صغيرة' } as Record<string, string>)[name] : tagline}</p></div></Link>)}</div>
    </section>
    {offers.length > 0 && <section className="bg-[#fff0df] px-4 py-14 sm:px-6 lg:px-8 lg:py-20"><div className="mx-auto max-w-7xl"><div className="mb-8 flex items-end justify-between gap-4"><div><p className="mb-2 text-xs font-bold uppercase tracking-[.2em] text-primary">{language === 'ar' ? 'لفترة محدودة' : 'Limited time'}</p><h2 className="font-display text-4xl tracking-[-.04em] sm:text-5xl">{language === 'ar' ? 'العروض والخصومات' : 'Offers & discounts'}</h2></div><Link href="/products?sort=offers" className="hidden items-center gap-2 text-sm font-bold text-primary sm:flex">{t(language, 'Shop all')} <ArrowRight size={16} /></Link></div><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{offers.map((product) => <ProductCard key={product.id} product={product} wished={wishlist.includes(product.id)} onWishlist={() => toggleWishlist(product.id)} onAdd={() => addToCart(product.id)} />)}</div></div></section>}
    <section className="bg-[#f0e6d7] px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-7xl"><div className="mb-8 flex items-end justify-between gap-4"><div><p className="mb-2 text-xs font-bold uppercase tracking-[.2em] text-primary">{language === 'ar' ? 'منتجات يعود إليها الناس' : 'The ones people come back for'}</p><h2 className="font-display text-4xl tracking-[-.04em] sm:text-5xl">{language === 'ar' ? 'المفضلة' : 'Customer favourites'}</h2></div><Link href="/products" className="hidden items-center gap-2 text-sm font-bold text-primary sm:flex" data-testid="bestsellers-view-all">{t(language, 'Shop all')} <ArrowRight size={16} /></Link></div><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{bestsellers.map((product) => <ProductCard key={product.id} product={product} wished={wishlist.includes(product.id)} onWishlist={() => toggleWishlist(product.id)} onAdd={() => addToCart(product.id)} />)}</div></div>
    </section>
    <section className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[1.2fr_.8fr] lg:px-8 lg:py-24">
      <div className="rounded-[2rem] bg-[#3D2A1E] p-8 text-[#f4ecdf] sm:p-12"><Sparkles className="mb-8 text-[#e9b98b]" size={27} /><h2 className="max-w-lg font-display text-4xl leading-[1] tracking-[-.04em] sm:text-6xl">The everyday deserves a point of view.</h2><p className="mt-6 max-w-md text-sm leading-6 text-[#d5c6b4]">We look for the sturdy, the useful and the unexpectedly beautiful — from makers and objects that make sense in a Kenyan home.</p><Link href="/about" className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-[#e9b98b] underline underline-offset-4" data-testid="home-story-button">Meet the people behind the picks <ArrowRight size={16} /></Link></div>
      <div className="relative overflow-hidden rounded-[2rem] bg-[#d9b37a] p-8 sm:p-12"><div className="relative z-10"><span className="text-6xl text-[#3d2a1e]">“</span><p className="mt-1 font-display text-3xl leading-tight text-[#3d2a1e]">A kitchen should feel like somewhere you want to be.</p><p className="mt-6 text-xs font-bold uppercase tracking-[.16em] text-[#76563d]">— PikaVibe note</p></div><div className="absolute -bottom-20 -right-12 h-64 w-64 rounded-full border-[22px] border-[#c58951]/50" /></div>
    </section>
  </div>;
}

function InstallmentInfo({ product, language, className = '' }: { product: Product; language: Language; className?: string }) {
  const { installmentPlans } = useStore();
  if (!product.installmentAvailable || !product.installmentMinMonths || !product.installmentMaxMonths) return null;
  const activePlans = installmentPlans?.filter((p) => p.active) || [];
  if (activePlans.length === 0) return null;
  const minMonths = Math.min(product.installmentMinMonths, product.installmentMaxMonths);
  const maxMonths = Math.max(product.installmentMinMonths, product.installmentMaxMonths);
  return <p className={`text-xs font-semibold text-[#26754d] ${className}`}>{language === 'ar' ? `متاح بالتقسيط من ${minMonths} إلى ${maxMonths} شهور` : `Installments available from ${minMonths} to ${maxMonths} months`}</p>;
}

function ProductCard({ product, wished, onWishlist, onAdd }: { product: Product; wished: boolean; onWishlist: () => void; onAdd: () => void }) {
  const { language, cart } = useStore();
  const inCart = cart.find((item) => item.id === product.id)?.quantity ?? 0;
  const canAdd = product.inStock && inCart < product.stock;
  const [added, setAdded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const handleAdd = () => {
    if (added || !canAdd) return;
    setAdded(true);
    onAdd();
    window.setTimeout(() => setAdded(false), 1100);
  };
  const stockStatus = product.stock <= 5 ? `Only ${product.stock} left` : product.stock <= 10 ? 'Low stock' : 'In stock';
  return <article className="group min-w-0" data-testid={`card-product-${product.id}`}>
    <div className="relative aspect-[.92] overflow-hidden rounded-2xl bg-[#e4d6c4]">
      <Link href={`/products/${product.id}`} data-testid={`link-product-${product.id}`}>
        {imageError ? (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <span className="text-muted-foreground">Image not available</span>
          </div>
        ) : (
          <img 
            src={product.image} 
            alt={product.name} 
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.045]"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        )}
      </Link>
      {!product.inStock && <div className="absolute inset-0 flex items-center justify-center bg-[#3D2A1E]/45"><span className="rounded-full bg-[#f4ecdf] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#8f3025]">{language === 'ar' ? 'نفد المخزون' : 'Out of stock'}</span></div>}
      <div className="absolute left-3 top-3 flex gap-1.5">
        {product.isNew && <span className="rounded-full bg-[#f4ecdf] px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-[#3D2A1E]">{t(language, 'New')}</span>}
        {product.discount && <span className="rounded-full bg-[#C8722E] px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white">-{product.discount}%</span>}
      </div>
      <button 
        onClick={onWishlist} 
        className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#f4ecdf]/90 text-[#3D2A1E] backdrop-blur-sm transition-transform hover:scale-110" 
        aria-label={wished ? `${language === 'ar' ? 'إزالة' : 'Remove'} ${product.name}` : `${language === 'ar' ? 'إضافة' : 'Add'} ${product.name}`} 
        data-testid={`button-wishlist-${product.id}`}
      >
        <Heart size={17} fill={wished ? '#C8722E' : 'none'} color={wished ? '#C8722E' : 'currentColor'} />
      </button>
      <button 
        onClick={handleAdd} 
        disabled={!canAdd || added} 
        className={`absolute bottom-3 left-3 right-3 flex translate-y-2 items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold shadow-soft transition-all group-hover:translate-y-0 group-hover:opacity-100 disabled:cursor-not-allowed ${added ? 'bg-[#2E9B68] text-white opacity-100 translate-y-0' : 'bg-[#f4ecdf] text-[#3D2A1E] opacity-0 disabled:opacity-60'}`} 
        data-testid={`button-add-${product.id}`}
      >
        {added ? <><Check size={15} /> {t(language, 'Added to cart')}</> : <><Plus size={15} /> {canAdd ? t(language, 'Add to cart') : t(language, 'Out of stock')}</>}
      </button>
    </div>
    <div className="pt-4">
      <div className="mb-1 flex items-center justify-between gap-3">
        <span className="text-[10px] font-bold uppercase tracking-[.16em] text-primary">{categoryLabel(language, product.category)}</span>
        <span className="flex items-center gap-1 text-xs">
          <Star size={13} fill="#D89B43" color="#D89B43" /> {product.rating}
        </span>
      </div>
      <Link href={`/products/${product.id}`} className="mb-2 block font-display text-lg leading-tight hover:text-primary" data-testid={`card-product-name-${product.id}`}>
        {product.name}
      </Link>
      <div className="flex items-center justify-between gap-3">
        <span className="font-bold">{money(product.price, language)}</span>
        {product.oldPrice && <del className="text-xs text-muted-foreground">{money(product.oldPrice, language)}</del>}
      </div>
      <InstallmentInfo product={product} language={language} className="mt-2" />
      <p className={`mt-1 text-xs ${product.inStock ? (product.stock <= 5 ? 'text-destructive' : product.stock <= 10 ? 'text-yellow-600' : 'text-green-600') : 'font-bold text-destructive'}`}>
        {product.inStock ? stockStatus : (language === 'ar' ? 'نفد المخزون' : 'Out of stock')}
      </p>
    </div>
  </article>;
}

function ProductsPage() {
  const [location, setLocation] = useLocation();
  const params = new URLSearchParams(location.split('?')[1] || '');
  const [query, setQuery] = useState(params.get('q') || '');
  const [category, setCategory] = useState(params.get('category') || 'All');
  const [sort, setSort] = useState('featured');
  const [mobileFilters, setMobileFilters] = useState(false);
  const { addToCart, wishlist, toggleWishlist, language, products, categories } = useStore();
  const filtered = useMemo(() => {
    const matches = products.filter((product) => {
      const visible = localizedProduct(product, language);
      return (category === 'All' || product.category === category)
        && `${visible.name} ${visible.category}`.toLowerCase().includes(query.toLowerCase())
        && (params.get('wishlist') !== 'true' || wishlist.includes(product.id));
    });
    return [...matches].filter((product) => sort !== 'offers' || Number(product.discount || 0) > 0).sort((a, b) => sort === 'price-low' ? a.price - b.price : sort === 'price-high' ? b.price - a.price : sort === 'newest' ? Number(Boolean(b.isNew)) - Number(Boolean(a.isNew)) : sort === 'offers' ? Number(b.discount || 0) - Number(a.discount || 0) : Number(Boolean(b.isBestSeller)) - Number(Boolean(a.isBestSeller)));
  }, [category, params, query, sort, wishlist, language]);
  const updateCategory = (value: string) => { setCategory(value); setLocation(`/products${value === 'All' ? '' : `?category=${encodeURIComponent(value)}`}`); };
  return <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
    <div className="mb-10 max-w-2xl"><p className="mb-3 text-xs font-bold uppercase tracking-[.2em] text-primary">{t(language, 'The PikaVibe edit')}</p><h1 className="font-display text-5xl tracking-[-.055em] sm:text-7xl">{language === 'ar' ? <>مفيد، جميل، <em className="text-primary">مختار بعناية.</em></> : <>Useful, beautiful, <em className="text-primary">well chosen.</em></>}</h1><p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground">{t(language, 'Good things for kitchens, bathrooms and all the in-between moments of home.')}</p></div>
    <div className="mb-7 flex flex-col gap-3 border-y border-border py-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><button onClick={() => setMobileFilters((open) => !open)} className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold lg:hidden" data-testid="button-mobile-filters"><SlidersHorizontal size={15} /> {t(language, 'Filters')}</button><div className={`${mobileFilters ? 'flex' : 'hidden'} flex-wrap gap-2 lg:flex`}>{categories.map((item) => <button key={item} onClick={() => updateCategory(item)} className={`rounded-full px-4 py-2 text-xs font-bold transition-colors ${category === item ? 'bg-[#3D2A1E] text-[#f4ecdf]' : 'bg-secondary text-muted-foreground hover:bg-[#d8c7b3]'}`} data-testid={`filter-category-${item.toLowerCase().replaceAll(' ', '-')}`}>{categoryLabel(language, item)}</button>)}</div></div><div className="flex items-center gap-3"><span className="text-xs text-muted-foreground">{filtered.length} {t(language, filtered.length === 1 ? 'piece' : 'pieces')}</span><label className="relative"><span className="sr-only">{language === 'ar' ? 'ترتيب المنتجات' : 'Sort products'}</span><select value={sort} onChange={(event) => setSort(event.target.value)} className="appearance-none rounded-full border border-border bg-transparent py-2 pl-4 pr-9 text-xs font-bold outline-none focus:ring-2 focus:ring-primary" data-testid="select-sort-products"><option value="featured">{t(language, 'Featured first')}</option><option value="newest">{t(language, 'Newest first')}</option><option value="price-low">{t(language, 'Price: low to high')}</option><option value="price-high">{t(language, 'Price: high to low')}</option><option value="offers">{language === 'ar' ? 'العروض والخصومات' : 'Offers & discounts'}</option></select><ChevronDown size={14} className="pointer-events-none absolute right-3 top-2.5" /></label></div></div>
    <div className="relative mb-8"><Search className="absolute left-4 top-3.5 text-muted-foreground" size={18} /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t(language, 'Search by name or category...')} className="w-full rounded-2xl border border-border bg-card py-3.5 pl-12 pr-4 text-sm outline-none transition-shadow focus:ring-2 focus:ring-primary" aria-label={t(language, 'Search products')} data-testid="input-search-products" /></div>
    {filtered.length ? <div className="grid grid-cols-2 gap-x-3 gap-y-9 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4">{filtered.map((product) => <ProductCard key={product.id} product={localizedProduct(product, language)} wished={wishlist.includes(product.id)} onWishlist={() => toggleWishlist(product.id)} onAdd={() => addToCart(product.id)} />)}</div> : <EmptyState title={t(language, 'Nothing in that corner yet.')} body={t(language, 'Try a different search or clear the filters to see the full edit.')} action={t(language, 'Clear filters')} onAction={() => { setQuery(''); updateCategory('All'); }} />}
  </div>;
}

function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const { addToCart, cart, wishlist, toggleWishlist, language, products, installmentPlans } = useStore();
  const product = products.find((item) => item.id === id);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [added, setAdded] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState('');
  const [showInstallmentModal, setShowInstallmentModal] = useState(false);
  if (!product) return <NotFoundPage />;
  const visibleProduct = localizedProduct(product, language);
  const inCart = cart.filter((item) => item.id === product.id).reduce((sum, item) => sum + item.quantity, 0);
  const availableStock = Math.max(0, product.stock - inCart);
  const canAdd = product.inStock && availableStock > 0;
  const related = products.filter((item) => item.category === product.category && item.id !== product.id).slice(0, 3).map((item) => localizedProduct(item, language));
  const handleAdd = () => {
    if (added || !canAdd) return;
    setAdded(true);
    addToCart(product.id, Math.min(quantity, availableStock), selectedVariant || undefined);
    window.setTimeout(() => setAdded(false), 1200);
  };
  return <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-14">
    <Link href="/products" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary" data-testid="link-back-products"><ChevronLeft size={16} /> {t(language, 'Back to shop')}</Link>
    <div className="grid gap-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-16">
       <div className="flex flex-col-reverse gap-3 sm:flex-row"><div className="flex gap-3 sm:w-20 sm:flex-col">{visibleProduct.images.map((image, index) => <button key={image} onClick={() => setActiveImage(index)} className={`aspect-square w-16 overflow-hidden rounded-xl border-2 sm:w-20 ${index === activeImage ? 'border-primary' : 'border-transparent opacity-65'}`} aria-label={`${language === 'ar' ? 'عرض صورة المنتج' : 'Show product image'} ${index + 1}`} data-testid={`button-product-image-${index}`}><img src={image} alt="" className="h-full w-full object-cover" /></button>)}</div><div className="relative aspect-square min-w-0 flex-1 overflow-hidden rounded-[2rem] bg-secondary"><img src={visibleProduct.images[activeImage]} alt={visibleProduct.name} className="h-full w-full object-cover transition-opacity duration-300" /><div className="absolute left-5 top-5 flex gap-2">{product.isNew && <span className="rounded-full bg-[#f4ecdf] px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest">{t(language, 'New arrival')}</span>}{product.discount && <span className="rounded-full bg-primary px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white">{language === 'ar' ? `وفر ${product.discount}%` : `Save ${product.discount}%`}</span>}</div></div></div>
       <div className="flex flex-col justify-center"><div className="mb-3 flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-[.18em] text-primary">{categoryLabel(language, visibleProduct.category)}</span><button onClick={() => toggleWishlist(product.id)} className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary" data-testid="button-product-wishlist"><Heart size={18} fill={wishlist.includes(product.id) ? '#C8722E' : 'none'} color={wishlist.includes(product.id) ? '#C8722E' : 'currentColor'} /> {wishlist.includes(product.id) ? t(language, 'Saved') : t(language, 'Save for later')}</button></div><h1 className="font-display text-5xl leading-[.95] tracking-[-.055em] sm:text-6xl">{visibleProduct.name}</h1><div className="mt-5 flex items-center gap-4"><span className="text-xl font-bold">{money(product.price, language)}</span>{product.oldPrice && <del className="text-sm text-muted-foreground">{money(product.oldPrice, language)}</del>}<span className="flex items-center gap-1 border-l border-border pl-4 text-sm"><Star size={15} fill="#D89B43" color="#D89B43" /> {product.rating} <span className="text-muted-foreground">/ 5</span></span></div><button onClick={() => setShowInstallmentModal(true)} className="mt-3 w-full rounded-xl bg-[#26754d] px-4 py-2.5 text-sm font-bold text-[#fff8ef] transition-colors hover:bg-[#1f5c3d]">{language === 'ar' ? 'احسب التقسيط' : 'Calculate Installments'}</button><InstallmentInfo product={product} language={language} className="mt-4 rounded-xl bg-[#d7efdf] px-4 py-3" /><p className="mt-7 max-w-lg text-base leading-7 text-muted-foreground">{visibleProduct.description}</p>{product.variants?.map((variant) => <label key={variant.name} className="mt-6 grid gap-2 text-xs font-bold uppercase tracking-[.12em]">{variant.name}<select value={selectedVariant} onChange={(event) => setSelectedVariant(event.target.value)} className="rounded-xl border border-border bg-card px-4 py-3 text-sm font-normal normal-case tracking-normal outline-none focus:ring-2 focus:ring-primary"><option value="">{language === 'ar' ? 'اختر خياراً' : 'Choose an option'}</option>{variant.options.map((option) => <option key={option} value={`${variant.name}: ${option}`}>{option}</option>)}</select></label>)}<div className="my-8 border-y border-border py-6"><h2 className="mb-4 text-xs font-bold uppercase tracking-[.18em] text-muted-foreground">{t(language, 'Details')}</h2><ul className="grid gap-3 text-sm text-foreground sm:grid-cols-2">{visibleProduct.specifications.map((spec) => <li key={spec} className="flex items-start gap-2"><Check size={16} className="mt-0.5 shrink-0 text-primary" />{spec}</li>)}</ul></div><div className="flex flex-col gap-3 sm:flex-row"><div className="flex h-12 items-center justify-between rounded-xl border border-border bg-card sm:w-36"><button onClick={() => setQuantity((value) => Math.max(1, value - 1))} disabled={!canAdd} className="flex h-full w-11 items-center justify-center text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50" aria-label={language === 'ar' ? 'تقليل الكمية' : 'Decrease quantity'} data-testid="button-decrease-quantity"><Minus size={16} /></button><span className="text-sm font-bold" data-testid="text-product-quantity">{Math.min(quantity, Math.max(1, availableStock))}</span><button onClick={() => setQuantity((value) => Math.min(availableStock, value + 1))} disabled={!canAdd || quantity >= availableStock} className="flex h-full w-11 items-center justify-center text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50" aria-label={language === 'ar' ? 'زيادة الكمية' : 'Increase quantity'} data-testid="button-increase-quantity"><Plus size={16} /></button></div><button onClick={handleAdd} disabled={!canAdd || added} className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-xl px-6 text-sm font-bold text-primary-foreground transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 ${added ? 'bg-[#2E9B68]' : 'bg-primary'}`} data-testid="button-product-add-to-cart">{added ? <><Check size={18} /> {t(language, 'Added to cart')}</> : <><ShoppingBag size={18} /> {canAdd ? t(language, 'Add to cart') : t(language, 'Out of stock')}</>}</button></div><p className="mt-4 flex items-center gap-2 text-xs font-semibold text-muted-foreground"><Truck size={15} className="text-primary" /> {canAdd ? `${t(language, 'In stock')} · ${availableStock} ${t(language, availableStock === 1 ? 'piece' : 'pieces')} ${t(language, 'available')}` : t(language, 'Out of stock')}</p></div>
    </div>
    <div className="mt-20 border-t border-border pt-12"><div className="mb-8 flex items-end justify-between"><div><p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-primary">{t(language, 'More to consider')}</p><h2 className="font-display text-4xl">{t(language, 'From the same shelf')}</h2></div><div className="hidden gap-2 sm:flex"><button className="flex h-9 w-9 items-center justify-center rounded-full border border-border" data-testid="button-related-previous"><ChevronLeft size={16} /></button><button className="flex h-9 w-9 items-center justify-center rounded-full border border-border" data-testid="button-related-next"><ChevronRight size={16} /></button></div></div><div className="grid grid-cols-2 gap-4 sm:grid-cols-3">{related.map((item) => <ProductCard key={item.id} product={item} wished={wishlist.includes(item.id)} onWishlist={() => toggleWishlist(item.id)} onAdd={() => addToCart(item.id)} />)}</div></div>
    {showInstallmentModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowInstallmentModal(false)}>
        <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#f4ecdf] p-6 shadow-soft" onClick={(e) => e.stopPropagation()}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-2xl">{language === 'ar' ? 'أنظمة التقسيط المتاحة' : 'Available Installment Plans'}</h3>
            <button onClick={() => setShowInstallmentModal(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
          </div>
          {(!installmentPlans || installmentPlans.filter(p => p.active).length === 0) ? (
            <p className="py-6 text-center text-sm text-muted-foreground">{language === 'ar' ? 'لا توجد أنظمة تقسيط متاحة حالياً.' : 'No installment plans currently available.'}</p>
          ) : (
            <div className="grid gap-6">
              {installmentPlans.filter(p => p.active).map(plan => {
                const min = Math.max(plan.minMonths, product.installmentMinMonths || 2);
                const max = Math.min(plan.maxMonths, product.installmentMaxMonths || 6);
                if (min > max) return null;
                const monthsOptions = [];
                for (let m = min; m <= max; m++) monthsOptions.push(m);
                
                return (
                  <div key={plan.id} className="rounded-xl border border-[#d1b99c] bg-white p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <h4 className="font-bold text-lg text-primary">{language === 'ar' && plan.providerNameAr ? plan.providerNameAr : plan.providerName}</h4>
                      {plan.interestRate > 0 && <span className="text-xs font-semibold text-muted-foreground">{language === 'ar' ? `فائدة ${plan.interestRate}%` : `${plan.interestRate}% Interest`}</span>}
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {monthsOptions.map((months) => {
                        const totalWithInterest = product.price * (1 + (plan.interestRate / 100));
                        const monthlyPayment = (totalWithInterest / months).toFixed(2);
                        return (
                          <div key={months} className="rounded-xl border border-border bg-[#f7efe4] p-3 text-center">
                            <div className="text-xl font-bold text-primary">{months}</div>
                            <div className="text-[10px] text-muted-foreground">{language === 'ar' ? 'شهر' : 'months'}</div>
                            <div className="mt-1 text-sm font-semibold">{money(Number(monthlyPayment), language)}</div>
                            <div className="text-[10px] text-muted-foreground">{language === 'ar' ? 'شهرياً' : '/month'}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <button onClick={() => setShowInstallmentModal(false)} className="mt-6 w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90">
            {language === 'ar' ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    )}
  </div>;
}

function CartPage() {
  // ... rest of the code remains the same ...
  const [, setLocation] = useLocation();
  const { cart, updateQuantity, removeFromCart, language, products } = useStore();
  const items = cart.map((item) => ({ ...item, product: products.find((product) => product.id === item.id) })).filter((item): item is CartItem & { product: Product } => Boolean(item.product));
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  return <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16"><div className="mb-10"><p className="mb-3 text-xs font-bold uppercase tracking-[.2em] text-primary">{t(language, 'Your shortlist')}</p><h1 className="font-display text-5xl tracking-[-.05em] sm:text-7xl">{t(language, 'Your cart.')}</h1></div>{items.length ? <div className="grid gap-8 lg:grid-cols-[1fr_360px]"><div className="divide-y divide-border border-y border-border">{items.map(({ product, quantity, variant }) => { const visible = localizedProduct(product, language); return <div key={`${product.id}-${variant || ''}`} className="flex gap-4 py-5 sm:gap-6"><Link href={`/products/${product.id}`} className="h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-secondary sm:h-36 sm:w-36" data-testid={`cart-product-image-${product.id}`}><img src={product.image} alt={visible.name} className="h-full w-full object-cover" /></Link><div className="flex min-w-0 flex-1 flex-col justify-between py-1"><div><div className="mb-1 flex items-start justify-between gap-3"><div><span className="text-[10px] font-bold uppercase tracking-[.14em] text-primary">{categoryLabel(language, visible.category)}</span><Link href={`/products/${product.id}`} className="mt-1 block font-display text-xl leading-tight hover:text-primary" data-testid={`cart-product-name-${product.id}`}>{visible.name}</Link>{variant && <span className="mt-1 block text-xs text-muted-foreground">{variant}</span>}</div><button onClick={() => removeFromCart(product.id, variant)} className="text-muted-foreground hover:text-destructive" aria-label={language === 'ar' ? `إزالة ${visible.name}` : `Remove ${visible.name}`} data-testid={`button-remove-${product.id}`}><Trash2 size={17} /></button></div><span className="text-sm font-bold">{money(product.price, language)}</span><InstallmentInfo product={product} language={language} className="mt-1" /></div><div className="flex items-end justify-between"><div className="flex h-9 items-center rounded-lg border border-border"><button onClick={() => updateQuantity(product.id, quantity - 1, variant)} className="flex h-full w-9 items-center justify-center text-muted-foreground hover:text-foreground" aria-label={language === 'ar' ? 'تقليل الكمية' : 'Decrease item quantity'} data-testid={`button-cart-decrease-${product.id}`}><Minus size={14} /></button><span className="min-w-6 text-center text-xs font-bold" data-testid={`text-cart-quantity-${product.id}`}>{quantity}</span><button onClick={() => updateQuantity(product.id, quantity + 1, variant)} className="flex h-full w-9 items-center justify-center text-muted-foreground hover:text-foreground" aria-label={language === 'ar' ? 'زيادة الكمية' : 'Increase item quantity'} data-testid={`button-cart-increase-${product.id}`}><Plus size={14} /></button></div><span className="text-right text-sm font-bold" data-testid={`text-cart-line-total-${product.id}`}>{language === 'ar' ? 'الإجمالي: ' : 'Total: '}{money(product.price * quantity, language)}</span></div></div></div>; })}</div><aside className="h-fit rounded-2xl bg-[#3D2A1E] p-6 text-[#f4ecdf] sm:p-8 lg:sticky lg:top-28"><h2 className="font-display text-3xl">{t(language, 'A good choice.')}</h2><div className="mt-6 space-y-3 border-b border-[#614b3a] pb-6 text-sm"><div className="flex justify-between"><span className="text-[#cdbbab]">{t(language, 'Subtotal')}</span><span className="font-bold" data-testid="text-cart-subtotal">{money(subtotal, language)}</span></div><div className="flex justify-between"><span className="text-[#cdbbab]">{t(language, 'Delivery')}</span><span className="font-bold text-[#e9b98b]">{t(language, 'Confirmed on WhatsApp')}</span></div></div><div className="flex justify-between py-5 text-lg font-bold"><span>{t(language, 'Total')}</span><span data-testid="text-cart-total">{money(subtotal, language)}</span></div><Link href="/checkout" className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#2E9B68] text-sm font-bold text-white transition-transform hover:-translate-y-0.5" data-testid="link-whatsapp-checkout"><MessageCircle size={18} /> {t(language, 'Continue to checkout')}</Link><p className="mt-4 text-center text-xs leading-5 text-[#bfae9e]">{t(language, "We'll confirm your delivery address, timing and payment options in the chat.")}</p></aside></div> : <EmptyState icon={<ShoppingBag size={25} />} title={t(language, 'Your cart is waiting for a good idea.')} body={t(language, 'Save something useful here, then come back when you’re ready.')} action={t(language, 'Browse the shop')} onAction={() => setLocation('/products')} />}</div>;
}

function CheckoutPage() {
  const [, setLocation] = useLocation();
  const { cart, language, clearCart, products, installmentPlans } = useStore();
  const items = cart.map((item) => ({ ...item, product: products.find((product) => product.id === item.id) })).filter((item): item is CartItem & { product: Product } => Boolean(item.product));
  const [form, setForm] = useState<CustomerInfo>({ name: '', idNumber: '', phone: '', governorate: '', city: '', address: '', notes: '', paymentMethod: 'cod', paymentDay: '' });
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponMessage, setCouponMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [checkingCoupon, setCheckingCoupon] = useState(false);
  
  // Installment state
  const [selectedPlanId, setSelectedPlanId] = useState<number | ''>('');
  const [selectedMonths, setSelectedMonths] = useState<number | ''>('');
  
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const couponDiscount = appliedCoupon?.discount ?? 0;
  const discount = couponDiscount;
  const shipping = subtotal >= 5000 ? 0 : 250;
  const total = Math.max(0, subtotal - couponDiscount + shipping);
  
  const canInstallment = items.some(item => item.product.installmentAvailable) && (installmentPlans?.filter(p => p.active).length || 0) > 0;
  const selectedPlan = installmentPlans?.find(p => p.id === Number(selectedPlanId));
  const installmentMonthlyPayment = selectedPlan && selectedMonths ? ((total * (1 + (selectedPlan.interestRate / 100))) / Number(selectedMonths)) : 0;


  if (!items.length) {
    return <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8"><EmptyState icon={<ShoppingBag size={25} />} title={t(language, 'Your cart is waiting for a good idea.')} body={t(language, 'Save something useful here, then come back when youâ€™re ready.')} action={t(language, 'Browse the shop')} onAction={() => setLocation('/products')} /></div>;
  }

  const applyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    setCheckingCoupon(true); setCouponMessage('');
    try {
      const result = await validateCoupon(code, subtotal);
      setAppliedCoupon({ code: result.code, discount: result.discount });
      setCouponCode(result.code);
      setCouponMessage(language === 'ar' ? `تم تطبيق الكوبون وتوفير ${money(result.discount, language)}` : `Coupon applied. You saved ${money(result.discount, language)}`);
    } catch (couponError) {
      setAppliedCoupon(null);
      setCouponMessage(couponError instanceof Error ? couponError.message : (language === 'ar' ? 'الكوبون غير صالح أو منتهي.' : 'Coupon is invalid or expired.'));
    } finally { setCheckingCoupon(false); }
  };

  const submitOrder = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (form.name.trim().length < 2 || (form.paymentMethod === 'installment' && form.idNumber.trim().length < 3) || (form.paymentMethod === 'installment' && (!form.paymentDay || form.paymentDay < 1 || form.paymentDay > 28)) || !/^[+()\d\s-]{7,}$/.test(form.phone.trim()) || !form.governorate.trim() || !form.city.trim() || form.address.trim().length < 8) {
      setError(t(language, 'Please complete the required fields.'));
      return;
    }
    setSubmitting(true);
    try {
      const saved = await createOrder({
        customer: { name: form.name.trim(), idNumber: form.paymentMethod === 'installment' ? form.idNumber.trim() : undefined, phone: form.phone.trim(), governorate: form.governorate.trim(), city: form.city.trim(), address: form.address.trim(), notes: form.notes.trim() },
        items: items.map(({ product, quantity, variant }) => ({ productId: product.backendId ?? product.id, quantity, variant })),
        paymentMethod: form.paymentMethod,
        couponCode: appliedCoupon?.code,
        installmentPlanId: form.paymentMethod === 'installment' && selectedPlanId ? Number(selectedPlanId) : undefined,
        installmentMonths: form.paymentMethod === 'installment' && selectedMonths ? Number(selectedMonths) : undefined,
        installmentMonthlyPayment: form.paymentMethod === 'installment' && installmentMonthlyPayment ? installmentMonthlyPayment : undefined,
        installmentPaymentDay: form.paymentMethod === 'installment' && form.paymentDay ? Number(form.paymentDay) : undefined,
      });
      const order: OrderRecord = {
        id: String(saved.id),
        orderNumber: saved.orderNumber,
        createdAt: saved.createdAt,
        customer: form,
        items: cart,
        subtotal: saved.subtotal,
        shipping: saved.shipping,
        discount,
        total: saved.total,
        installmentPlanId: form.paymentMethod === 'installment' && selectedPlanId ? Number(selectedPlanId) : undefined,
        installmentMonths: form.paymentMethod === 'installment' && selectedMonths ? Number(selectedMonths) : undefined,
        installmentMonthlyPayment: form.paymentMethod === 'installment' ? installmentMonthlyPayment : undefined,
        installmentPaymentDay: form.paymentMethod === 'installment' && form.paymentDay ? Number(form.paymentDay) : undefined,
      };
      localStorage.setItem('pikavibe-last-order', JSON.stringify(order));
      clearCart();
      setLocation(`/receipt/${order.id}`);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : '';
      setError(message.includes('stock') ? t(language, 'Some items are no longer available in the requested quantity.') : t(language, 'We could not place the order. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = 'rounded-xl border border-[#d1b99c] bg-[#f7efe4] px-4 py-3.5 text-sm font-normal normal-case tracking-normal outline-none focus:ring-2 focus:ring-primary';
  return <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
    <div className="mb-10"><p className="mb-3 text-xs font-bold uppercase tracking-[.2em] text-primary">{t(language, 'Checkout.')}</p><h1 className="font-display text-5xl tracking-[-.05em] sm:text-7xl">{t(language, 'Checkout.')}</h1><p className="mt-4 max-w-lg text-base leading-7 text-muted-foreground">{t(language, 'A few details, then weâ€™ll take care of the rest.')}</p></div>
    <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
      <form onSubmit={submitOrder} className="rounded-[2rem] bg-[#ead9c0] p-6 sm:p-10" noValidate>
        <h2 className="font-display text-3xl">{t(language, 'Your details')}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t(language, 'Guest checkout â€” no account required.')}</p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <label className="grid gap-2 text-xs font-bold uppercase tracking-[.12em]">{t(language, 'Full name')}<input required minLength={2} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} type="text" className={inputClass} data-testid="input-checkout-name" /></label>
          <label className="grid gap-2 text-xs font-bold uppercase tracking-[.12em]">{t(language, 'Phone number')}<input required value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} type="tel" inputMode="tel" className={inputClass} data-testid="input-checkout-phone" /></label>
          <label className="grid gap-2 text-xs font-bold uppercase tracking-[.12em]">{t(language, 'Governorate')}<input required value={form.governorate} onChange={(event) => setForm({ ...form, governorate: event.target.value })} type="text" className={inputClass} data-testid="input-checkout-governorate" /></label>
          <label className="grid gap-2 text-xs font-bold uppercase tracking-[.12em]">{t(language, 'City')}<input required value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} type="text" className={inputClass} data-testid="input-checkout-city" /></label>
          <label className="grid gap-2 text-xs font-bold uppercase tracking-[.12em] sm:col-span-2">{t(language, 'Full address')}<textarea required minLength={8} value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} rows={3} className={`resize-none ${inputClass}`} data-testid="textarea-checkout-address" /></label>
          {form.paymentMethod === 'installment' && <><label className="grid gap-2 text-xs font-bold uppercase tracking-[.12em]">{language === 'ar' ? 'رقم الهوية' : 'ID number'}<input required value={form.idNumber} onChange={(event) => setForm({ ...form, idNumber: event.target.value })} type="text" className={inputClass} data-testid="input-installment-id" /></label><label className="grid gap-2 text-xs font-bold uppercase tracking-[.12em]">{language === 'ar' ? 'يوم سداد القسط الشهري' : 'Monthly payment day'}<select required value={form.paymentDay} onChange={(event) => setForm({ ...form, paymentDay: Number(event.target.value) })} className={inputClass} data-testid="select-installment-payment-day"><option value="">{language === 'ar' ? 'اختر اليوم' : 'Choose day'}</option>{Array.from({ length: 28 }, (_, index) => index + 1).map((day) => <option key={day} value={day}>{day}</option>)}</select></label></>}
          <label className="grid gap-2 text-xs font-bold uppercase tracking-[.12em] sm:col-span-2">{t(language, 'Additional notes')}<textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} rows={2} className={`resize-none ${inputClass}`} data-testid="textarea-checkout-notes" /></label>
          <div className="sm:col-span-2"><label className="grid gap-2 text-xs font-bold uppercase tracking-[.12em]">{language === 'ar' ? 'كود الخصم' : 'Discount coupon'}<div className="flex gap-2"><input value={couponCode} onChange={(event) => { setCouponCode(event.target.value.toUpperCase()); setAppliedCoupon(null); setCouponMessage(''); }} placeholder={language === 'ar' ? 'مثال: WELCOME10' : 'e.g. WELCOME10'} className={`min-w-0 flex-1 ${inputClass}`} data-testid="input-coupon-code" /><button type="button" onClick={applyCoupon} disabled={checkingCoupon || !couponCode.trim()} className="rounded-xl bg-[#3D2A1E] px-4 py-3 text-xs font-bold text-[#f4ecdf] disabled:opacity-50" data-testid="button-apply-coupon">{checkingCoupon ? '…' : (language === 'ar' ? 'تطبيق' : 'Apply')}</button></div></label>{couponMessage && <p className={`mt-2 text-xs font-semibold ${appliedCoupon ? 'text-[#26754d]' : 'text-[#8f3025]'}`}>{couponMessage}</p>}</div>
          <fieldset className="grid gap-3 sm:col-span-2"><legend className="text-xs font-bold uppercase tracking-[.12em]">{t(language, 'Payment method')}</legend><div className="grid gap-3 sm:grid-cols-2"><label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-sm font-semibold ${form.paymentMethod === 'cod' ? 'border-primary bg-[#f7efe4]' : 'border-[#d1b99c]'}`}><input type="radio" name="paymentMethod" value="cod" checked={form.paymentMethod === 'cod'} onChange={(event) => setForm({ ...form, paymentMethod: event.target.value })} />{t(language, 'Cash on delivery')}</label><label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-sm font-semibold ${form.paymentMethod === 'bank_transfer' ? 'border-primary bg-[#f7efe4]' : 'border-[#d1b99c]'}`}><input type="radio" name="paymentMethod" value="bank_transfer" checked={form.paymentMethod === 'bank_transfer'} onChange={(event) => setForm({ ...form, paymentMethod: event.target.value })} />{t(language, 'InstaPay / Bank transfer')}</label>{canInstallment && <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-sm font-semibold ${form.paymentMethod === 'installment' ? 'border-primary bg-[#f7efe4]' : 'border-[#d1b99c]'}`}><input type="radio" name="paymentMethod" value="installment" checked={form.paymentMethod === 'installment'} onChange={(event) => setForm({ ...form, paymentMethod: event.target.value })} />{language === 'ar' ? 'التقسيط' : 'Installment'}</label>}</div></fieldset>
          
          {form.paymentMethod === 'installment' && (
            <div className="sm:col-span-2 rounded-xl border border-primary/20 bg-primary/5 p-5">
              <h3 className="mb-4 text-sm font-bold text-primary">{language === 'ar' ? 'اختر نظام التقسيط' : 'Select Installment Plan'}</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-xs font-bold uppercase tracking-[.12em]">
                  {language === 'ar' ? 'نظام التقسيط' : 'Installment Plan'}
                  <select value={selectedPlanId} onChange={(e) => { setSelectedPlanId(Number(e.target.value)); setSelectedMonths(''); }} className={inputClass}>
                    <option value="">{language === 'ar' ? 'اختر النظام' : 'Select plan'}</option>
                    {installmentPlans?.filter(p => p.active).map(p => (
                      <option key={p.id} value={p.id}>{language === 'ar' && p.providerNameAr ? p.providerNameAr : p.providerName} {p.interestRate > 0 ? `(${p.interestRate}%)` : ''}</option>
                    ))}
                  </select>
                </label>
                {selectedPlan && (
                  <label className="grid gap-2 text-xs font-bold uppercase tracking-[.12em]">
                    {language === 'ar' ? 'عدد الأشهر' : 'Months'}
                    <select value={selectedMonths} onChange={(e) => setSelectedMonths(Number(e.target.value))} className={inputClass}>
                      <option value="">{language === 'ar' ? 'اختر المدة' : 'Select duration'}</option>
                      {Array.from({ length: selectedPlan.maxMonths - selectedPlan.minMonths + 1 }, (_, i) => selectedPlan.minMonths + i).map(m => (
                        <option key={m} value={m}>{m} {language === 'ar' ? 'أشهر' : 'months'}</option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
              {selectedPlan && selectedMonths && (
                <div className="mt-4 flex items-center justify-between rounded-lg bg-white p-4 shadow-sm">
                  <span className="text-sm font-semibold">{language === 'ar' ? 'القسط الشهري التقريبي' : 'Estimated Monthly'}</span>
                  <span className="font-display text-xl text-primary">{money(installmentMonthlyPayment, language)}</span>
                </div>
              )}
            </div>
          )}
        </div>
        {error && <p className="mt-5 rounded-xl bg-[#f6d1c8] px-4 py-3 text-sm font-semibold text-[#8f3025]" role="alert">{error}</p>}
        <button type="submit" disabled={submitting} className="mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60" data-testid="button-submit-order"><Check size={18} /> {submitting ? t(language, 'Placing order...') : t(language, 'Confirm order')}</button>
      </form>
      <aside className="h-fit rounded-2xl bg-[#3D2A1E] p-6 text-[#f4ecdf] sm:p-8 lg:sticky lg:top-28"><h2 className="font-display text-3xl">{t(language, 'Order summary')}</h2><div className="mt-6 space-y-4 border-b border-[#614b3a] pb-6">{items.map(({ product, quantity, variant }) => { const visible = localizedProduct(product, language); return <div key={`${product.id}-${variant || ''}`} className="flex justify-between gap-4 text-sm"><div><span className="text-[#d5c6b4]">{visible.name} أ— {quantity}</span><InstallmentInfo product={product} language={language} className="mt-1" /></div><span className="shrink-0 font-bold">{money(product.price * quantity, language)}</span></div>; })}</div><div className="mt-5 space-y-3 text-sm"><div className="flex justify-between"><span className="text-[#cdbbab]">{t(language, 'Subtotal')}</span><span>{money(subtotal, language)}</span></div>{couponDiscount > 0 && <div className="flex justify-between"><span className="text-[#cdbbab]">{language === 'ar' ? `كوبون ${appliedCoupon?.code}` : `Coupon ${appliedCoupon?.code}`}</span><span className="text-[#e9b98b]">-{money(couponDiscount, language)}</span></div>}<div className="flex justify-between"><span className="text-[#cdbbab]">{t(language, shipping ? 'Delivery fee' : 'Free delivery')}</span><span>{shipping ? money(shipping, language) : t(language, 'Free delivery')}</span></div></div><div className="mt-5 flex justify-between border-t border-[#614b3a] pt-5 text-lg font-bold"><span>{t(language, 'Total')}</span><span>{money(total, language)}</span></div></aside>
    </div>
  </div>;
}
function ReceiptPage() {
  const { id } = useParams<{ id: string }>();
  const { language, products, storeSettings, installmentPlans } = useStore();
  const order = readStorage<OrderRecord | null>('pikavibe-last-order', null);
  const [receiptImageUrl, setReceiptImageUrl] = useState('');
  const [imageLoading, setImageLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    if (!order || order.id !== id) { setImageLoading(false); return () => { cancelled = true; }; }
    setImageLoading(true);
    createReceiptImage(order, products, language).then((blob) => {
      if (cancelled) return;
      setReceiptImageUrl((previous) => { if (previous) URL.revokeObjectURL(previous); return URL.createObjectURL(blob); });
      setImageLoading(false);
    }).catch(() => { if (!cancelled) setImageLoading(false); });
    return () => { cancelled = true; };
  }, [id, order?.id, language, products]);
  if (!order || order.id !== id) return <NotFoundPage />;
  const whatsappMessage = buildReceiptMessage(order, language, products, installmentPlans);
  const date = new Date(order.createdAt);
  return <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
    <div className="mb-8 text-center"><div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#d7efdf] text-[#2E9B68]"><Check size={32} /></div><p className="mb-3 text-xs font-bold uppercase tracking-[.2em] text-primary">{t(language, 'Order confirmed')}</p><h1 className="font-display text-5xl tracking-[-.05em] sm:text-7xl">{t(language, 'Thank you for choosing PikaVibe.')}</h1><p className="mx-auto mt-5 max-w-xl text-base leading-7 text-muted-foreground">{t(language, 'Your order has been received. We’ll contact you shortly to confirm delivery.')}</p></div>
    <article className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-soft">
      <div className="flex flex-col justify-between gap-5 bg-[#3D2A1E] p-6 text-[#f4ecdf] sm:flex-row sm:items-end sm:p-9"><div><div className="flex items-center gap-3"><img src={storeSettings.logoUrl || logo} alt={`${storeSettings.storeName} logo`} className="h-12 w-12 rounded-full object-cover" /><span className="font-display text-3xl">{storeSettings.storeName}</span></div><p className="mt-4 text-sm text-[#cdbbab]">{t(language, 'Order receipt')}</p></div><div className="sm:text-right"><p className="text-xs uppercase tracking-[.16em] text-[#d9a77d]">{t(language, 'Order number')}</p><p className="mt-1 font-display text-2xl">{order.orderNumber || order.id}</p></div></div>
      <div className="grid gap-8 p-6 sm:grid-cols-2 sm:p-9"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-muted-foreground">{t(language, 'Date')}</p><p className="mt-2 text-sm font-semibold">{date.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-KE', { dateStyle: 'medium', timeStyle: 'short' })}</p></div><div><p className="text-xs font-bold uppercase tracking-[.14em] text-muted-foreground">{t(language, 'Order status')}</p><p className="mt-2 inline-flex rounded-full bg-[#d7efdf] px-3 py-1 text-sm font-bold text-[#26754d]">{t(language, 'Pending')}</p></div><div><p className="text-xs font-bold uppercase tracking-[.14em] text-muted-foreground">{t(language, 'Customer')}</p><p className="mt-2 text-sm font-semibold">{order.customer.name}</p><p className="mt-1 text-sm text-muted-foreground">{order.customer.phone}</p></div><div><p className="text-xs font-bold uppercase tracking-[.14em] text-muted-foreground">{t(language, 'Address')}</p><p className="mt-2 text-sm leading-6">{order.customer.address}</p></div></div>
      <div className="border-t border-border px-6 py-6 sm:px-9"><h2 className="font-display text-3xl">{t(language, 'Products')}</h2><div className="mt-5 divide-y divide-border">{order.items.map((item) => { const product = products.find((entry) => entry.id === item.id); if (!product) return null; const visible = localizedProduct(product, language); return <div key={item.id} className="flex items-center justify-between gap-4 py-4 text-sm"><div className="flex items-center gap-3"><img src={product.image} alt="" className="h-14 w-14 rounded-xl object-cover" /><div><p className="font-semibold">{visible.name}</p><p className="mt-1 text-muted-foreground">{t(language, 'Quantity')}: {item.quantity}</p></div></div><span className="font-bold">{money(product.price * item.quantity, language)}</span></div>; })}</div></div>
      <div className="border-t border-border bg-[#f0e6d7] p-6 sm:p-9"><div className="ml-auto max-w-sm space-y-3 text-sm"><div className="flex justify-between"><span className="text-muted-foreground">{t(language, 'Subtotal')}</span><span>{money(order.subtotal, language)}</span></div><div className="flex justify-between"><span className="text-muted-foreground">{t(language, 'Shipping')}</span><span>{order.shipping ? money(order.shipping, language) : t(language, 'Free delivery')}</span></div><div className="flex justify-between"><span className="text-muted-foreground">{t(language, 'Discount')}</span><span className="text-primary">-{money(order.discount, language)}</span></div><div className="flex justify-between border-t border-[#d1b99c] pt-4 text-lg font-bold"><span>{t(language, 'Total')}</span><span>{money(order.total, language)}</span></div><div className="flex justify-between pt-2"><span className="text-muted-foreground">{t(language, 'Payment method')}</span><span className="font-semibold">{t(language, order.customer.paymentMethod)}</span></div></div></div>
    </article>
    {receiptImageUrl && <div className="mt-8 rounded-2xl border border-border bg-card p-4 shadow-soft"><p className="mb-3 text-sm font-bold">{language === 'ar' ? 'صورة الإيصال الجاهزة للإرسال' : 'Receipt image ready to send'}</p><img src={receiptImageUrl} alt="Order receipt" className="mx-auto max-h-[720px] w-full rounded-xl object-contain" /></div>}
    <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">{receiptImageUrl ? <a href={receiptImageUrl} download={`pika-vibe-order-${order.orderNumber || order.id}.png`} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-0.5" data-testid="link-download-receipt-image"><Download size={18} /> {language === 'ar' ? 'تحميل صورة الإيصال' : 'Download receipt image'}</a> : <button disabled className="flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground opacity-60">{imageLoading ? (language === 'ar' ? 'جاري تجهيز الإيصال...' : 'Preparing receipt...') : (language === 'ar' ? 'تعذر تجهيز الصورة' : 'Receipt image unavailable')}</button>}<a href={whatsappUrl(whatsappMessage)} target="_blank" rel="noreferrer" className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#2E9B68] px-6 text-sm font-bold text-white transition-transform hover:-translate-y-0.5" data-testid="link-send-receipt-whatsapp"><MessageCircle size={18} /> {language === 'ar' ? 'فتح واتساب وإرسال تفاصيل الطلب' : 'Open WhatsApp with order details'}</a><button onClick={() => window.print()} className="flex h-12 items-center justify-center gap-2 rounded-xl border border-border px-6 text-sm font-bold transition-colors hover:bg-secondary" data-testid="button-print-receipt"><Printer size={18} /> {t(language, 'Print receipt')}</button><Link href="/products" className="flex h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold text-primary" data-testid="link-receipt-continue">{t(language, 'Continue shopping')} <ArrowRight size={17} /></Link></div>
  </div>;
}

async function createReceiptImage(order: OrderRecord, products: Product[], language: Language): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const width = 1000;
  const rowHeight = 150;
  const height = 360 + order.items.length * rowHeight + 330;
  canvas.width = width * 2; canvas.height = height * 2;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas unavailable');
  context.scale(2, 2);
  const ctx = context;
  const isArabic = language === 'ar';
  const text = (value: string, x: number, y: number, size = 22, color = '#3D2A1E', weight = '400') => { ctx.fillStyle = color; ctx.font = `${weight} ${size}px Arial, sans-serif`; ctx.textAlign = isArabic ? 'right' : 'left'; ctx.fillText(value, x, y); };
  ctx.fillStyle = '#f4ecdf'; ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#3D2A1E'; ctx.fillRect(0, 0, width, 150);
  text('PikaVibe', isArabic ? width - 60 : 60, 68, 42, '#f4ecdf', '700');
  text(isArabic ? 'إيصال الطلب' : 'Order receipt', isArabic ? width - 60 : 60, 108, 20, '#d9a77d', '400');
  text(`${isArabic ? 'رقم الطلب' : 'Order'}: ${order.orderNumber || order.id}`, isArabic ? width - 60 : width - 60, 82, 22, '#f4ecdf', '700');
  const left = isArabic ? width - 60 : 60;
  const right = isArabic ? 60 : width - 60;
  let y = 205;
  text(`${isArabic ? 'العميل' : 'Customer'}: ${order.customer.name}`, left, y, 22); text(`${isArabic ? 'الهاتف' : 'Phone'}: ${order.customer.phone}`, right, y, 22, '#6f6256');
  y += 42; text(`${isArabic ? 'العنوان' : 'Address'}: ${order.customer.address}`, left, y, 20, '#6f6256');
  y += 65; ctx.strokeStyle = '#d1b99c'; ctx.beginPath(); ctx.moveTo(60, y); ctx.lineTo(width - 60, y); ctx.stroke(); y += 45;
  for (const item of order.items) {
    const product = products.find((entry) => entry.id === item.id); if (!product) continue;
    const visible = localizedProduct(product, language); const image = await loadReceiptImage(product.image); const imageX = isArabic ? width - 175 : 75;
    if (image) { ctx.drawImage(image, imageX, y - 25, 100, 100); } else { ctx.fillStyle = '#ead9c0'; ctx.fillRect(imageX, y - 25, 100, 100); }
    const infoX = isArabic ? width - 200 : 205; text(visible.name, infoX, y + 5, 23, '#3D2A1E', '700'); text(`${isArabic ? 'الكمية' : 'Qty'}: ${item.quantity}`, infoX, y + 42, 18, '#6f6256'); text(money(product.price * item.quantity, language), right, y + 25, 21, '#C15F2D', '700');
    y += rowHeight;
  }
  ctx.fillStyle = '#ead9c0'; ctx.fillRect(0, y - 15, width, height - y + 15);
  const totalX = isArabic ? width - 60 : width - 60; text(`${isArabic ? 'المجموع الفرعي' : 'Subtotal'}: ${money(order.subtotal, language)}`, totalX, y + 35, 20, '#6f6256'); text(`${isArabic ? 'الشحن' : 'Shipping'}: ${order.shipping ? money(order.shipping, language) : (isArabic ? 'مجاني' : 'Free')}`, totalX, y + 75, 20, '#6f6256'); text(`${isArabic ? 'الإجمالي' : 'Total'}: ${money(order.total, language)}`, totalX, y + 130, 30, '#3D2A1E', '700'); text(isArabic ? 'شكرًا لطلبكم من PikaVibe' : 'Thank you for your order from PikaVibe', isArabic ? width - 60 : 60, height - 45, 18, '#6f6256');
  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Could not create receipt image')), 'image/png'));
}

function loadReceiptImage(source: string): Promise<HTMLImageElement | null> { return new Promise((resolve) => { if (!source || source === '/') return resolve(null); const image = new Image(); image.crossOrigin = 'anonymous'; image.onload = () => resolve(image); image.onerror = () => resolve(null); image.src = source; }); }

function buildReceiptMessage(order: OrderRecord, language: Language, products: Product[], installmentPlans: InstallmentPlan[]) {
  const planName = order.installmentPlanId ? (installmentPlans.find((plan) => plan.id === order.installmentPlanId)?.providerName || String(order.installmentPlanId)) : '-';
  const isArabic = language === 'ar';
  const date = new Date(order.createdAt).toLocaleDateString(isArabic ? 'ar-EG' : 'en-KE');
  const productLines = order.items.map((item) => {
    const product = products.find((entry) => entry.id === item.id);
    return product ? `• ${localizedProduct(product, language).name} × ${item.quantity} — ${money(product.price * item.quantity, language)}` : '';
  }).filter(Boolean).join('\n');
  if (isArabic) {
    return `🧾 *إيصال طلب بيكاڤايب*\n\n*رقم الطلب:* ${order.orderNumber || order.id}\n*الاسم:* ${order.customer.name}\n*التاريخ:* ${date}\n*رقم الهاتف:* ${order.customer.phone}\n*الموقع:* ${order.customer.governorate}، ${order.customer.city}، ${order.customer.address}\n\n*المنتجات:*\n${productLines}\n\n*المجموع الفرعي:* ${money(order.subtotal, language)}\n*الشحن:* ${order.shipping ? money(order.shipping, language) : 'توصيل مجاني'}\n*الخصم:* ${money(order.discount, language)}\n*الإجمالي:* ${money(order.total, language)}\n*طريقة الدفع:* ${order.customer.paymentMethod}\n${order.customer.paymentMethod === 'installment' ? `*رقم الهوية:* ${order.customer.idNumber || '-'}\n*نظام التقسيط:* ${planName}\n*مدة التقسيط:* ${order.installmentMonths || '-'} شهر\n*القسط الشهري:* ${order.installmentMonthlyPayment ? money(order.installmentMonthlyPayment, language) : '-'}\n*يوم السداد الشهري:* ${order.installmentPaymentDay || '-'}\n` : ''}\n*عنوان التوصيل:*\n${order.customer.address}\n\nشكراً لاختياركم بيكاڤايب.`;
  }
  return `🧾 *PikaVibe Order Receipt*\n\n*Order:* ${order.orderNumber || order.id}\n*Name:* ${order.customer.name}\n*Date:* ${date}\n*Phone:* ${order.customer.phone}\n*Location:* ${order.customer.governorate}, ${order.customer.city}, ${order.customer.address}\n\n*Products:*\n${productLines}\n\n*Subtotal:* ${money(order.subtotal, language)}\n*Shipping:* ${order.shipping ? money(order.shipping, language) : 'Free delivery'}\n*Discount:* ${money(order.discount, language)}\n*Total:* ${money(order.total, language)}\n*Payment method:* ${order.customer.paymentMethod}\n${order.customer.paymentMethod === 'installment' ? `*ID number:* ${order.customer.idNumber || '-'}\n*Installment plan:* ${planName}\n*Term:* ${order.installmentMonths || '-'} months\n*Monthly payment:* ${order.installmentMonthlyPayment ? money(order.installmentMonthlyPayment, language) : '-'}\n*Monthly payment day:* ${order.installmentPaymentDay || '-'}\n` : ''}\n*Delivery address:*\n${order.customer.address}\n\nThank you for choosing PikaVibe.`;
}

function AboutPage() {
  const { language } = useStore();
  const values = language === 'ar'
    ? [['01', 'الفائدة أولاً', 'كل قطعة يجب أن تحل مشكلة حقيقية، وتفعل ذلك بلمسة جميلة.'], ['02', 'مصممة للحياة', 'نختار خامات وأشكالاً تتحمل طريقة استخدام البيوت الحقيقية.'], ['03', 'محلية من القلب', 'نظرتنا كينية: دافئة، عملية، معبرة وفخورة بأصلها.']]
    : [['01', 'Useful first', 'Every piece should solve a real problem, and do it with a little grace.'], ['02', 'Made for living', 'We choose materials and shapes that can handle the way homes are actually used.'], ['03', 'Local at heart', 'Our lens is Kenyan: warm, resourceful, expressive and proudly our own.']];
  return <div><section className="bg-[#3D2A1E] px-4 py-16 text-[#f4ecdf] sm:px-6 lg:px-8 lg:py-24"><div className="mx-auto max-w-7xl"><p className="mb-5 text-xs font-bold uppercase tracking-[.2em] text-[#e9b98b]">{t(language, 'Our point of view')}</p><h1 className="max-w-4xl font-display text-6xl leading-[.9] tracking-[-.06em]">{language === 'ar' ? <>البيت يُصنع من <em className="text-[#e9b98b]">التفاصيل الصغيرة.</em></> : <>A home is made in the <em className="text-[#e9b98b]">little things.</em></>}</h1><p className="mt-8 max-w-xl text-lg leading-8 text-[#d5c6b4]">{language === 'ar' ? 'بيكاڤايب متجر كيني لأدوات المطبخ لمن يريد أن يشعر الطبخ والتنظيم اليومي بجمال وراحة أكبر.' : 'PikaVibe is a Kenyan kitchenware shop for people who want everyday cooking and home organisation to feel more beautiful, practical and considered.'}</p></div></section><section className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[.8fr_1.2fr] lg:px-8 lg:py-24"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-primary">{t(language, 'Why we started')}</p><h2 className="mt-4 font-display text-5xl leading-none tracking-[-.045em]">{t(language, 'Not more stuff. Better stuff.')}</h2></div><div className="space-y-6 text-base leading-8 text-muted-foreground"><p>{language === 'ar' ? 'بدأنا بيكاڤايب لأن الأشياء التي نستخدمها كل يوم يجب أن تستحق مكانها. مقلاة تتحسن مع الوقت، وبرطمان يجعل المخزن أكثر ترتيباً، وفرشاة مريحة في اليد.' : 'We started PikaVibe because the things we use every day should earn their place. A pan that gets better with time. A storage jar that makes the pantry make sense. A brush that feels good to pick up.'}</p><p>{language === 'ar' ? 'اختياراتنا صغيرة عن قصد. نختار قطعاً للبيوت الكينية الحقيقية: للصباحات المزدحمة، والوجبات العائلية، والمطابخ الصغيرة، والضيافة الكبيرة وكل السحر اليومي.' : 'Our edit is small on purpose. We choose pieces for real Kenyan homes — for busy mornings, generous family meals, tiny kitchens, big hosting energy and all the ordinary magic in between.'}</p><p className="font-display text-2xl leading-tight text-foreground">{language === 'ar' ? '“التصميم الجيد لا يستعرض نفسه، بل يجعل تفاصيل اليوم تشعر بالعناية.”' : '“Good design is not about showing off. It is about making the everyday feel looked after.”'}</p></div></section><section className="bg-[#ead9c0] px-4 py-16 sm:px-6 lg:px-8 lg:py-20"><div className="mx-auto max-w-7xl"><p className="mb-8 text-xs font-bold uppercase tracking-[.2em] text-primary">{t(language, 'What matters to us')}</p><div className="grid gap-px overflow-hidden rounded-2xl border border-[#d5bfa4] bg-[#d5bfa4] md:grid-cols-3">{values.map(([number, title, body]) => <div key={number} className="bg-[#ead9c0] p-7 sm:p-10"><span className="font-display text-5xl text-[#c58c5a]">{number}</span><h3 className="mt-8 font-display text-3xl">{title}</h3><p className="mt-4 text-sm leading-6 text-[#765e4c]">{body}</p></div>)}</div></div></section><section className="mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 py-16 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8 lg:py-20"><h2 className="max-w-xl font-display text-4xl leading-tight sm:text-5xl">{language === 'ar' ? 'مستعد لجعل يومك أكثر عناية؟' : 'Ready to make your everyday a little more considered?'}</h2><Link href="/products" className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground" data-testid="about-shop-button">{t(language, 'Browse the edit')} <ArrowRight size={17} /></Link></section></div>;
}

function ContactPage() {
  const [sent, setSent] = useState(false);
  const { language } = useStore();
  return <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16"><div className="grid gap-12 lg:grid-cols-[.9fr_1.1fr] lg:gap-20"><div><p className="mb-3 text-xs font-bold uppercase tracking-[.2em] text-primary">{language === 'ar' ? 'تواصل معنا' : 'Come say hello'}</p><h1 className="font-display text-6xl leading-[.9] tracking-[-.06em] sm:text-8xl">{language === 'ar' ? <>يسعدنا أن <em className="text-primary">نسمع</em> منك.</> : <>We'd love to <em className="text-primary">hear</em> from you.</>}</h1><p className="mt-7 max-w-md text-base leading-7 text-muted-foreground">{language === 'ar' ? 'هل لديك سؤال عن منتج أو توصيل أو ما يناسب مطبخك؟ هناك أشخاص حقيقيون على الطرف الآخر.' : 'Questions about a product, a delivery or what would work best in your kitchen? Real people are on the other side of these details.'}</p><div className="mt-10 grid gap-5"><a href={whatsappUrl(language === 'ar' ? 'مرحباً بيكاڤايب، أحتاج إلى مساعدة.' : 'Hello PikaVibe, I need some help.')} target="_blank" rel="noreferrer" className="flex items-center gap-4 rounded-2xl bg-[#3D2A1E] p-4 text-[#f4ecdf] transition-transform hover:-translate-y-0.5" data-testid="contact-whatsapp-link"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#2E9B68]"><MessageCircle size={20} /></span><span><span className="block text-sm font-bold">{t(language, 'WhatsApp us')}</span><span className="mt-1 block text-xs text-[#cdbbab]">{t(language, 'Quickest way to reach us')}</span></span><ArrowRight className="ml-auto" size={17} /></a><div className="grid gap-4 sm:grid-cols-2"><div className="rounded-2xl border border-border bg-card p-5"><MapPin size={19} className="mb-4 text-primary" /><p className="text-sm font-bold">{t(language, 'Based in Nairobi')}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{t(language, 'Delivering across Kenya')}</p></div><div className="rounded-2xl border border-border bg-card p-5"><Clock size={19} className="mb-4 text-primary" /><p className="text-sm font-bold">{t(language, 'Mon – Sat')}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{t(language, '9:00 am – 6:00 pm EAT')}</p></div></div></div></div><div className="rounded-[2rem] bg-[#ead9c0] p-6 sm:p-10"><p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-primary">{t(language, 'Send a note')}</p><h2 className="font-display text-4xl">{t(language, 'What can we help with?')}</h2>{sent ? <div className="mt-10 rounded-2xl bg-[#3D2A1E] p-8 text-center text-[#f4ecdf]"><Check className="mx-auto mb-4 text-[#e9b98b]" size={28} /><h3 className="font-display text-3xl">{t(language, 'Message received.')}</h3><p className="mt-3 text-sm leading-6 text-[#cdbbab]">{t(language, "Thanks for reaching out. We'll get back to you soon.")}</p><button onClick={() => setSent(false)} className="mt-6 text-xs font-bold uppercase tracking-widest text-[#e9b98b] underline underline-offset-4" data-testid="button-send-another">{t(language, 'Send another note')}</button></div> : <form onSubmit={(event) => { event.preventDefault(); setSent(true); }} className="mt-8 grid gap-5"><label className="grid gap-2 text-xs font-bold uppercase tracking-[.12em]">{t(language, 'Your name')}<input required type="text" className="rounded-xl border border-[#d1b99c] bg-[#f7efe4] px-4 py-3.5 text-sm font-normal normal-case tracking-normal outline-none focus:ring-2 focus:ring-primary" data-testid="input-contact-name" /></label><label className="grid gap-2 text-xs font-bold uppercase tracking-[.12em]">{t(language, 'Email or phone')}<input required type="text" className="rounded-xl border border-[#d1b99c] bg-[#f7efe4] px-4 py-3.5 text-sm font-normal normal-case tracking-normal outline-none focus:ring-2 focus:ring-primary" data-testid="input-contact-email" /></label><label className="grid gap-2 text-xs font-bold uppercase tracking-[.12em]">{t(language, 'Your message')}<textarea required rows={5} className="resize-none rounded-xl border border-[#d1b99c] bg-[#f7efe4] px-4 py-3.5 text-sm font-normal normal-case tracking-normal outline-none focus:ring-2 focus:ring-primary" data-testid="textarea-contact-message" /></label><button type="submit" className="flex h-12 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground" data-testid="button-send-message">{t(language, 'Send message')} <ArrowRight size={17} /></button></form>}</div></div><div className="mt-16 border-t border-border pt-8 text-center text-sm text-muted-foreground"><p className="flex items-center justify-center gap-2"><Mail size={15} className="text-primary" /> hello@pikavibe.co.ke <span className="mx-2 text-border">·</span><Phone size={15} className="text-primary" /> +254 201 023 279</p></div></div>;
}

function EmptyState({ icon = <Search size={25} />, title, body, action, onAction }: { icon?: ReactNode; title: string; body: string; action: string; onAction: () => void }) {
  return <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#cdbba6] bg-[#f0e6d7] px-6 text-center"><div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#e0c8aa] text-primary">{icon}</div><h2 className="font-display text-3xl">{title}</h2><p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{body}</p><button onClick={onAction} className="mt-6 rounded-full bg-[#3D2A1E] px-5 py-3 text-sm font-bold text-[#f4ecdf]" data-testid="button-empty-state-action">{action}</button></div>;
}

function NotFoundPage() {
  return <div className="mx-auto flex min-h-[55vh] max-w-xl flex-col items-center justify-center px-4 text-center"><div className="mb-4 font-display text-8xl text-primary">404</div><h1 className="font-display text-4xl">That shelf is empty.</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">The page you're looking for has moved, but there are still plenty of good things to find.</p><Link href="/products" className="mt-7 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground" data-testid="link-404-shop">Back to the shop</Link></div>;
}

function whatsappUrl(message: string) {
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`;
}

export default App;
