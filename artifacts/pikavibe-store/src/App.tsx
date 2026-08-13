import { useContext, useEffect, useMemo, useState, createContext, type ReactNode } from 'react';
import { Link, Route, Switch, useLocation, useParams, Router as WouterRouter } from 'wouter';
import {
  ArrowRight, Check, ChevronDown, ChevronLeft, ChevronRight, Heart, Instagram, Menu,
  Minus, Plus, Search, Send, ShoppingBag, SlidersHorizontal, Sparkles, Star,
  Truck, X, MessageCircle, MapPin, Mail, Phone, Clock, ShieldCheck, Trash2,
} from 'lucide-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import logo from '@assets/lOgo_1786638003283.jpg';
import { categories, products, type Product } from './data/products';
import './index.css';

type CartItem = { id: string; quantity: number };
type StoreContextValue = {
  cart: CartItem[];
  wishlist: string[];
  addToCart: (id: string, quantity?: number) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeFromCart: (id: string) => void;
  toggleWishlist: (id: string) => void;
  cartCount: number;
};

const StoreContext = createContext<StoreContextValue | null>(null);
const WHATSAPP = '201023279424';
const money = (value: number) => `KES ${value.toLocaleString('en-KE')}`;

function useStore() {
  const value = useContext(StoreContext);
  if (!value) throw new Error('Store context is missing');
  return value;
}

function App() {
  const [cart, setCart] = useState<CartItem[]>(() => readStorage<CartItem[]>('pikavibe-cart', []));
  const [wishlist, setWishlist] = useState<string[]>(() => readStorage<string[]>('pikavibe-wishlist', []));
  useEffect(() => localStorage.setItem('pikavibe-cart', JSON.stringify(cart)), [cart]);
  useEffect(() => localStorage.setItem('pikavibe-wishlist', JSON.stringify(wishlist)), [wishlist]);
  const store = useMemo<StoreContextValue>(() => ({
    cart, wishlist,
    addToCart: (id, quantity = 1) => setCart((items) => {
      const found = items.find((item) => item.id === id);
      return found ? items.map((item) => item.id === id ? { ...item, quantity: item.quantity + quantity } : item) : [...items, { id, quantity }];
    }),
    updateQuantity: (id, quantity) => setCart((items) => quantity < 1 ? items.filter((item) => item.id !== id) : items.map((item) => item.id === id ? { ...item, quantity } : item)),
    removeFromCart: (id) => setCart((items) => items.filter((item) => item.id !== id)),
    toggleWishlist: (id) => setWishlist((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]),
    cartCount: cart.reduce((sum, item) => sum + item.quantity, 0),
  }), [cart, wishlist]);

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
              <Route path="/about" component={AboutPage} />
              <Route path="/contact" component={ContactPage} />
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
  const { cartCount, wishlist } = useStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [location] = useLocation();
  useEffect(() => setMobileOpen(false), [location]);
  return (
    <div className="grain min-h-[100dvh] bg-background">
      <div className="bg-[#3D2A1E] px-4 py-2 text-center text-[11px] font-semibold uppercase tracking-[.18em] text-[#E8DFD0]">
        Free delivery in Nairobi on orders over KES 5,000
      </div>
      <header className="sticky top-0 z-40 border-b border-[#d6c8b5] bg-[#f4ecdf]/95 backdrop-blur-md">
        <div className="mx-auto flex h-[74px] max-w-7xl items-center justify-between gap-5 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5" data-testid="link-logo">
            <img src={logo} alt="PikaVibe Kenyan Kitchenware" className="h-12 w-12 rounded-full object-cover shadow-sm" />
            <div className="hidden leading-none sm:block">
              <span className="font-display text-[25px] font-bold tracking-[-.04em] text-[#3D2A1E]">PikaVibe</span>
              <span className="mt-1 block text-[9px] font-bold uppercase tracking-[.18em] text-[#C8722E]">Kenyan kitchenware</span>
            </div>
          </Link>
          <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary navigation">
            <Link href="/" className={navClass(location === '/')} data-testid="link-home">Home</Link>
            <div className="relative">
              <button onClick={() => setCategoryOpen((open) => !open)} className={navClass(location.startsWith('/products')) + ' flex items-center gap-1'} data-testid="button-categories">
                Shop <ChevronDown size={14} className={categoryOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />
              </button>
              {categoryOpen && (
                <div className="absolute left-1/2 top-10 w-52 -translate-x-1/2 rounded-2xl border border-border bg-card p-2 shadow-float animate-rise">
                  {categories.slice(1).map((category) => <Link key={category} href={`/products?category=${encodeURIComponent(category)}`} className="block rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground" data-testid={`link-category-${category.toLowerCase().replaceAll(' ', '-')}`}>{category}</Link>)}
                  <Link href="/products" className="mt-1 block border-t border-border px-3 pt-3 text-sm font-bold text-primary" data-testid="link-all-products">View all products <ArrowRight size={13} className="ml-1 inline" /></Link>
                </div>
              )}
            </div>
            <Link href="/about" className={navClass(location === '/about')} data-testid="link-about">Our story</Link>
            <Link href="/contact" className={navClass(location === '/contact')} data-testid="link-contact">Contact</Link>
          </nav>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link href="/products" className="hidden h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary sm:flex" aria-label="Search products" data-testid="link-search"><Search size={19} strokeWidth={1.8} /></Link>
            <Link href="/products?wishlist=true" className="relative flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary" aria-label="View wishlist" data-testid="link-wishlist"><Heart size={19} strokeWidth={1.8} fill={wishlist.length ? 'currentColor' : 'none'} /><CountBadge count={wishlist.length} /></Link>
            <Link href="/cart" className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[#3D2A1E] text-[#f4ecdf] transition-transform hover:scale-105" aria-label="View cart" data-testid="link-cart"><ShoppingBag size={18} strokeWidth={1.8} /><CountBadge count={cartCount} inverted /></Link>
            <button onClick={() => setMobileOpen(true)} className="ml-1 flex h-10 w-10 items-center justify-center rounded-full border border-border lg:hidden" aria-label="Open navigation" data-testid="button-open-menu"><Menu size={20} /></button>
          </div>
        </div>
        {mobileOpen && <MobileMenu close={() => setMobileOpen(false)} />}
      </header>
      <main>{children}</main>
      <Footer />
      <a href={whatsappUrl('Hello PikaVibe! I have a question.')} target="_blank" rel="noreferrer" className="fixed bottom-5 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#2E9B68] text-white shadow-float transition-transform hover:scale-110" aria-label="Chat with PikaVibe on WhatsApp" data-testid="link-floating-whatsapp"><MessageCircle size={25} /></a>
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
  return <div className="absolute inset-x-0 top-[74px] border-b border-border bg-[#f4ecdf] p-5 shadow-float lg:hidden animate-rise">
    <div className="mb-3 flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-[.18em] text-muted-foreground">Explore PikaVibe</span><button onClick={close} aria-label="Close navigation" data-testid="button-close-menu"><X size={20} /></button></div>
    <div className="grid gap-1">
      {[['Home', '/'], ['Shop all', '/products'], ['Our story', '/about'], ['Contact', '/contact'], ['Your cart', '/cart']].map(([label, href]) => <Link key={href} href={href} onClick={close} className="border-b border-border/60 py-3 font-display text-2xl text-foreground" data-testid={`mobile-link-${label.toLowerCase().replaceAll(' ', '-')}`}>{label}</Link>)}
    </div>
  </div>;
}

function Footer() {
  return <footer className="mt-20 bg-[#3D2A1E] px-4 pb-8 pt-14 text-[#E8DFD0] sm:px-6 lg:px-8">
    <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.5fr_1fr_1fr_1.3fr]">
      <div><div className="flex items-center gap-3"><img src={logo} alt="" className="h-12 w-12 rounded-full object-cover" /><span className="font-display text-3xl">PikaVibe</span></div><p className="mt-5 max-w-xs text-sm leading-6 text-[#d5c6b4]">Thoughtful things for the way you cook, clean, gather and make a home in Kenya.</p></div>
      <div><h3 className="mb-4 text-xs font-bold uppercase tracking-[.18em] text-[#d9a77d]">Shop</h3><div className="grid gap-3 text-sm text-[#d5c6b4]"><Link href="/products" className="hover:text-white" data-testid="footer-link-shop">All products</Link><Link href="/products?category=Cookware" className="hover:text-white" data-testid="footer-link-cookware">Cookware</Link><Link href="/products?category=Storage" className="hover:text-white" data-testid="footer-link-storage">Storage</Link><Link href="/products?category=Cleaning" className="hover:text-white" data-testid="footer-link-cleaning">Cleaning</Link></div></div>
      <div><h3 className="mb-4 text-xs font-bold uppercase tracking-[.18em] text-[#d9a77d]">PikaVibe</h3><div className="grid gap-3 text-sm text-[#d5c6b4]"><Link href="/about" className="hover:text-white" data-testid="footer-link-about">Our story</Link><Link href="/contact" className="hover:text-white" data-testid="footer-link-contact">Contact us</Link><a href={whatsappUrl('Hello PikaVibe!')} target="_blank" rel="noreferrer" className="hover:text-white" data-testid="footer-link-whatsapp">WhatsApp support</a></div></div>
      <div><h3 className="mb-4 text-xs font-bold uppercase tracking-[.18em] text-[#d9a77d]">Stay in the loop</h3><p className="mb-4 text-sm leading-6 text-[#d5c6b4]">New drops, useful kitchen notes and the occasional good idea.</p><form onSubmit={(event) => { event.preventDefault(); }} className="flex border-b border-[#92745c] pb-2"><input type="email" placeholder="Your email address" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#aa927d]" aria-label="Email address" data-testid="input-newsletter-email" /><button type="submit" aria-label="Subscribe" className="text-[#e9b98b]" data-testid="button-newsletter-submit"><Send size={17} /></button></form></div>
    </div>
    <div className="mx-auto mt-12 flex max-w-7xl flex-col justify-between gap-3 border-t border-[#604b3a] pt-6 text-xs text-[#aa927d] sm:flex-row"><span>© 2025 PikaVibe Kitchenware. Made for Kenyan homes.</span><span className="flex items-center gap-4"><Instagram size={14} /> Nairobi · Kenya</span></div>
  </footer>;
}

function HomePage() {
  const { addToCart, wishlist, toggleWishlist } = useStore();
  const bestsellers = products.filter((product) => product.isBestSeller).slice(0, 4);
  return <div>
    <section className="relative overflow-hidden bg-[#ead9c0]">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-14 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:grid-cols-[.9fr_1.1fr] lg:px-8 lg:pb-24 lg:pt-20">
        <div className="relative z-10 animate-rise">
          <div className="mb-6 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[.2em] text-primary"><span className="h-px w-9 bg-primary" />The home of good everyday things</div>
          <h1 className="max-w-xl font-display text-[clamp(3.5rem,8vw,7.4rem)] leading-[.88] tracking-[-.065em] text-[#3D2A1E]">Make room for <em className="text-primary">better</em>.</h1>
          <p className="mt-7 max-w-md text-base leading-7 text-[#654c3d] sm:text-lg">Kitchenware and home tools chosen to make daily rituals feel a little more yours.</p>
          <div className="mt-8 flex flex-wrap items-center gap-3"><Link href="/products" className="inline-flex items-center gap-3 rounded-full bg-[#C8722E] px-6 py-3.5 text-sm font-bold text-[#fff8ef] shadow-soft transition-transform hover:-translate-y-0.5" data-testid="hero-shop-button">Shop the collection <ArrowRight size={17} /></Link><Link href="/about" className="rounded-full px-5 py-3.5 text-sm font-bold text-[#3D2A1E] underline decoration-[#c8722e]/40 underline-offset-4 hover:decoration-primary" data-testid="hero-story-link">Why PikaVibe?</Link></div>
          <div className="mt-12 flex items-center gap-5 text-xs font-semibold text-[#765e4c]"><span className="flex items-center gap-2"><Truck size={16} className="text-primary" /> Nairobi delivery</span><span className="flex items-center gap-2"><ShieldCheck size={16} className="text-primary" /> Loved locally</span></div>
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
      <div className="mb-8 flex items-end justify-between gap-4"><div><p className="mb-2 text-xs font-bold uppercase tracking-[.2em] text-primary">A good place to start</p><h2 className="font-display text-4xl tracking-[-.04em] sm:text-5xl">Shop by rhythm</h2></div><Link href="/products" className="hidden items-center gap-2 text-sm font-bold text-primary sm:flex" data-testid="categories-view-all">See everything <ArrowRight size={16} /></Link></div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5">{[['Cookware', 'For the lovely mess', 'photo-1556911220-bff31c812dba'], ['Storage', 'Put things in their place', 'photo-1583947215259-38e31be8751f'], ['Cleaning', 'The reset feels good', 'photo-1581578731548-c64695cc6952'], ['Small Appliances', 'Tiny daily luxuries', 'photo-1570222094114-d054a817e56b']].map(([name, tagline, photoId], index) => <Link href={`/products?category=${encodeURIComponent(name)}`} key={name} className={`group relative min-h-[190px] overflow-hidden rounded-2xl ${index % 2 === 0 ? 'bg-[#c98755]' : 'bg-[#a98c70]'} sm:min-h-[250px]`} data-testid={`category-card-${name.toLowerCase().replaceAll(' ', '-')}`}><img src={`https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=700&q=85`} alt="" className="absolute inset-0 h-full w-full object-cover mix-blend-multiply opacity-75 transition-transform duration-500 group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-[#3d2a1e]/75 via-transparent to-transparent" /><div className="absolute bottom-4 left-4 text-[#fff8ef] sm:bottom-5 sm:left-5"><h3 className="font-display text-2xl leading-none sm:text-3xl">{name}</h3><p className="mt-1 text-xs text-[#f0ddc6] sm:text-sm">{tagline}</p></div></Link>)}</div>
    </section>
    <section className="bg-[#f0e6d7] px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-7xl"><div className="mb-8 flex items-end justify-between gap-4"><div><p className="mb-2 text-xs font-bold uppercase tracking-[.2em] text-primary">The ones people come back for</p><h2 className="font-display text-4xl tracking-[-.04em] sm:text-5xl">Customer favourites</h2></div><Link href="/products" className="hidden items-center gap-2 text-sm font-bold text-primary sm:flex" data-testid="bestsellers-view-all">Shop all <ArrowRight size={16} /></Link></div><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{bestsellers.map((product) => <ProductCard key={product.id} product={product} wished={wishlist.includes(product.id)} onWishlist={() => toggleWishlist(product.id)} onAdd={() => addToCart(product.id)} />)}</div></div>
    </section>
    <section className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[1.2fr_.8fr] lg:px-8 lg:py-24">
      <div className="rounded-[2rem] bg-[#3D2A1E] p-8 text-[#f4ecdf] sm:p-12"><Sparkles className="mb-8 text-[#e9b98b]" size={27} /><h2 className="max-w-lg font-display text-4xl leading-[1] tracking-[-.04em] sm:text-6xl">The everyday deserves a point of view.</h2><p className="mt-6 max-w-md text-sm leading-6 text-[#d5c6b4]">We look for the sturdy, the useful and the unexpectedly beautiful — from makers and objects that make sense in a Kenyan home.</p><Link href="/about" className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-[#e9b98b] underline underline-offset-4" data-testid="home-story-button">Meet the people behind the picks <ArrowRight size={16} /></Link></div>
      <div className="relative overflow-hidden rounded-[2rem] bg-[#d9b37a] p-8 sm:p-12"><div className="relative z-10"><span className="text-6xl text-[#3d2a1e]">“</span><p className="mt-1 font-display text-3xl leading-tight text-[#3d2a1e]">A kitchen should feel like somewhere you want to be.</p><p className="mt-6 text-xs font-bold uppercase tracking-[.16em] text-[#76563d]">— PikaVibe note</p></div><div className="absolute -bottom-20 -right-12 h-64 w-64 rounded-full border-[22px] border-[#c58951]/50" /></div>
    </section>
  </div>;
}

function ProductCard({ product, wished, onWishlist, onAdd }: { product: Product; wished: boolean; onWishlist: () => void; onAdd: () => void }) {
  return <article className="group min-w-0" data-testid={`card-product-${product.id}`}>
    <div className="relative aspect-[.92] overflow-hidden rounded-2xl bg-[#e4d6c4]"><Link href={`/products/${product.id}`} data-testid={`link-product-${product.id}`}><img src={product.image} alt={product.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.045]" /></Link><div className="absolute left-3 top-3 flex gap-1.5">{product.isNew && <span className="rounded-full bg-[#f4ecdf] px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-[#3D2A1E]">New</span>}{product.discount && <span className="rounded-full bg-[#C8722E] px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white">-{product.discount}%</span>}</div><button onClick={onWishlist} className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#f4ecdf]/90 text-[#3D2A1E] backdrop-blur-sm transition-transform hover:scale-110" aria-label={wished ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`} data-testid={`button-wishlist-${product.id}`}><Heart size={17} fill={wished ? '#C8722E' : 'none'} color={wished ? '#C8722E' : 'currentColor'} /></button><button onClick={onAdd} disabled={!product.inStock} className="absolute bottom-3 left-3 right-3 flex translate-y-2 items-center justify-center gap-2 rounded-xl bg-[#f4ecdf] py-3 text-xs font-bold text-[#3D2A1E] opacity-0 shadow-soft transition-all group-hover:translate-y-0 group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-60" data-testid={`button-add-${product.id}`}><Plus size={15} /> Add to cart</button></div><div className="pt-4"><div className="mb-1 flex items-center justify-between gap-3"><span className="text-[10px] font-bold uppercase tracking-[.16em] text-primary">{product.category}</span><span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground"><Star size={12} fill="#D89B43" color="#D89B43" /> {product.rating}</span></div><Link href={`/products/${product.id}`} className="block font-display text-xl leading-tight text-foreground transition-colors hover:text-primary" data-testid={`link-product-name-${product.id}`}>{product.name}</Link><div className="mt-2 flex items-center gap-2 text-sm font-bold text-foreground"><span>{money(product.price)}</span>{product.oldPrice && <del className="font-normal text-muted-foreground">{money(product.oldPrice)}</del>}</div></div>
  </article>;
}

function ProductsPage() {
  const [location, setLocation] = useLocation();
  const params = new URLSearchParams(location.split('?')[1] || '');
  const [query, setQuery] = useState(params.get('q') || '');
  const [category, setCategory] = useState(params.get('category') || 'All');
  const [sort, setSort] = useState('featured');
  const [mobileFilters, setMobileFilters] = useState(false);
  const { addToCart, wishlist, toggleWishlist } = useStore();
  const filtered = useMemo(() => {
    const matches = products.filter((product) => (category === 'All' || product.category === category) && product.name.toLowerCase().includes(query.toLowerCase()) && (params.get('wishlist') !== 'true' || wishlist.includes(product.id)));
    return [...matches].sort((a, b) => sort === 'price-low' ? a.price - b.price : sort === 'price-high' ? b.price - a.price : sort === 'newest' ? Number(Boolean(b.isNew)) - Number(Boolean(a.isNew)) : Number(Boolean(b.isBestSeller)) - Number(Boolean(a.isBestSeller)));
  }, [category, params, query, sort, wishlist]);
  const updateCategory = (value: string) => { setCategory(value); setLocation(`/products${value === 'All' ? '' : `?category=${encodeURIComponent(value)}`}`); };
  return <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
    <div className="mb-10 max-w-2xl"><p className="mb-3 text-xs font-bold uppercase tracking-[.2em] text-primary">The PikaVibe edit</p><h1 className="font-display text-5xl tracking-[-.055em] sm:text-7xl">Useful, beautiful, <em className="text-primary">well chosen.</em></h1><p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground">Good things for kitchens, bathrooms and all the in-between moments of home.</p></div>
    <div className="mb-7 flex flex-col gap-3 border-y border-border py-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><button onClick={() => setMobileFilters((open) => !open)} className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold lg:hidden" data-testid="button-mobile-filters"><SlidersHorizontal size={15} /> Filters</button><div className={`${mobileFilters ? 'flex' : 'hidden'} flex-wrap gap-2 lg:flex`}>{categories.map((item) => <button key={item} onClick={() => updateCategory(item)} className={`rounded-full px-4 py-2 text-xs font-bold transition-colors ${category === item ? 'bg-[#3D2A1E] text-[#f4ecdf]' : 'bg-secondary text-muted-foreground hover:bg-[#d8c7b3]'}`} data-testid={`filter-category-${item.toLowerCase().replaceAll(' ', '-')}`}>{item}</button>)}</div></div><div className="flex items-center gap-3"><span className="text-xs text-muted-foreground">{filtered.length} {filtered.length === 1 ? 'piece' : 'pieces'}</span><label className="relative"><span className="sr-only">Sort products</span><select value={sort} onChange={(event) => setSort(event.target.value)} className="appearance-none rounded-full border border-border bg-transparent py-2 pl-4 pr-9 text-xs font-bold outline-none focus:ring-2 focus:ring-primary" data-testid="select-sort-products"><option value="featured">Featured first</option><option value="newest">Newest first</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select><ChevronDown size={14} className="pointer-events-none absolute right-3 top-2.5" /></label></div></div>
    <div className="relative mb-8"><Search className="absolute left-4 top-3.5 text-muted-foreground" size={18} /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name or category..." className="w-full rounded-2xl border border-border bg-card py-3.5 pl-12 pr-4 text-sm outline-none transition-shadow focus:ring-2 focus:ring-primary" aria-label="Search products" data-testid="input-search-products" /></div>
    {filtered.length ? <div className="grid grid-cols-2 gap-x-3 gap-y-9 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4">{filtered.map((product) => <ProductCard key={product.id} product={product} wished={wishlist.includes(product.id)} onWishlist={() => toggleWishlist(product.id)} onAdd={() => addToCart(product.id)} />)}</div> : <EmptyState title="Nothing in that corner yet." body="Try a different search or clear the filters to see the full edit." action="Clear filters" onAction={() => { setQuery(''); updateCategory('All'); }} />}
  </div>;
}

function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const product = products.find((item) => item.id === id);
  const { addToCart, wishlist, toggleWishlist } = useStore();
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  if (!product) return <NotFoundPage />;
  const related = products.filter((item) => item.category === product.category && item.id !== product.id).slice(0, 3);
  return <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-14">
    <Link href="/products" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary" data-testid="link-back-products"><ChevronLeft size={16} /> Back to shop</Link>
    <div className="grid gap-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-16">
      <div className="flex flex-col-reverse gap-3 sm:flex-row"><div className="flex gap-3 sm:w-20 sm:flex-col">{product.images.map((image, index) => <button key={image} onClick={() => setActiveImage(index)} className={`aspect-square w-16 overflow-hidden rounded-xl border-2 sm:w-20 ${index === activeImage ? 'border-primary' : 'border-transparent opacity-65'}`} aria-label={`Show product image ${index + 1}`} data-testid={`button-product-image-${index}`}><img src={image} alt="" className="h-full w-full object-cover" /></button>)}</div><div className="relative aspect-square min-w-0 flex-1 overflow-hidden rounded-[2rem] bg-secondary"><img src={product.images[activeImage]} alt={product.name} className="h-full w-full object-cover" /><div className="absolute left-5 top-5 flex gap-2">{product.isNew && <span className="rounded-full bg-[#f4ecdf] px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest">New arrival</span>}{product.discount && <span className="rounded-full bg-primary px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white">Save {product.discount}%</span>}</div></div></div>
      <div className="flex flex-col justify-center"><div className="mb-3 flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-[.18em] text-primary">{product.category}</span><button onClick={() => toggleWishlist(product.id)} className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary" data-testid="button-product-wishlist"><Heart size={18} fill={wishlist.includes(product.id) ? '#C8722E' : 'none'} color={wishlist.includes(product.id) ? '#C8722E' : 'currentColor'} /> {wishlist.includes(product.id) ? 'Saved' : 'Save for later'}</button></div><h1 className="font-display text-5xl leading-[.95] tracking-[-.055em] sm:text-6xl">{product.name}</h1><div className="mt-5 flex items-center gap-4"><span className="text-xl font-bold">{money(product.price)}</span>{product.oldPrice && <del className="text-sm text-muted-foreground">{money(product.oldPrice)}</del>}<span className="flex items-center gap-1 border-l border-border pl-4 text-sm"><Star size={15} fill="#D89B43" color="#D89B43" /> {product.rating} <span className="text-muted-foreground">/ 5</span></span></div><p className="mt-7 max-w-lg text-base leading-7 text-muted-foreground">{product.description}</p><div className="my-8 border-y border-border py-6"><h2 className="mb-4 text-xs font-bold uppercase tracking-[.18em] text-muted-foreground">Details</h2><ul className="grid gap-3 text-sm text-foreground sm:grid-cols-2">{product.specifications.map((spec) => <li key={spec} className="flex items-start gap-2"><Check size={16} className="mt-0.5 shrink-0 text-primary" />{spec}</li>)}</ul></div><div className="flex flex-col gap-3 sm:flex-row"><div className="flex h-12 items-center justify-between rounded-xl border border-border bg-card sm:w-36"><button onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="flex h-full w-11 items-center justify-center text-muted-foreground hover:text-foreground" aria-label="Decrease quantity" data-testid="button-decrease-quantity"><Minus size={16} /></button><span className="text-sm font-bold" data-testid="text-product-quantity">{quantity}</span><button onClick={() => setQuantity((value) => value + 1)} className="flex h-full w-11 items-center justify-center text-muted-foreground hover:text-foreground" aria-label="Increase quantity" data-testid="button-increase-quantity"><Plus size={16} /></button></div><button onClick={() => addToCart(product.id, quantity)} disabled={!product.inStock} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50" data-testid="button-product-add-to-cart"><ShoppingBag size={18} /> {product.inStock ? 'Add to cart' : 'Out of stock'}</button></div><p className="mt-4 flex items-center gap-2 text-xs font-semibold text-muted-foreground"><Truck size={15} className="text-primary" /> Ready to ship across Nairobi and beyond</p></div>
    </div>
    <div className="mt-20 border-t border-border pt-12"><div className="mb-8 flex items-end justify-between"><div><p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-primary">More to consider</p><h2 className="font-display text-4xl">From the same shelf</h2></div><div className="hidden gap-2 sm:flex"><button className="flex h-9 w-9 items-center justify-center rounded-full border border-border" data-testid="button-related-previous"><ChevronLeft size={16} /></button><button className="flex h-9 w-9 items-center justify-center rounded-full border border-border" data-testid="button-related-next"><ChevronRight size={16} /></button></div></div><div className="grid grid-cols-2 gap-4 sm:grid-cols-3">{related.map((item) => <ProductCard key={item.id} product={item} wished={wishlist.includes(item.id)} onWishlist={() => toggleWishlist(item.id)} onAdd={() => addToCart(item.id)} />)}</div></div>
  </div>;
}

function CartPage() {
  const [, setLocation] = useLocation();
  const { cart, updateQuantity, removeFromCart } = useStore();
  const items = cart.map((item) => ({ ...item, product: products.find((product) => product.id === item.id) })).filter((item): item is CartItem & { product: Product } => Boolean(item.product));
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const checkoutMessage = `Hello PikaVibe! I would like to order:\n${items.map((item) => `• ${item.product.name} × ${item.quantity} — ${money(item.product.price * item.quantity)}`).join('\n')}\n\nTotal: ${money(subtotal)}\nPlease let me know delivery options.`;
  return <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16"><div className="mb-10"><p className="mb-3 text-xs font-bold uppercase tracking-[.2em] text-primary">Your shortlist</p><h1 className="font-display text-5xl tracking-[-.05em] sm:text-7xl">Your cart.</h1></div>{items.length ? <div className="grid gap-8 lg:grid-cols-[1fr_360px]"><div className="divide-y divide-border border-y border-border">{items.map(({ product, quantity }) => <div key={product.id} className="flex gap-4 py-5 sm:gap-6"><Link href={`/products/${product.id}`} className="h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-secondary sm:h-36 sm:w-36" data-testid={`cart-product-image-${product.id}`}><img src={product.image} alt={product.name} className="h-full w-full object-cover" /></Link><div className="flex min-w-0 flex-1 flex-col justify-between py-1"><div><div className="mb-1 flex items-start justify-between gap-3"><div><span className="text-[10px] font-bold uppercase tracking-[.14em] text-primary">{product.category}</span><Link href={`/products/${product.id}`} className="mt-1 block font-display text-xl leading-tight hover:text-primary" data-testid={`cart-product-name-${product.id}`}>{product.name}</Link></div><button onClick={() => removeFromCart(product.id)} className="text-muted-foreground hover:text-destructive" aria-label={`Remove ${product.name}`} data-testid={`button-remove-${product.id}`}><Trash2 size={17} /></button></div><span className="text-sm font-bold">{money(product.price)}</span></div><div className="flex items-end justify-between"><div className="flex h-9 items-center rounded-lg border border-border"><button onClick={() => updateQuantity(product.id, quantity - 1)} className="flex h-full w-9 items-center justify-center text-muted-foreground hover:text-foreground" aria-label="Decrease item quantity" data-testid={`button-cart-decrease-${product.id}`}><Minus size={14} /></button><span className="min-w-6 text-center text-xs font-bold" data-testid={`text-cart-quantity-${product.id}`}>{quantity}</span><button onClick={() => updateQuantity(product.id, quantity + 1)} className="flex h-full w-9 items-center justify-center text-muted-foreground hover:text-foreground" aria-label="Increase item quantity" data-testid={`button-cart-increase-${product.id}`}><Plus size={14} /></button></div><span className="text-sm font-bold">{money(product.price * quantity)}</span></div></div></div>)}</div><aside className="h-fit rounded-2xl bg-[#3D2A1E] p-6 text-[#f4ecdf] sm:p-8 lg:sticky lg:top-28"><h2 className="font-display text-3xl">A good choice.</h2><div className="mt-6 space-y-3 border-b border-[#614b3a] pb-6 text-sm"><div className="flex justify-between"><span className="text-[#cdbbab]">Subtotal</span><span className="font-bold" data-testid="text-cart-subtotal">{money(subtotal)}</span></div><div className="flex justify-between"><span className="text-[#cdbbab]">Delivery</span><span className="font-bold text-[#e9b98b]">Confirmed on WhatsApp</span></div></div><div className="flex justify-between py-5 text-lg font-bold"><span>Total</span><span data-testid="text-cart-total">{money(subtotal)}</span></div><a href={whatsappUrl(checkoutMessage)} target="_blank" rel="noreferrer" className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#2E9B68] text-sm font-bold text-white transition-transform hover:-translate-y-0.5" data-testid="link-whatsapp-checkout"><MessageCircle size={18} /> Order via WhatsApp</a><p className="mt-4 text-center text-xs leading-5 text-[#bfae9e]">We'll confirm your delivery address, timing and payment options in the chat.</p></aside></div> : <EmptyState icon={<ShoppingBag size={25} />} title="Your cart is waiting for a good idea." body="Save something useful here, then come back when you're ready." action="Browse the shop" onAction={() => setLocation('/products')} />}</div>;
}

function AboutPage() {
  return <div><section className="bg-[#3D2A1E] px-4 py-16 text-[#f4ecdf] sm:px-6 lg:px-8 lg:py-24"><div className="mx-auto max-w-7xl"><p className="mb-5 text-xs font-bold uppercase tracking-[.2em] text-[#e9b98b]">Our point of view</p><h1 className="max-w-4xl font-display text-6xl leading-[.9] tracking-[-.06em] sm:text-8xl">A home is made in the <em className="text-[#e9b98b]">little things.</em></h1><p className="mt-8 max-w-xl text-lg leading-8 text-[#d5c6b4]">PikaVibe is a Kenyan kitchenware shop for people who want everyday cooking and home organisation to feel more beautiful, practical and considered.</p></div></section><section className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[.8fr_1.2fr] lg:px-8 lg:py-24"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-primary">Why we started</p><h2 className="mt-4 font-display text-5xl leading-none tracking-[-.045em]">Not more stuff. Better stuff.</h2></div><div className="space-y-6 text-base leading-8 text-muted-foreground"><p>We started PikaVibe because the things we use every day should earn their place. A pan that gets better with time. A storage jar that makes the pantry make sense. A brush that feels good to pick up.</p><p>Our edit is small on purpose. We choose pieces for real Kenyan homes — for busy mornings, generous family meals, tiny kitchens, big hosting energy and all the ordinary magic in between.</p><p className="font-display text-2xl leading-tight text-foreground">“Good design is not about showing off. It is about making the everyday feel looked after.”</p></div></section><section className="bg-[#ead9c0] px-4 py-16 sm:px-6 lg:px-8 lg:py-20"><div className="mx-auto max-w-7xl"><p className="mb-8 text-xs font-bold uppercase tracking-[.2em] text-primary">What matters to us</p><div className="grid gap-px overflow-hidden rounded-2xl border border-[#d5bfa4] bg-[#d5bfa4] md:grid-cols-3">{[['01', 'Useful first', 'Every piece should solve a real problem, and do it with a little grace.'], ['02', 'Made for living', 'We choose materials and shapes that can handle the way homes are actually used.'], ['03', 'Local at heart', 'Our lens is Kenyan: warm, resourceful, expressive and proudly our own.']].map(([number, title, body]) => <div key={number} className="bg-[#ead9c0] p-7 sm:p-10"><span className="font-display text-5xl text-[#c58c5a]">{number}</span><h3 className="mt-8 font-display text-3xl">{title}</h3><p className="mt-4 text-sm leading-6 text-[#765e4c]">{body}</p></div>)}</div></div></section><section className="mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 py-16 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8 lg:py-20"><h2 className="max-w-xl font-display text-4xl leading-tight sm:text-5xl">Ready to make your everyday a little more considered?</h2><Link href="/products" className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground" data-testid="about-shop-button">Browse the edit <ArrowRight size={17} /></Link></section></div>;
}

function ContactPage() {
  const [sent, setSent] = useState(false);
  return <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16"><div className="grid gap-12 lg:grid-cols-[.9fr_1.1fr] lg:gap-20"><div><p className="mb-3 text-xs font-bold uppercase tracking-[.2em] text-primary">Come say hello</p><h1 className="font-display text-6xl leading-[.9] tracking-[-.06em] sm:text-8xl">We'd love to <em className="text-primary">hear</em> from you.</h1><p className="mt-7 max-w-md text-base leading-7 text-muted-foreground">Questions about a product, a delivery or what would work best in your kitchen? Real people are on the other side of these details.</p><div className="mt-10 grid gap-5"><a href={whatsappUrl('Hello PikaVibe, I need some help.')} target="_blank" rel="noreferrer" className="flex items-center gap-4 rounded-2xl bg-[#3D2A1E] p-4 text-[#f4ecdf] transition-transform hover:-translate-y-0.5" data-testid="contact-whatsapp-link"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#2E9B68]"><MessageCircle size={20} /></span><span><span className="block text-sm font-bold">WhatsApp us</span><span className="mt-1 block text-xs text-[#cdbbab]">Quickest way to reach us</span></span><ArrowRight className="ml-auto" size={17} /></a><div className="grid gap-4 sm:grid-cols-2"><div className="rounded-2xl border border-border bg-card p-5"><MapPin size={19} className="mb-4 text-primary" /><p className="text-sm font-bold">Based in Nairobi</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Delivering across Kenya</p></div><div className="rounded-2xl border border-border bg-card p-5"><Clock size={19} className="mb-4 text-primary" /><p className="text-sm font-bold">Mon – Sat</p><p className="mt-1 text-xs leading-5 text-muted-foreground">9:00 am – 6:00 pm EAT</p></div></div></div></div><div className="rounded-[2rem] bg-[#ead9c0] p-6 sm:p-10"><p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-primary">Send a note</p><h2 className="font-display text-4xl">What can we help with?</h2>{sent ? <div className="mt-10 rounded-2xl bg-[#3D2A1E] p-8 text-center text-[#f4ecdf]"><Check className="mx-auto mb-4 text-[#e9b98b]" size={28} /><h3 className="font-display text-3xl">Message received.</h3><p className="mt-3 text-sm leading-6 text-[#cdbbab]">Thanks for reaching out. We'll get back to you soon.</p><button onClick={() => setSent(false)} className="mt-6 text-xs font-bold uppercase tracking-widest text-[#e9b98b] underline underline-offset-4" data-testid="button-send-another">Send another note</button></div> : <form onSubmit={(event) => { event.preventDefault(); setSent(true); }} className="mt-8 grid gap-5"><label className="grid gap-2 text-xs font-bold uppercase tracking-[.12em]">Your name<input required type="text" className="rounded-xl border border-[#d1b99c] bg-[#f7efe4] px-4 py-3.5 text-sm font-normal normal-case tracking-normal outline-none focus:ring-2 focus:ring-primary" data-testid="input-contact-name" /></label><label className="grid gap-2 text-xs font-bold uppercase tracking-[.12em]">Email or phone<input required type="text" className="rounded-xl border border-[#d1b99c] bg-[#f7efe4] px-4 py-3.5 text-sm font-normal normal-case tracking-normal outline-none focus:ring-2 focus:ring-primary" data-testid="input-contact-email" /></label><label className="grid gap-2 text-xs font-bold uppercase tracking-[.12em]">Your message<textarea required rows={5} className="resize-none rounded-xl border border-[#d1b99c] bg-[#f7efe4] px-4 py-3.5 text-sm font-normal normal-case tracking-normal outline-none focus:ring-2 focus:ring-primary" data-testid="textarea-contact-message" /></label><button type="submit" className="flex h-12 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground" data-testid="button-send-message">Send message <ArrowRight size={17} /></button></form>}</div></div><div className="mt-16 border-t border-border pt-8 text-center text-sm text-muted-foreground"><p className="flex items-center justify-center gap-2"><Mail size={15} className="text-primary" /> hello@pikavibe.co.ke <span className="mx-2 text-border">·</span><Phone size={15} className="text-primary" /> +254 201 023 279</p></div></div>;
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