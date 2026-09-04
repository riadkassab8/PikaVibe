import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { Bell, LayoutDashboard, Package, ShoppingCart, Tags, Users, Settings, LogOut, Plus, Search, X, Save, RefreshCw } from 'lucide-react';
import { closeAlert, confirmAction, notifyError, notifyInfo, notifySuccess, showLoading } from '@/lib/alerts';
import { createCategory, createProduct, deleteCategory, deleteProduct, fetchAdminStoreSettings, fetchCategories, fetchCoupons, fetchDashboard, fetchOrders, fetchProducts, subscribeToNewOrders, createCoupon, updateCoupon, deleteCoupon, updateCategory, updateOrderStatus, updateProduct, updateStoreSettings, type AdminCategory, type AdminOrder, type ApiProduct, type Coupon, type CouponInput, type StoreSettings, defaultStoreSettings } from '@/lib/api';

type DashboardStats = Awaited<ReturnType<typeof fetchDashboard>>;
type ProductForm = { id?: number; name: string; nameAr: string; nameEn: string; slug: string; category: string; price: string; oldPrice: string; discountPercent: string; discountActive: boolean; discountStartsAt: string; discountEndsAt: string; installmentAvailable: boolean; installmentMinMonths: string; installmentMaxMonths: string; stock: string; description: string; imageUrl: string; images: string; specifications: string; variants: string; featured: boolean; active: boolean };
const fallbackCategories = ['Cookware', 'Storage', 'Cleaning', 'Bathroom', 'Small Appliances', 'Dining'];
const statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const emptyForm: ProductForm = { name: '', nameAr: '', nameEn: '', slug: '', category: 'Cookware', price: '', oldPrice: '', discountPercent: '', discountActive: false, discountStartsAt: '', discountEndsAt: '', installmentAvailable: false, installmentMinMonths: '2', installmentMaxMonths: '6', stock: '0', description: '', imageUrl: '', images: '[]', specifications: '', variants: '[]', featured: false, active: true };
const money = (value: number) => `ج.م ${Number(value || 0).toLocaleString('ar-EG')}`;
type DashboardLanguage = 'ar' | 'en';
const dashboardEnglish: Record<string, string> = {
  'إدارة متجر PikaVibe': 'PikaVibe Store Admin',
  'لوحة تحكم الأدمن': 'Admin Dashboard',
  'التحديث اللحظي متصل': 'Realtime connected',
  'جاري الاتصال بالتحديث اللحظي': 'Connecting to realtime updates',
  'تحديث': 'Refresh',
  'تسجيل الخروج': 'Log out',
  'طلب جديد وصل الآن': 'New order received',
  'عرض الطلب': 'View order',
  'إغلاق إشعار الطلب': 'Close order notification',
  'الرئيسية': 'Overview',
  'المنتجات والمخزون': 'Products & inventory',
  'الطلبات': 'Orders',
  'العملاء': 'Customers',
  'الأقسام': 'Categories',
  'الإعدادات': 'Settings',
  'الإيرادات': 'Revenue',
  'كل الطلبات غير الملغاة': 'All non-cancelled orders',
  'إجمالي الطلبات': 'Total orders',
  'قيد الانتظار': 'pending',
  'المنتجات': 'Products',
  'مخزون منخفض': 'low stock',
  'تم التسليم': 'Delivered',
  'قيد الشحن': 'shipped',
  'ملخص المتجر': 'Store summary',
  'نظرة عامة': 'Overview',
  'أحدث الطلبات': 'Recent orders',
  'طلبات الضيوف تظهر هنا بدون الحاجة إلى حساب للعميل.': 'Guest orders appear here without requiring a customer account.',
  'إجمالي:': 'Total:',
  'عرض التفاصيل': 'View details',
  'لا توجد طلبات حتى الآن.': 'No orders yet.',
  'جارٍ التحقق من صلاحيات الأدمن…': 'Checking admin permissions…',
  'تسجيل الخروج؟': 'Log out?',
  'سيتم إنهاء جلسة الأدمن الحالية.': 'Your current admin session will end.',
  'جارٍ تحديث المنتج…': 'Updating product…',
  'جارٍ إضافة المنتج…': 'Adding product…',
  'تم تحديث المنتج': 'Product updated',
  'تمت إضافة المنتج': 'Product added',
  'تم حفظ بيانات المنتج بنجاح.': 'Product data saved successfully.',
  'يرجى مراجعة بيانات المنتج.': 'Please review the product data.',
  'تعذر حفظ المنتج': 'Could not save product',
  'جارٍ تحديث حالة المنتج…': 'Updating product status…',
  'تم تحديث حالة المنتج': 'Product status updated',
  'تعذر تحديث حالة المنتج': 'Could not update product status',
  'تعطيل المنتج؟': 'Disable product?',
  'سيختفي «': '“',
  '» من المتجر، ويمكنك إعادته لاحقًا.': '” will be hidden from the store and can be restored later.',
  'جارٍ تعطيل المنتج…': 'Disabling product…',
  'تم تعطيل المنتج': 'Product disabled',
  'الاسم الأساسي': 'Primary name',
  'الاسم بالعربي': 'Arabic name',
  'الاسم بالإنجليزي': 'English name',
  'الرابط المختصر': 'Slug',
  'السعر (جنيه مصري)': 'Price (EGP)',
  'السعر القديم (اختياري)': 'Old price (optional)',
  'نسبة الخصم (اختياري)': 'Discount percentage (optional)',
  'المخزون': 'Stock',
  'تفعيل التقسيط لهذا المنتج': 'Enable installments for this product',
  'حدد الحد الأدنى والأقصى لمدة التقسيط بالأشهر ليظهر للعميل.': 'Set the minimum and maximum installment duration in months shown to customers.',
  'الحد الأدنى (شهور)': 'Minimum months',
  'الحد الأقصى (شهور)': 'Maximum months',
  'التقسيط متاح': 'Installments available',
  'من': 'From',
  'إلى': 'to',
  'القسم': 'Category',
  'الوصف': 'Description',
  'المواصفات (مفصولة بفواصل)': 'Specifications (comma separated)',
  'تفعيل الخصم لهذا المنتج': 'Enable discount for this product',
  'يحسب السيرفر السعر النهائي. اترك التواريخ فارغة ليستمر الخصم حتى تقوم بإيقافه.': 'The server calculates the final price. Leave dates empty to keep the discount active until you disable it.',
  'يبدأ في': 'Starts at',
  'ينتهي في (اختياري)': 'Ends at (optional)',
  'منتج مميز': 'Featured product',
  'ظاهر في المتجر': 'Visible in store',
  'مفعل': 'Active',
  'هذا المنتج لديه اختيارات': 'This product has options',
  'أضف اختيارات مثل اللون أو المقاس أو السعة أو الخامة. سيرى العميل هذه الاختيارات في صفحة المنتج.': 'Add options such as color, size, capacity, or material. Customers will see them on the product page.',
  'اسم الاختيار (مثال: اللون)': 'Option name (e.g. Color)',
  'قيمة الاختيار (مثال: أسود)': 'Option value (e.g. Black)',
  'إضافة اختيار آخر': 'Add another option',
  'إضافة مجموعة اختيارات': 'Add option group',
  'صور المنتج': 'Product images',
  'ارفع صورة أو أكثر من جهازك. أول صورة ستكون الصورة الأساسية.': 'Upload one or more images from your device. The first image will be the primary image.',
  'رفع صورة': 'Upload image',
  'الصورة الأساسية': 'Primary image',
  'حذف الصورة': 'Delete image',
  'إضافة منتج': 'Add product',
  'تعديل المنتج': 'Edit product',
  'حفظ المنتج': 'Save product',
  'إدارة وتنفيذ الطلبات': 'Order management and fulfillment',
  'ابحث برقم الطلب أو الاسم أو الهاتف': 'Search by order number, name, or phone',
  'كل الحالات': 'All statuses',
  'تفاصيل الطلب': 'Order details',
  'العميل': 'Customer',
  'التوصيل': 'Delivery',
  'الدفع': 'Payment',
  'الدفع عند الاستلام': 'Cash on delivery',
  'الإجمالي': 'Total',
  'تغيير الحالة': 'Change status',
  'لا توجد طلبات مطابقة.': 'No matching orders.',
  'إدارة العملاء': 'Customer management',
  'لا يوجد عملاء مسجلون.': 'No registered customers.',
  'هيكل المتجر': 'Store structure',
  'إدارة الأقسام': 'Category management',
  'من هنا تتحكم بشكل مباشر في الأقسام الظاهرة للعملاء.': 'Control which categories are visible to customers.',
  'اسم القسم بالعربي': 'Category name in Arabic',
  'Category name in English': 'Category name in English',
  'حفظ التعديل': 'Save changes',
  'إضافة قسم': 'Add category',
  'إلغاء': 'Cancel',
  'إجمالي الأقسام': 'Total categories',
  'مخفي عن المتجر': 'Hidden from store',
  'ظاهر الآن': 'Visible now',
  'مخفي الآن': 'Hidden now',
  'منتج داخل هذا القسم': 'products in this category',
  'تعديل': 'Edit',
  'حذف': 'Delete',
  'لا توجد أقسام. أضف أول قسم من الزر أعلاه.': 'No categories. Add the first category above.',
  'بيانات القسم ناقصة': 'Incomplete category data',
  'اكتب الاسم بالعربي والاسم بالإنجليزي.': 'Enter both the Arabic and English names.',
  'حذف القسم؟': 'Delete category?',
  'تم حذف القسم': 'Category deleted',
  'تعذر حفظ القسم': 'Could not save category',
  'تعذر حذف القسم': 'Could not delete category',
  'تعذر تحديث القسم': 'Could not update category',
  'جارٍ إضافة القسم…': 'Adding category…',
  'جارٍ تحديث القسم…': 'Updating category…',
  'تم تحديث القسم': 'Category updated',
  'تمت إضافة القسم': 'Category added',
  'تفعيل العروض والخصومات': 'Offers and discounts',
  'إدارة العروض': 'Offer management',
  'لا يوجد عرض مفعل': 'No active offer',
  'نسبة الخصم': 'Discount percentage',
  'ينتهي': 'Ends',
  'حفظ العرض': 'Save offer',
  'جارٍ حفظ العرض…': 'Saving offer…',
  'تم حفظ العرض': 'Offer saved',
  'تعذر حفظ العرض': 'Could not save offer',
  'تحديث المخزون': 'Update stock',
  'جارٍ تحديث المخزون…': 'Updating stock…',
  'تم تحديث المخزون': 'Stock updated',
  'تعذر تحديث المخزون': 'Could not update stock'

};
const dashboardArabic: Record<string, string> = Object.fromEntries(Object.entries(dashboardEnglish).map(([key, value]) => [value, key]));
function localizeDashboardDom(root: HTMLElement, language: DashboardLanguage) {
  const dictionary = language === 'ar' ? dashboardArabic : dashboardEnglish;
  const translate = (value: string) => {
    let translated = value.trim();
    Object.entries(dictionary).sort(([a], [b]) => b.length - a.length).forEach(([from, to]) => {
      translated = translated.replaceAll(from, to);
    });
    return translated;
  };
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  nodes.forEach((node) => { const original = node.nodeValue || ''; const next = translate(original); if (next !== original.trim()) node.nodeValue = original.replace(original.trim(), next); });
  root.querySelectorAll<HTMLElement>('[placeholder],[aria-label]').forEach((element) => ['placeholder', 'aria-label'].forEach((attribute) => { const value = element.getAttribute(attribute); if (value) element.setAttribute(attribute, translate(value)); }));
}

function parseImageList(value: string): string[] {
  try {
    const parsed = JSON.parse(value || '[]');
    if (Array.isArray(parsed)) return parsed.filter(Boolean).map(String);
  } catch { /* support older comma-separated image values */ }
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [ready, setReady] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [newOrderNotice, setNewOrderNotice] = useState<AdminOrder | null>(null);
  const [language, setLanguage] = useState<DashboardLanguage>(() => (localStorage.getItem('pikavibe-admin-language') as DashboardLanguage) || 'ar');
  useEffect(() => {
    localStorage.setItem('pikavibe-admin-language', language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    const root = document.getElementById('admin-dashboard-root');
    if (!root) return;
    localizeDashboardDom(root, language);
    const observer = new MutationObserver(() => localizeDashboardDom(root, language));
    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [language, ready]);

  useEffect(() => {
    if (!localStorage.getItem('pikavibe-admin-token')) setLocation('/login?admin=true');
    else setReady(true);
  }, [setLocation]);

  const refresh = async () => {
    setLoading(true);
    try {
      const [productData, categoryData, orderData, dashboardData] = await Promise.all([fetchProducts(true), fetchCategories(true), fetchOrders(), fetchDashboard()]);
      setProducts(productData);
      setCategories(categoryData);
      setOrders(orderData);
      setStats(dashboardData);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { if (ready) refresh(); }, [ready]);
  useEffect(() => {
    if (!ready) return;
    const unsubscribe = subscribeToNewOrders((newOrder) => {
      setOrders((current) => current.some((order) => order.id === newOrder.id) ? current : [newOrder, ...current]);
      setStats((current) => current ? { ...current, totalOrders: current.totalOrders + 1, pendingOrders: newOrder.status === 'pending' ? current.pendingOrders + 1 : current.pendingOrders, revenue: newOrder.status === 'cancelled' ? current.revenue : current.revenue + newOrder.total } : current);
      setNewOrderNotice(newOrder);
      void notifyInfo('طلب جديد وصل الآن 🔔', `${newOrder.orderNumber} · ${newOrder.customer.name} · ${money(newOrder.total)}`).then(() => setActiveTab('orders'));
    }, setRealtimeConnected);
    return unsubscribe;
  }, [ready]);

  if (!ready) return <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">جارٍ التحقق من صلاحيات الأدمن…</div>;
  const logout = async () => { const result = await confirmAction('تسجيل الخروج؟', 'سيتم إنهاء جلسة الأدمن الحالية.'); if (!result.isConfirmed) return; localStorage.removeItem('pikavibe-admin-token'); setLocation('/login?admin=true'); };
  const tabs = [
    { id: 'overview', label: 'الرئيسية', icon: LayoutDashboard },
    { id: 'products', label: 'المنتجات والمخزون', icon: Package },
    { id: 'orders', label: 'الطلبات', icon: ShoppingCart },
    { id: 'customers', label: 'العملاء', icon: Users },
    { id: 'categories', label: 'الأقسام', icon: Tags },
    { id: 'settings', label: 'الإعدادات', icon: Settings },
  ];

  return <div id="admin-dashboard-root" dir={language === 'ar' ? 'rtl' : 'ltr'} className={`min-h-screen bg-background ${language === 'ar' ? 'text-right' : 'text-left'}`}>
    <header className="border-b border-border bg-card"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">إدارة متجر PikaVibe</p><h1 className="font-display text-3xl text-foreground">لوحة تحكم الأدمن</h1></div><div className="flex items-center gap-2"><span className={`hidden items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold sm:flex ${realtimeConnected ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}><span className={`h-2 w-2 rounded-full ${realtimeConnected ? 'bg-green-600' : 'bg-yellow-600'}`} />{realtimeConnected ? 'التحديث اللحظي متصل' : 'جاري الاتصال بالتحديث اللحظي'}</span><button onClick={refresh} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted" disabled={loading}><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> تحديث</button><button onClick={() => setLanguage((current) => current === 'ar' ? 'en' : 'ar')} className="rounded-lg border border-border px-3 py-2 text-sm font-bold hover:bg-muted" aria-label={language === 'ar' ? 'English' : 'العربية'}>{language === 'ar' ? 'English' : 'العربية'}</button><button onClick={logout} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"><LogOut className="h-4 w-4" /> تسجيل الخروج</button></div></div></header>
    {newOrderNotice && <div className="mx-auto mt-5 flex max-w-7xl items-center gap-4 rounded-2xl border border-[#e5a66f] bg-[#fff1df] px-5 py-4 text-[#3D2A1E] shadow-soft"><Bell className="shrink-0 text-primary" /><div className="min-w-0 flex-1"><p className="font-bold">طلب جديد وصل الآن</p><p className="truncate text-sm">{newOrderNotice.orderNumber} · {newOrderNotice.customer.name} · {money(newOrderNotice.total)}</p></div><button onClick={() => { setActiveTab('orders'); setNewOrderNotice(null); }} className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground">عرض الطلب</button><button onClick={() => setNewOrderNotice(null)} aria-label="إغلاق إشعار الطلب" className="rounded-lg p-2 hover:bg-[#f4d7b7]"><X className="h-4 w-4" /></button></div>}
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:flex-row lg:px-8"><aside className="lg:w-64 lg:shrink-0"><nav className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1">{tabs.map((tab) => { const Icon = tab.icon; return <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${activeTab === tab.id ? 'bg-primary text-primary-foreground shadow-soft' : 'text-foreground hover:bg-muted'}`}><Icon className="h-5 w-5" />{tab.label}</button>; })}</nav></aside>
      <main className="min-w-0 flex-1">{activeTab === 'overview' && <Overview stats={stats} orders={orders} loading={loading} onOpenOrders={() => setActiveTab('orders')} />}{activeTab === 'products' && <ProductsManagement products={products} categories={categories.length ? categories.filter((category) => category.active).map((category) => category.name) : fallbackCategories} onRefresh={refresh} />}{activeTab === 'orders' && <OrdersManagement orders={orders} onRefresh={refresh} />}{activeTab === 'customers' && <CustomersManagement orders={orders} />}{activeTab === 'categories' && <CategoryManagement categories={categories} products={products} onRefresh={refresh} />}{activeTab === 'settings' && <SettingsPanel categories={categories} products={products} onRefresh={refresh} />}</main>
    </div>
  </div>;
}

function Overview({ stats, orders, loading, onOpenOrders }: { stats: DashboardStats | null; orders: AdminOrder[]; loading: boolean; onOpenOrders: () => void }) {
  const cards = [
    ['الإيرادات', stats ? money(stats.revenue) : '—', 'كل الطلبات غير الملغاة'],
    ['إجمالي الطلبات', stats?.totalOrders ?? '—', `${stats?.pendingOrders ?? 0} قيد الانتظار`],
    ['المنتجات', stats?.totalProducts ?? '—', `${stats?.lowStockProducts ?? 0} مخزون منخفض`],
    ['تم التسليم', stats?.deliveredOrders ?? '—', `${stats?.shippedOrders ?? 0} قيد الشحن`],
  ];
  return <div className="space-y-6"><div><p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-primary">ملخص المتجر</p><h2 className="font-display text-5xl tracking-[-.05em]">نظرة عامة</h2></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value, note]) => <div key={label} className="rounded-2xl border border-border bg-card p-5 shadow-soft"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-bold text-foreground">{loading ? '…' : value}</p><p className="mt-1 text-xs text-muted-foreground">{note}</p></div>)}</div><div className="rounded-2xl border border-border bg-card p-6 shadow-soft"><div className="mb-5 flex items-center justify-between"><div><h3 className="font-display text-2xl">أحدث الطلبات</h3><p className="text-sm text-muted-foreground">طلبات الضيوف تظهر هنا بدون الحاجة إلى حساب للعميل.</p></div><span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold">إجمالي: {orders.length}</span></div>{orders.slice(0, 6).map((order) => <div key={order.id} className="flex flex-col gap-2 border-t border-border py-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">{order.orderNumber}</p><p className="text-sm text-muted-foreground">{order.customer.name} · {order.customer.phone}</p></div><div className="flex items-center gap-4"><span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold capitalize">{order.status}</span><span className="text-sm font-bold">{money(order.total)}</span><button onClick={onOpenOrders} className="text-xs font-bold text-primary hover:underline">عرض التفاصيل</button></div></div>)}{!orders.length && <p className="py-8 text-center text-sm text-muted-foreground">لا توجد طلبات حتى الآن.</p>}</div></div>;
}

function toProductForm(product: ApiProduct): ProductForm {
  return { id: product.backendId, name: product.name, nameAr: product.nameAr || product.name, nameEn: product.nameEn || product.name, slug: product.id, category: product.category, price: String(product.basePrice ?? product.price), oldPrice: product.oldPrice ? String(product.oldPrice) : '', discountPercent: product.discountPercent ? String(product.discountPercent) : '', discountActive: Boolean(product.discountActive), discountStartsAt: product.discountStartsAt ? String(product.discountStartsAt).slice(0, 16) : '', discountEndsAt: product.discountEndsAt ? String(product.discountEndsAt).slice(0, 16) : '', installmentAvailable: Boolean(product.installmentAvailable), installmentMinMonths: String(product.installmentMinMonths ?? 2), installmentMaxMonths: String(product.installmentMaxMonths ?? 6), stock: String(product.stock), description: product.description, imageUrl: product.image, images: JSON.stringify(product.images || []), specifications: product.specifications.join(', '), variants: JSON.stringify(product.variants || []), featured: Boolean(product.isBestSeller), active: product.active !== false };
}

function ProductsManagement({ products, categories, onRefresh }: { products: ApiProduct[]; categories: string[]; onRefresh: () => Promise<void> }) {
  const [form, setForm] = useState<ProductForm | null>(null);
  const [error, setError] = useState('');
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError(''); if (!form) return;
    try {
      const variants = JSON.parse(form.variants || '[]');
      const payload = { name: form.nameEn || form.nameAr || form.name, nameAr: form.nameAr || null, nameEn: form.nameEn || null, slug: form.slug || form.nameEn || form.nameAr || form.name, category: form.category, price: Number(form.price), oldPrice: form.oldPrice ? Number(form.oldPrice) : null, discountPercent: form.discountPercent ? Number(form.discountPercent) : 0, discountActive: form.discountActive, discountStartsAt: form.discountStartsAt || null, discountEndsAt: form.discountEndsAt || null, installmentAvailable: form.installmentAvailable, installmentMinMonths: form.installmentAvailable ? Number(form.installmentMinMonths) : null, installmentMaxMonths: form.installmentAvailable ? Number(form.installmentMaxMonths) : null, stock: Number(form.stock), description: form.description, imageUrl: form.imageUrl || parseImageList(form.images)[0] || '', images: parseImageList(form.images), specifications: form.specifications.split(',').map((value) => value.trim()).filter(Boolean), variants, featured: form.featured, active: form.active };
      showLoading(form.id ? 'جارٍ تحديث المنتج…' : 'جارٍ إضافة المنتج…');
      if (form.id) await updateProduct(form.id, payload); else await createProduct(payload);
      closeAlert(); setForm(null); await onRefresh(); await notifySuccess(form.id ? 'تم تحديث المنتج' : 'تمت إضافة المنتج', 'تم حفظ بيانات المنتج بنجاح.');
    } catch (submitError) { closeAlert(); const message = submitError instanceof Error ? submitError.message : 'يرجى مراجعة بيانات المنتج.'; setError(message); await notifyError('تعذر حفظ المنتج', message); }
  };
  const saveStock = async (product: ApiProduct, stock: number) => {
    if (!product.backendId) return;
    try {
      await updateProduct(product.backendId, { ...product, stock: Math.max(0, stock), active: product.active !== false });
      await onRefresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'تعذر تحديث المخزون.');
    }
  };
  const toggleActive = async (product: ApiProduct) => { if (!product.backendId) return; showLoading('جارٍ تحديث حالة المنتج…'); try { await updateProduct(product.backendId, { ...product, active: product.active === false }); closeAlert(); await onRefresh(); await notifySuccess('تم تحديث حالة المنتج'); } catch (error) { closeAlert(); await notifyError('تعذر تحديث حالة المنتج', error instanceof Error ? error.message : 'حدث خطأ غير متوقع.'); } };
  const remove = async (product: ApiProduct) => { if (!product.backendId) return; const result = await confirmAction('تعطيل المنتج؟', `سيختفي «${product.name}» من المتجر، ويمكنك إعادته لاحقًا.`); if (!result.isConfirmed) return; showLoading('جارٍ تعطيل المنتج…'); try { await deleteProduct(product.backendId); closeAlert(); await onRefresh(); await notifySuccess('تم تعطيل المنتج'); } catch (error) { closeAlert(); await notifyError('تعذر تعطيل المنتج', error instanceof Error ? error.message : 'حدث خطأ غير متوقع.'); } };
  return <div className="space-y-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-primary">المنتجات والمخزون</p><h2 className="font-display text-5xl tracking-[-.05em]">المنتجات</h2></div><button onClick={() => setForm(emptyForm)} className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground"><Plus className="h-4 w-4" /> إضافة منتج</button></div>{form && <ProductForm form={form} setForm={setForm} submit={submit} error={error} categories={categories} />}
    <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-soft"><table className="w-full min-w-[760px]"><thead><tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground"><th className="px-5 py-4">المنتج</th><th className="px-5 py-4">القسم</th><th className="px-5 py-4">السعر</th><th className="px-5 py-4">المخزون</th><th className="px-5 py-4">الحالة</th><th className="px-5 py-4">الإجراءات</th></tr></thead><tbody>{products.map((product) => <tr key={product.backendId || product.id} className="border-b border-border last:border-0"><td className="px-5 py-4"><div className="flex items-center gap-3"><img src={product.image} alt="" className="h-12 w-12 rounded-xl object-cover" /><div><p className="font-semibold">{product.name}</p><p className="text-xs text-muted-foreground">{product.id}</p></div></div></td><td className="px-5 py-4 text-sm text-muted-foreground">{product.category}</td><td className="px-5 py-4 text-sm font-bold">{money(product.price)}</td><td className="px-5 py-4"><div className="flex items-center gap-2"><button onClick={() => saveStock(product, product.stock - 1)} className="h-8 w-8 rounded-lg border border-border hover:bg-muted">−</button><span className="w-8 text-center text-sm font-bold">{product.stock}</span><button onClick={() => saveStock(product, product.stock + 1)} className="h-8 w-8 rounded-lg border border-border hover:bg-muted">+</button></div></td><td className="px-5 py-4"><button onClick={() => toggleActive(product)} className={`rounded-full px-3 py-1 text-xs font-bold ${product.active === false ? 'bg-muted text-muted-foreground' : product.stock <= 5 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>{product.active === false ? 'غير مفعل' : product.stock <= 5 ? 'مخزون منخفض' : 'مفعل'}</button></td><td className="px-5 py-4"><div className="flex gap-3 text-sm font-semibold"><button onClick={() => setForm(toProductForm(product))} className="text-primary hover:underline">تعديل</button><button onClick={() => remove(product)} className="text-destructive hover:underline">تعطيل</button></div></td></tr>)}</tbody></table>{!products.length && <p className="p-10 text-center text-sm text-muted-foreground">لا توجد منتجات. أضف أول منتج الآن.</p>}</div></div>;
}

type VariantDraft = { name: string; options: string[] };

function readVariants(value: string): VariantDraft[] {
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed.filter((item) => item && typeof item.name === 'string' && Array.isArray(item.options)).map((item) => ({ name: item.name, options: item.options.map(String) })) : [];
  } catch { return []; }
}

function VariantEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [enabled, setEnabled] = useState(() => readVariants(value).length > 0);
  const [groups, setGroups] = useState<VariantDraft[]>(() => readVariants(value));
  const commit = (next: VariantDraft[]) => { setGroups(next); onChange(JSON.stringify(next.filter((group) => group.name.trim() && group.options.some((option) => option.trim())).map((group) => ({ name: group.name.trim(), options: group.options.map((option) => option.trim()).filter(Boolean) })))); };
  const toggle = (checked: boolean) => { setEnabled(checked); if (!checked) commit([]); else if (!groups.length) commit([{ name: '', options: [''] }]); };
  const updateGroup = (index: number, patch: Partial<VariantDraft>) => commit(groups.map((group, i) => i === index ? { ...group, ...patch } : group));
  const addGroup = () => commit([...groups, { name: '', options: [''] }]);
  const removeGroup = (index: number) => commit(groups.filter((_, i) => i !== index));
  const addOption = (index: number) => updateGroup(index, { options: [...groups[index].options, ''] });
  const updateOption = (groupIndex: number, optionIndex: number, value: string) => updateGroup(groupIndex, { options: groups[groupIndex].options.map((option, i) => i === optionIndex ? value : option) });
  const removeOption = (groupIndex: number, optionIndex: number) => updateGroup(groupIndex, { options: groups[groupIndex].options.filter((_, i) => i !== optionIndex) });
  return <div className="sm:col-span-2 rounded-xl border border-border bg-background p-4"><div className="flex items-start gap-3"><input id="has-variants" type="checkbox" checked={enabled} onChange={(event) => toggle(event.target.checked)} className="mt-1 h-4 w-4 accent-primary" /><div><label htmlFor="has-variants" className="text-sm font-bold text-foreground">هذا المنتج لديه اختيارات</label><p className="mt-1 text-xs font-normal normal-case tracking-normal text-muted-foreground">أضف اختيارات مثل اللون أو المقاس أو السعة أو الخامة. سيرى العميل هذه الاختيارات في صفحة المنتج.</p></div></div>{enabled && <div className="mt-4 space-y-4">{groups.map((group, groupIndex) => <div key={groupIndex} className="rounded-xl border border-border p-3"><div className="flex gap-2"><input value={group.name} onChange={(event) => updateGroup(groupIndex, { name: event.target.value })} placeholder="اسم الاختيار (مثال: اللون)" className="min-w-0 flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" /><button type="button" onClick={() => removeGroup(groupIndex)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-destructive"><X className="h-4 w-4" /></button></div><div className="mt-3 space-y-2">{group.options.map((option, optionIndex) => <div key={optionIndex} className="flex items-center gap-2"><input type="checkbox" checked readOnly className="h-4 w-4 accent-primary" /><input value={option} onChange={(event) => updateOption(groupIndex, optionIndex, event.target.value)} placeholder="قيمة الاختيار (مثال: أسود)" className="min-w-0 flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" /><button type="button" onClick={() => removeOption(groupIndex, optionIndex)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-destructive"><X className="h-4 w-4" /></button></div>)}<button type="button" onClick={() => addOption(groupIndex)} className="text-xs font-bold text-primary hover:underline">+ إضافة اختيار آخر</button></div></div>)}<button type="button" onClick={addGroup} className="rounded-lg border border-border px-3 py-2 text-xs font-bold text-foreground hover:bg-muted">+ إضافة مجموعة اختيارات</button></div>}</div>;
}

function ImageUploadField({ form, setForm }: { form: ProductForm; setForm: (form: ProductForm) => void }) {
  const images = parseImageList(form.images);
  const updateImages = (next: string[]) => setForm({ ...form, imageUrl: next[0] || '', images: JSON.stringify(next) });
  const readImage = (file: File) => new Promise<string>((resolve, reject) => {
    if (!file.type.startsWith('image/')) { reject(new Error('يمكن رفع ملفات الصور فقط.')); return; }
    if (file.size > 5 * 1024 * 1024) { reject(new Error('حجم الصورة يجب ألا يتجاوز 5 ميجابايت.')); return; }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('تعذر قراءة الصورة.'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('الصورة غير صالحة.'));
      image.onload = () => {
        const maxSize = 1400;
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.82));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
  const onFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    try { updateImages([...images, ...(await Promise.all(files.map(readImage)))]); }
    catch (error) { await notifyError('تعذر رفع الصورة', error instanceof Error ? error.message : 'حدث خطأ غير متوقع.'); }
    event.target.value = '';
  };
  return <div className="sm:col-span-2 rounded-xl border border-dashed border-primary/40 bg-background p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">صور المنتج</p><p className="mt-1 text-xs text-muted-foreground">ارفع صورة أو أكثر من جهازك. أول صورة ستكون الصورة الأساسية.</p></div><label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground"><Plus className="h-4 w-4" /> رفع صورة<input type="file" accept="image/*" multiple onChange={onFiles} className="hidden" /></label></div>{images.length > 0 && <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{images.map((image, index) => <div key={`${image.slice(0, 30)}-${index}`} className="relative overflow-hidden rounded-xl border border-border bg-card"><img src={image} alt={`صورة المنتج ${index + 1}`} className="aspect-square w-full object-cover" /><button type="button" onClick={() => updateImages(images.filter((_, imageIndex) => imageIndex !== index))} className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-destructive shadow" aria-label="حذف الصورة"><X className="h-4 w-4" /></button>{index === 0 && <span className="absolute bottom-2 right-2 rounded-md bg-black/70 px-2 py-1 text-[10px] font-bold text-white">الصورة الأساسية</span>}</div>)}</div>}</div>;
}

function ProductForm({ form, setForm, submit, error, categories }: { form: ProductForm; setForm: (form: ProductForm | null) => void; submit: (event: React.FormEvent) => Promise<void>; error: string; categories: string[] }) {
  const set = (key: keyof ProductForm, value: string | boolean) => setForm({ ...form, [key]: value });
  const field = (label: string, key: keyof ProductForm, type = 'text') => <label className="grid gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}<input dir={key === 'nameAr' ? 'rtl' : key === 'nameEn' || type === 'number' || key === 'slug' ? 'ltr' : undefined} type={type} value={String(form[key])} onChange={(event) => set(key, event.target.value)} className="rounded-xl border border-border bg-background px-4 py-3 text-sm font-normal normal-case tracking-normal text-foreground outline-none focus:ring-2 focus:ring-primary" /></label>;
  return <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-6 shadow-soft"><div className="mb-5 flex items-center justify-between"><div><h3 className="font-display text-2xl">{form.id ? 'تعديل المنتج' : 'إضافة منتج'}</h3><p className="text-sm text-muted-foreground">إدارة المنتجات والمخزون من مكان واحد.</p></div><button type="button" onClick={() => setForm(null)}><X className="h-5 w-5" /></button></div><div className="grid gap-4 sm:grid-cols-2">{field('الاسم الأساسي', 'name')}{field('الاسم بالعربي', 'nameAr')}{field('الاسم بالإنجليزي', 'nameEn')}{field('الرابط المختصر', 'slug')}{field('السعر (جنيه مصري)', 'price', 'number')}{field('السعر القديم (اختياري)', 'oldPrice', 'number')}{field('نسبة الخصم (اختياري)', 'discountPercent', 'number')}{field('المخزون', 'stock', 'number')}<label className="grid gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">القسم<select value={form.category} onChange={(event) => set('category', event.target.value)} className="rounded-xl border border-border bg-background px-4 py-3 text-sm font-normal normal-case tracking-normal text-foreground">{categories.map((category) => <option key={category}>{category}</option>)}</select></label><ImageUploadField form={form} setForm={setForm} /><label className="grid gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground sm:col-span-2">الوصف<textarea value={form.description} onChange={(event) => set('description', event.target.value)} rows={3} className="rounded-xl border border-border bg-background px-4 py-3 text-sm font-normal normal-case tracking-normal text-foreground" /></label>{field('المواصفات (مفصولة بفواصل)', 'specifications')}<VariantEditor value={form.variants} onChange={(value) => set('variants', value)} /><div className="sm:col-span-2 rounded-xl border border-[#e2b47f] bg-[#fff6e8] p-4"><div className="flex items-center gap-3"><input type="checkbox" checked={form.discountActive} onChange={(event) => set('discountActive', event.target.checked)} className="h-4 w-4 accent-primary" /><div><p className="text-sm font-bold text-foreground">تفعيل الخصم لهذا المنتج</p><p className="mt-1 text-xs font-normal normal-case tracking-normal text-muted-foreground">يحسب السيرفر السعر النهائي. اترك التواريخ فارغة ليستمر الخصم حتى تقوم بإيقافه.</p></div></div>{form.discountActive && <div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">يبدأ في<input dir="ltr" type="datetime-local" value={form.discountStartsAt} onChange={(event) => set('discountStartsAt', event.target.value)} className="rounded-xl border border-border bg-background px-4 py-3 text-sm font-normal normal-case tracking-normal text-foreground" /></label><label className="grid gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">ينتهي في (اختياري)<input dir="ltr" type="datetime-local" value={form.discountEndsAt} onChange={(event) => set('discountEndsAt', event.target.value)} className="rounded-xl border border-border bg-background px-4 py-3 text-sm font-normal normal-case tracking-normal text-foreground" /></label></div>}</div><div className="sm:col-span-2 rounded-xl border border-[#9bcdb3] bg-[#f0f8f2] p-4"><div className="flex items-start gap-3"><input type="checkbox" checked={form.installmentAvailable} onChange={(event) => set('installmentAvailable', event.target.checked)} className="mt-1 h-4 w-4 accent-primary" /><div><p className="text-sm font-bold text-foreground">تفعيل التقسيط لهذا المنتج</p><p className="mt-1 text-xs font-normal normal-case tracking-normal text-muted-foreground">حدد الحد الأدنى والأقصى لمدة التقسيط بالأشهر ليظهر للعميل.</p></div></div>{form.installmentAvailable && <div className="mt-4 grid gap-4 sm:grid-cols-2">{field('الحد الأدنى (شهور)', 'installmentMinMonths', 'number')}{field('الحد الأقصى (شهور)', 'installmentMaxMonths', 'number')}</div>}</div></div><div className="mt-5 flex flex-wrap gap-5 text-sm font-semibold"><label className="flex items-center gap-2"><input type="checkbox" checked={form.featured} onChange={(event) => set('featured', event.target.checked)} /> منتج مميز</label><label className="flex items-center gap-2"><input type="checkbox" checked={form.active} onChange={(event) => set('active', event.target.checked)} /> ظاهر في المتجر</label></div>{error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}<button type="submit" className="mt-6 flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"><Save className="h-4 w-4" /> حفظ المنتج</button></form>;
}

function OrdersManagement({ orders, onRefresh }: { orders: AdminOrder[]; onRefresh: () => Promise<void> }) {
  const [query, setQuery] = useState(''); const [status, setStatus] = useState('all'); const [selected, setSelected] = useState<AdminOrder | null>(null);
  const filtered = useMemo(() => orders.filter((order) => (status === 'all' || order.status === status) && `${order.orderNumber} ${order.customer.name} ${order.customer.phone}`.toLowerCase().includes(query.toLowerCase())), [orders, query, status]);
  const changeStatus = async (id: number, next: string) => { showLoading('جارٍ تحديث حالة الطلب…'); try { await updateOrderStatus(id, next); closeAlert(); await onRefresh(); setSelected((current) => current?.id === id ? { ...current, status: next } : current); await notifySuccess('تم تحديث حالة الطلب', `الحالة الجديدة: ${next}`); } catch (error) { closeAlert(); await notifyError('تعذر تحديث حالة الطلب', error instanceof Error ? error.message : 'حدث خطأ غير متوقع.'); } };
  return <div className="space-y-6"><div><p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-primary">إدارة وتنفيذ الطلبات</p><h2 className="font-display text-5xl tracking-[-.05em]">الطلبات</h2></div><div className="flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search className="absolute start-4 top-3.5 h-4 w-4 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث برقم الطلب أو الاسم أو الهاتف" className="w-full rounded-xl border border-border bg-card py-3 ps-11 pe-4 text-sm outline-none focus:ring-2 focus:ring-primary" /></div><select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-xl border border-border bg-card px-4 py-3 text-sm"><option value="all">كل الحالات</option>{statuses.map((item) => <option key={item}>{item}</option>)}</select></div>{selected && <div className="rounded-2xl border border-border bg-card p-6 shadow-soft"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-primary">تفاصيل الطلب</p><h3 className="mt-1 font-display text-3xl">{selected.orderNumber}</h3></div><button onClick={() => setSelected(null)}><X className="h-5 w-5" /></button></div><div className="mt-5 grid gap-5 text-sm sm:grid-cols-2"><div><p className="text-muted-foreground">العميل</p><p className="font-semibold">{selected.customer.name}</p><p>{selected.customer.phone}</p></div><div><p className="text-muted-foreground">التوصيل</p><p>{selected.customer.governorate} · {selected.customer.city}</p><p>{selected.customer.address}</p></div><div><p className="text-muted-foreground">الدفع</p><p className="font-semibold">{selected.paymentMethod === 'cod' ? 'الدفع عند الاستلام' : 'إنستاباي / تحويل بنكي'}</p><p>{selected.paymentStatus}</p></div><div><p className="text-muted-foreground">الإجمالي</p><p className="font-display text-2xl">{money(selected.total)}</p></div></div><div className="mt-5 border-t border-border pt-5"><p className="mb-3 text-sm font-semibold">تغيير الحالة</p><div className="flex flex-wrap gap-2">{statuses.map((item) => <button key={item} onClick={() => changeStatus(selected.id, item)} className={`rounded-full px-3 py-2 text-xs font-bold capitalize ${selected.status === item ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>{item}</button>)}</div></div><div className="mt-5 border-t border-border pt-5">{selected.items.map((item) => <div key={`${item.productId}-${item.variant || ''}`} className="flex justify-between border-b border-border py-3 text-sm last:border-0"><span>{item.name} × {item.quantity}</span><span className="font-bold">{money(item.price * item.quantity)}</span></div>)}</div></div>}
    <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-soft"><table className="w-full min-w-[760px]"><thead><tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground"><th className="px-5 py-4">الطلب</th><th className="px-5 py-4">Customer</th><th className="px-5 py-4">الإجمالي</th><th className="px-5 py-4">الحالة</th><th className="px-5 py-4">تاريخ الإنشاء</th><th className="px-5 py-4"></th></tr></thead><tbody>{filtered.map((order) => <tr key={order.id} className="border-b border-border last:border-0"><td className="px-5 py-4"><p className="font-semibold">{order.orderNumber}</p><p className="text-xs text-muted-foreground">#{order.id}</p></td><td className="px-5 py-4"><p className="font-semibold">{order.customer.name}</p><p className="text-xs text-muted-foreground">{order.customer.phone}</p></td><td className="px-5 py-4 text-sm font-bold">{money(order.total)}</td><td className="px-5 py-4"><span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold capitalize">{order.status}</span></td><td className="px-5 py-4 text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</td><td className="px-5 py-4"><button onClick={() => setSelected(order)} className="text-sm font-semibold text-primary hover:underline">عرض التفاصيل</button></td></tr>)}</tbody></table>{!filtered.length && <p className="p-10 text-center text-sm text-muted-foreground">لا توجد طلبات مطابقة.</p>}</div></div>;
}

function CustomersManagement({ orders }: { orders: AdminOrder[] }) {
  const customers = useMemo(() => Array.from(orders.reduce((map, order) => { const key = order.customer.phone || order.customer.name; const current = map.get(key) || { name: order.customer.name, phone: order.customer.phone, orders: 0, spent: 0, lastOrder: order.createdAt }; current.orders += 1; current.spent += order.total; if (order.createdAt > current.lastOrder) current.lastOrder = order.createdAt; map.set(key, current); return map; }, new Map<string, { name: string; phone: string; orders: number; spent: number; lastOrder: string }>()).values()), [orders]);
  return <div className="space-y-6"><div><p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-primary">سجل العملاء</p><h2 className="font-display text-5xl tracking-[-.05em]">العملاء الضيوف</h2><p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">يتم التعرف على العملاء من خلال رقم الهاتف ويمكنهم الطلب بدون تسجيل. هذه البيانات مستخرجة من الطلبات الفعلية.</p></div><div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-soft"><table className="w-full min-w-[650px] text-right"><thead><tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground"><th className="px-5 py-4">الاسم</th><th className="px-5 py-4">الهاتف</th><th className="px-5 py-4">الطلبات</th><th className="px-5 py-4">إجمالي الإنفاق</th><th className="px-5 py-4">آخر طلب</th></tr></thead><tbody>{customers.map((customer) => <tr key={customer.phone} className="border-b border-border last:border-0"><td className="px-5 py-4 font-semibold">{customer.name}</td><td className="px-5 py-4 text-sm text-muted-foreground">{customer.phone}</td><td className="px-5 py-4 text-sm">{customer.orders}</td><td className="px-5 py-4 text-sm font-bold">{money(customer.spent)}</td><td className="px-5 py-4 text-sm text-muted-foreground">{new Date(customer.lastOrder).toLocaleDateString()}</td></tr>)}</tbody></table>{!customers.length && <p className="p-10 text-center text-sm text-muted-foreground">لا يوجد عملاء ضيوف حتى الآن.</p>}</div></div>;
}

function StoreBrandingSettings() {
  const [settings, setSettings] = useState<StoreSettings>(defaultStoreSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    fetchAdminStoreSettings().then(setSettings).catch((error) => notifyError('تعذر تحميل إعدادات المتجر', error instanceof Error ? error.message : 'حدث خطأ غير متوقع.')).finally(() => setLoading(false));
  }, []);
  const set = <K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) => setSettings((current) => ({ ...current, [key]: value }));
  const onLogo = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 1_500_000) { void notifyError('حجم اللوجو كبير', 'اختر صورة أقل من 1.5 ميجابايت.'); return; }
    const reader = new FileReader();
    reader.onload = () => set('logoUrl', String(reader.result || ''));
    reader.readAsDataURL(file);
  };
  const resetColors = () => setSettings((current) => ({
    ...current,
    primaryColor: defaultStoreSettings.primaryColor,
    inkColor: defaultStoreSettings.inkColor,
    backgroundColor: defaultStoreSettings.backgroundColor,
    surfaceColor: defaultStoreSettings.surfaceColor,
    secondaryColor: defaultStoreSettings.secondaryColor,
    accentColor: defaultStoreSettings.accentColor,
    successColor: defaultStoreSettings.successColor,
    mutedTextColor: defaultStoreSettings.mutedTextColor,
  }));
  const save = async () => {
    setSaving(true); showLoading('جارٍ حفظ إعدادات المتجر…');
    try {
      const saved = await updateStoreSettings(settings);
      setSettings(saved); closeAlert(); await notifySuccess('تم حفظ إعدادات المتجر', 'سيظهر الاسم واللوجو والألوان الجديدة للعملاء.');
    } catch (error) { closeAlert(); await notifyError('تعذر حفظ إعدادات المتجر', error instanceof Error ? error.message : 'حدث خطأ غير متوقع.'); }
    finally { setSaving(false); }
  };
  const colors: Array<{ label: string; key: keyof StoreSettings }> = [
    { label: 'اللون الأساسي والأزرار', key: 'primaryColor' },
    { label: 'لون النص الداكن', key: 'inkColor' },
    { label: 'لون خلفية المتجر', key: 'backgroundColor' },
    { label: 'لون البطاقات والأسطح', key: 'surfaceColor' },
    { label: 'لون الخلفيات الثانوية', key: 'secondaryColor' },
    { label: 'لون التفاصيل والتمييز', key: 'accentColor' },
    { label: 'لون النجاح والتأكيد', key: 'successColor' },
    { label: 'لون النص الهادئ', key: 'mutedTextColor' },
  ];
  return <section className="rounded-2xl border border-border bg-card p-6 shadow-soft"><div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-primary">هوية المتجر</p><h3 className="font-display text-3xl">اسم المتجر والألوان</h3><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">تحكم في شكل المتجر بالكامل من مكان واحد. التغييرات تُحفظ في قاعدة البيانات وتظهر للعميل بعد الحفظ.</p></div><span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold">تعديل مباشر للواجهة</span></div><div className="mt-6 grid gap-6 lg:grid-cols-[.8fr_1.2fr]"><div className="space-y-4"><label className="grid gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">اسم المتجر<input value={settings.storeName} onChange={(event) => set('storeName', event.target.value)} className="rounded-xl border border-border bg-background px-4 py-3 text-sm font-normal normal-case tracking-normal text-foreground outline-none focus:ring-2 focus:ring-primary" /></label><div className="rounded-xl border border-dashed border-primary/40 bg-background p-4"><div className="flex items-center gap-4">{settings.logoUrl ? <img src={settings.logoUrl} alt="معاينة اللوجو" className="h-16 w-16 rounded-2xl object-cover" /> : <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-xs font-bold text-muted-foreground">Logo</div>}<div><p className="text-sm font-bold">لوجو المتجر</p><p className="mt-1 text-xs text-muted-foreground">PNG أو JPG، بحد أقصى 1.5 ميجابايت.</p></div></div><label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground"><Plus className="h-4 w-4" /> رفع لوجو جديد<input type="file" accept="image/png,image/jpeg,image/webp" onChange={onLogo} className="hidden" /></label>{settings.logoUrl && <button type="button" onClick={() => set('logoUrl', '')} className="ms-3 text-xs font-bold text-destructive hover:underline">إزالة اللوجو</button>}</div></div><div><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">لوحة الألوان العامة</p><p className="mt-1 text-xs text-muted-foreground">استخدم ألوان HEX، وستتطبق على الـ Navbar والصفحات والبطاقات والأزرار.</p><div className="mt-4 grid gap-3 sm:grid-cols-2">{colors.map(({ label, key }) => <label key={key} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background p-3 text-xs font-bold"><span>{label}</span><span className="flex items-center gap-2"><input type="color" value={settings[key] as string} onChange={(event) => set(key, event.target.value)} className="h-9 w-11 cursor-pointer rounded-lg border-0 bg-transparent p-0" /><code className="text-[10px] font-normal uppercase text-muted-foreground">{settings[key] as string}</code></span></label>)}</div></div></div><div className="mt-6 flex flex-wrap items-center gap-3"><button type="button" onClick={resetColors} disabled={loading || saving} className="rounded-xl border border-border bg-background px-5 py-3 text-sm font-bold text-foreground transition-colors hover:bg-secondary disabled:opacity-60">استعادة الألوان الأساسية</button><button type="button" onClick={save} disabled={loading || saving} className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground disabled:cursor-wait disabled:opacity-60"><Save className="h-4 w-4" /> {saving ? 'جارٍ الحفظ…' : 'حفظ هوية المتجر'}</button></div></section>;
}

function SettingsPanel({ categories, products, onRefresh }: { categories: AdminCategory[]; products: ApiProduct[]; onRefresh: () => Promise<void> }) {
  return <div className="space-y-6"><div><p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-primary">إعدادات التشغيل</p><h2 className="font-display text-5xl tracking-[-.05em]">الإعدادات</h2></div><StoreBrandingSettings /><CouponsManagement /><OffersManagement products={products} onRefresh={onRefresh} /><div className="grid gap-5 md:grid-cols-2"><div className="rounded-2xl border border-border bg-card p-6 shadow-soft"><h3 className="font-display text-2xl">طرق الدفع</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">هذه الخيارات جزء من نظام الطلبات المرن. يمكنك إضافة بوابات الدفع بالبطاقات لاحقًا بدون تغيير مسار الدفع.</p><div className="mt-5 grid gap-3"><div className="flex items-center justify-between rounded-xl bg-secondary p-4"><span className="font-semibold">الدفع عند الاستلام</span><span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800">مفعل</span></div><div className="flex items-center justify-between rounded-xl bg-secondary p-4"><span className="font-semibold">إنستاباي / تحويل بنكي</span><span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800">مفعل</span></div><div className="flex items-center justify-between rounded-xl border border-dashed border-border p-4 text-muted-foreground"><span className="font-semibold">Visa / Mastercard / Stripe</span><span className="text-xs font-bold">جاهز للإضافة</span></div></div></div><div className="rounded-2xl border border-border bg-card p-6 shadow-soft"><h3 className="font-display text-2xl">قواعد التوصيل</h3><div className="mt-5 space-y-4 text-sm"><div className="flex items-center justify-between border-b border-border pb-4"><span>الحد الأدنى للتوصيل المجاني</span><strong>KES 5,000</strong></div><div className="flex items-center justify-between border-b border-border pb-4"><span>رسوم التوصيل العادية</span><strong>KES 250</strong></div><div className="flex items-center justify-between"><span>مدة التوصيل المتوقعة</span><strong>2–5 أيام عمل</strong></div></div></div></div></div>;
}

function OffersManagement({ products, onRefresh }: { products: ApiProduct[]; onRefresh: () => Promise<void> }) {
  return <section className="rounded-2xl border border-border bg-card p-6 shadow-soft"><div><p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-primary">العروض</p><h3 className="font-display text-3xl">العروض والخصومات</h3><p className="mt-2 text-sm text-muted-foreground">حدد نسبة خصم لأي منتج. يحسب السيرفر السعر النهائي ويظهر المنتج تلقائيًا في قسم العروض بالصفحة الرئيسية.</p></div><div className="mt-5 grid gap-3">{products.map((product) => <OfferRow key={product.backendId || product.id} product={product} onRefresh={onRefresh} />)}</div></section>;
}

function OfferRow({ product, onRefresh }: { product: ApiProduct; onRefresh: () => Promise<void> }) {
  const [percent, setPercent] = useState(String(product.discountPercent || 0));
  const [active, setActive] = useState(Boolean(product.discountActive));
  const [endsAt, setEndsAt] = useState(product.discountEndsAt ? String(product.discountEndsAt).slice(0, 16) : '');
  const [saving, setSaving] = useState(false);
  const save = async () => { if (!product.backendId) return; setSaving(true); showLoading('جارٍ حفظ العرض…'); try { await updateProduct(product.backendId, { discountPercent: Number(percent) || 0, discountActive: active, discountStartsAt: null, discountEndsAt: endsAt || null }); closeAlert(); await onRefresh(); await notifySuccess('تم حفظ العرض', active && Number(percent) > 0 ? `خصم ${percent}% مفعل على المنتج.` : 'تم إيقاف الخصم على المنتج.'); } catch (error) { closeAlert(); await notifyError('تعذر حفظ العرض', error instanceof Error ? error.message : 'حدث خطأ غير متوقع.'); } finally { setSaving(false); } };
  return <div className="flex flex-col gap-3 rounded-xl bg-secondary p-4 lg:flex-row lg:items-center lg:justify-between"><div className="flex items-center gap-3"><img src={product.image} alt="" className="h-12 w-12 rounded-xl object-cover" /><div><p className="font-semibold">{product.name}</p><p className="text-xs text-muted-foreground">{active && Number(percent) > 0 ? `${percent}% خصم مفعل · ${money(product.price)}` : 'لا يوجد خصم مفعل'}</p></div></div><div className="flex flex-wrap items-center gap-2"><label className="flex items-center gap-2 text-xs font-bold">نسبة الخصم<input type="number" min="0" max="100" value={percent} onChange={(event) => setPercent(event.target.value)} className="w-20 rounded-lg border border-border bg-background px-2 py-2 text-sm font-normal" /></label><label className="flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} className="h-4 w-4 accent-primary" />مفعل</label><label className="flex items-center gap-2 text-xs font-bold">ينتهي<input type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} className="rounded-lg border border-border bg-background px-2 py-2 text-xs font-normal" /></label><button onClick={save} disabled={saving} className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground">{saving ? 'جارٍ الحفظ…' : 'حفظ العرض'}</button></div></div>;
}

function CategoryManagement({ categories, products, onRefresh }: { categories: AdminCategory[]; products: ApiProduct[]; onRefresh: () => Promise<void> }) {
  const [name, setName] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [editing, setEditing] = useState<number | null>(null);
  const [error, setError] = useState('');
  const visibleCount = categories.filter((category) => category.active).length;
  const hiddenCount = categories.length - visibleCount;
  const submit = async () => { const value = (nameEn || nameAr || name).trim(); const arabicValue = nameAr.trim(); const englishValue = nameEn.trim(); if (!value || !arabicValue || !englishValue) { await notifyError('بيانات القسم ناقصة', 'اكتب الاسم بالعربي والاسم بالإنجليزي.'); return; } setError(''); showLoading(editing ? 'جارٍ تحديث القسم…' : 'جارٍ إضافة القسم…'); try { if (editing) await updateCategory(editing, value, true, arabicValue, englishValue); else await createCategory(value, arabicValue, englishValue); closeAlert(); setName(''); setNameAr(''); setNameEn(''); setEditing(null); await onRefresh(); await notifySuccess(editing ? 'تم تحديث القسم' : 'تمت إضافة القسم'); } catch (submitError) { closeAlert(); const message = submitError instanceof Error ? submitError.message : 'تعذر حفظ القسم.'; setError(message); await notifyError('تعذر حفظ القسم', message); } };
  const remove = async (category: AdminCategory) => { const result = await confirmAction('حذف القسم؟', `سيتم حذف «${category.name}» نهائيًا إذا لم يكن مرتبطًا بمنتجات.`); if (!result.isConfirmed) return; setError(''); showLoading('جارٍ حذف القسم…'); try { await deleteCategory(category.id); closeAlert(); await onRefresh(); await notifySuccess('تم حذف القسم'); } catch (deleteError) { closeAlert(); const message = deleteError instanceof Error ? deleteError.message : 'تعذر حذف القسم.'; setError(message); await notifyError('تعذر حذف القسم', message); } };
  const toggle = async (category: AdminCategory) => { showLoading(category.active ? 'جارٍ إخفاء القسم…' : 'جارٍ إظهار القسم…'); try { await updateCategory(category.id, category.name, !category.active, category.nameAr || category.name, category.nameEn || category.name); closeAlert(); await onRefresh(); await notifySuccess(category.active ? 'تم إخفاء القسم' : 'تم إظهار القسم', category.active ? 'لن يظهر القسم للعملاء الآن.' : 'أصبح القسم ظاهرًا للعملاء.'); } catch (toggleError) { closeAlert(); const message = toggleError instanceof Error ? toggleError.message : 'تعذر تحديث القسم.'; setError(message); await notifyError('تعذر تحديث القسم', message); } };
  return <section className="space-y-5"><div className="rounded-2xl border border-border bg-card p-6 shadow-soft"><div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-primary">هيكل المتجر</p><h3 className="font-display text-3xl">إدارة الأقسام</h3><p className="mt-2 text-sm text-muted-foreground">من هنا تتحكم بشكل مباشر في الأقسام الظاهرة للعملاء.</p></div><div className="flex flex-wrap gap-2"><input value={nameAr} onChange={(event) => setNameAr(event.target.value)} placeholder="اسم القسم بالعربي" dir="rtl" className="min-w-[160px] rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" /><input value={nameEn} onChange={(event) => setNameEn(event.target.value)} placeholder="Category name in English" dir="ltr" className="min-w-[160px] rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" /><button onClick={submit} className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">{editing ? 'حفظ التعديل' : 'إضافة قسم'}</button>{editing && <button onClick={() => { setEditing(null); setName(''); setNameAr(''); setNameEn(''); }} className="rounded-xl border border-border px-3 py-2 text-sm font-bold">إلغاء</button>}</div></div><div className="mt-6 grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-border bg-secondary p-4"><p className="text-xs font-semibold text-muted-foreground">إجمالي الأقسام</p><p className="mt-1 text-2xl font-bold">{categories.length}</p></div><div className="rounded-xl border border-green-200 bg-green-50 p-4"><p className="text-xs font-semibold text-green-800">ظاهر في المتجر</p><p className="mt-1 text-2xl font-bold text-green-900">{visibleCount}</p></div><div className="rounded-xl border border-red-200 bg-red-50 p-4"><p className="text-xs font-semibold text-red-800">مخفي عن المتجر</p><p className="mt-1 text-2xl font-bold text-red-900">{hiddenCount}</p></div></div></div>{error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}<div className="grid gap-4 md:grid-cols-2">{categories.map((category) => { const productCount = products.filter((product) => product.category === category.name).length; return <div key={category.id} className={`rounded-2xl border-2 bg-card p-5 shadow-soft ${category.active ? 'border-green-300' : 'border-red-200 opacity-90'}`}><div className="flex items-start justify-between gap-4"><div><div className="flex items-center gap-2"><span className={`h-3 w-3 rounded-full ${category.active ? 'bg-green-500' : 'bg-red-500'}`} /><h4 className="text-lg font-bold">{category.name}</h4></div><p className="mt-2 text-sm text-muted-foreground">{productCount} منتج داخل هذا القسم</p></div><span className={`rounded-full px-3 py-1 text-xs font-extrabold ${category.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{category.active ? 'ظاهر الآن' : 'مخفي الآن'}</span></div><div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4"><button type="button" aria-pressed={category.active} onClick={() => toggle(category)} className={`relative inline-flex h-9 w-[116px] items-center rounded-full px-1 text-xs font-bold transition-colors ${category.active ? 'justify-start bg-green-500 text-white' : 'justify-end bg-slate-300 text-slate-700'}`}><span className="absolute h-7 w-7 rounded-full bg-white shadow" />{category.active ? 'ظاهر في المتجر' : 'مخفي عن المتجر'}</button><div className="flex gap-3 text-xs font-bold"><button onClick={() => { setEditing(category.id); setName(category.name); setNameAr(category.nameAr || category.name); setNameEn(category.nameEn || category.name); }} className="text-primary hover:underline">تعديل</button><button onClick={() => remove(category)} className="text-destructive hover:underline">حذف</button></div></div></div>; })}</div>{!categories.length && <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">لا توجد أقسام. أضف أول قسم من الزر أعلاه.</div>}</section>;
}

function CouponsManagement() {
  const empty: CouponInput = { code: '', discountType: 'percent', discountValue: 10, active: true, startsAt: null, endsAt: null, usageLimit: null };
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [draft, setDraft] = useState<CouponInput>(empty);
  const [editing, setEditing] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const load = async () => { setLoading(true); try { setCoupons(await fetchCoupons()); } catch (error) { await notifyError('تعذر تحميل الكوبونات', error instanceof Error ? error.message : 'حدث خطأ غير متوقع.'); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, []);
  const save = async () => {
    try {
      if (!draft.code.trim() || Number(draft.discountValue) <= 0) { await notifyError('بيانات الكوبون ناقصة', 'اكتب الكود وقيمة الخصم.'); return; }
      showLoading(editing ? 'جارٍ تحديث الكوبون…' : 'جارٍ إضافة الكوبون…');
      if (editing) await updateCoupon(editing, { ...draft, discountValue: Number(draft.discountValue) });
      else await createCoupon({ ...draft, discountValue: Number(draft.discountValue) });
      closeAlert(); await notifySuccess(editing ? 'تم تحديث الكوبون' : 'تمت إضافة الكوبون'); setDraft(empty); setEditing(null); await load();
    } catch (error) { closeAlert(); await notifyError('تعذر حفظ الكوبون', error instanceof Error ? error.message : 'حدث خطأ غير متوقع.'); }
  };
  const edit = (coupon: Coupon) => { setEditing(coupon.id); setDraft({ code: coupon.code, discountType: coupon.discountType, discountValue: coupon.discountValue, active: coupon.active, startsAt: coupon.startsAt || null, endsAt: coupon.endsAt || null, usageLimit: coupon.usageLimit ?? null }); };
  const toggleActive = async (coupon: Coupon) => {
    const nextActive = !coupon.active;
    const result = await confirmAction(
      nextActive ? 'تفعيل الكوبون؟' : 'تعطيل الكوبون؟',
      nextActive
        ? `سيتمكن العملاء من استخدام ${coupon.code} مرة أخرى.`
        : `لن يستطيع العملاء استخدام ${coupon.code} بعد التعطيل.`
    );

    if (!result.isConfirmed) return;

    try {
      showLoading(nextActive ? 'جارٍ تفعيل الكوبون…' : 'جارٍ تعطيل الكوبون…');

      await updateCoupon(coupon.id, {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: Number(coupon.discountValue),
        active: nextActive,
        startsAt: coupon.startsAt || null,
        endsAt: coupon.endsAt || null,
        usageLimit: coupon.usageLimit ?? null,
      });

      closeAlert();
      await load();
      await notifySuccess(nextActive ? 'تم تفعيل الكوبون' : 'تم تعطيل الكوبون');
    } catch (error) {
      closeAlert();
      await notifyError(
        nextActive ? 'تعذر تفعيل الكوبون' : 'تعذر تعطيل الكوبون',
        error instanceof Error ? error.message : 'حدث خطأ غير متوقع.'
      );
    }
  };

  return <section className="rounded-2xl border border-border bg-card p-6 shadow-soft"><div><p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-primary">التسويق</p><h3 className="font-display text-3xl">كوبونات الخصم</h3><p className="mt-2 text-sm text-muted-foreground">أنشئ كوبونات بنسبة مئوية أو قيمة ثابتة وحدد مدة الاستخدام.</p></div><div className="mt-5 grid gap-3 rounded-xl bg-secondary p-4 md:grid-cols-6"><input value={draft.code} onChange={(event) => setDraft({ ...draft, code: event.target.value.toUpperCase() })} placeholder="WELCOME10" className="rounded-lg border border-border bg-background px-3 py-2 text-sm md:col-span-2" /><select value={draft.discountType} onChange={(event) => setDraft({ ...draft, discountType: event.target.value as CouponInput['discountType'] })} className="rounded-lg border border-border bg-background px-3 py-2 text-sm"><option value="percent">نسبة %</option><option value="fixed">قيمة ثابتة</option></select><input type="number" min="0.01" value={draft.discountValue} onChange={(event) => setDraft({ ...draft, discountValue: Number(event.target.value) })} placeholder="قيمة الخصم" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" /><input type="number" min="1" value={draft.usageLimit ?? ''} onChange={(event) => setDraft({ ...draft, usageLimit: event.target.value ? Number(event.target.value) : null })} placeholder="حد الاستخدام" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" /><div className="flex gap-2"><button onClick={save} className="flex-1 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground">{editing ? 'حفظ التعديل' : 'إضافة'}</button>{editing && <button onClick={() => { setEditing(null); setDraft(empty); }} className="rounded-lg border border-border px-3 py-2 text-xs font-bold">إلغاء</button>}</div></div><div className="mt-5 space-y-3">{loading ? <p className="text-sm text-muted-foreground">جارٍ تحميل الكوبونات…</p> : coupons.length ? coupons.map((coupon) => <div key={coupon.id} className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><strong className="tracking-wider">{coupon.code}</strong><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${coupon.active ? 'bg-green-100 text-green-800' : 'bg-muted text-muted-foreground'}`}>{coupon.active ? 'مفعل' : 'متوقف'}</span></div><p className="mt-1 text-xs text-muted-foreground">{coupon.discountType === 'percent' ? `${coupon.discountValue}% خصم` : `${coupon.discountValue} خصم ثابت`} · مستخدم {coupon.usedCount}{coupon.usageLimit ? ` من ${coupon.usageLimit}` : ''}</p></div><div className="flex gap-3 text-xs font-bold"><button onClick={() => edit(coupon)} className="text-primary hover:underline">تعديل</button><button
    onClick={() => toggleActive(coupon)}
    className={coupon.active ? 'text-destructive hover:underline' : 'text-green-700 hover:underline'}
  >
    {coupon.active ? 'تعطيل' : 'تفعيل'}
  </button>
  </div></div>) : <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">لا توجد كوبونات حتى الآن.</p>}</div></section>;
}