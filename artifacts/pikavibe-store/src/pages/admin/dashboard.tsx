import { useState } from 'react';
import { LayoutDashboard, Package, ShoppingCart, Users, Settings, LogOut } from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold font-serif text-foreground">Admin Dashboard</h1>
            <button className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors">
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="w-64 flex-shrink-0">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {activeTab === 'overview' && <Overview />}
            {activeTab === 'products' && <ProductsManagement />}
            {activeTab === 'orders' && <OrdersManagement />}
            {activeTab === 'customers' && <CustomersManagement />}
            {activeTab === 'settings' && <SettingsPanel />}
          </main>
        </div>
      </div>
    </div>
  );
}

function Overview() {
  const stats = [
    { label: 'Total Revenue', value: '$12,450', change: '+12.5%' },
    { label: 'Total Orders', value: '156', change: '+8.2%' },
    { label: 'Total Products', value: '48', change: '+3' },
    { label: 'Total Customers', value: '89', change: '+15.3%' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold font-serif text-foreground">Overview</h2>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="p-6 bg-card rounded-lg border border-border shadow-soft">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="text-2xl font-bold text-foreground mt-2">{stat.value}</p>
            <p className="text-sm text-green-600 mt-1">{stat.change}</p>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="p-6 bg-card rounded-lg border border-border shadow-soft">
        <h3 className="text-lg font-semibold text-foreground mb-4">Recent Orders</h3>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-border last:border-0">
              <div>
                <p className="font-medium text-foreground">Order #{1000 + i}</p>
                <p className="text-sm text-muted-foreground">Customer {i}</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-foreground">${(100 + i * 10).toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProductsManagement() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold font-serif text-foreground">Products</h2>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
          Add Product
        </button>
      </div>

      <div className="p-6 bg-card rounded-lg border border-border shadow-soft">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Product</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Category</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Price</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Stock</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i} className="border-b border-border">
                <td className="py-3 px-4 text-foreground">Product {i}</td>
                <td className="py-3 px-4 text-muted-foreground">Kitchenware</td>
                <td className="py-3 px-4 text-foreground">${(50 + i * 10).toFixed(2)}</td>
                <td className="py-3 px-4 text-foreground">{100 - i * 10}</td>
                <td className="py-3 px-4">
                  <div className="flex gap-2">
                    <button className="text-sm text-primary hover:underline">Edit</button>
                    <button className="text-sm text-destructive hover:underline">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OrdersManagement() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold font-serif text-foreground">Orders</h2>

      <div className="p-6 bg-card rounded-lg border border-border shadow-soft">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Order ID</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Customer</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Total</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Status</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Date</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i} className="border-b border-border">
                <td className="py-3 px-4 text-foreground">#{1000 + i}</td>
                <td className="py-3 px-4 text-foreground">Customer {i}</td>
                <td className="py-3 px-4 text-foreground">${(100 + i * 10).toFixed(2)}</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                    Pending
                  </span>
                </td>
                <td className="py-3 px-4 text-muted-foreground">2024-01-{10 + i}</td>
                <td className="py-3 px-4">
                  <button className="text-sm text-primary hover:underline">View Details</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CustomersManagement() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold font-serif text-foreground">Customers</h2>

      <div className="p-6 bg-card rounded-lg border border-border shadow-soft">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Name</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Email</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Orders</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Total Spent</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Joined</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i} className="border-b border-border">
                <td className="py-3 px-4 text-foreground">Customer {i}</td>
                <td className="py-3 px-4 text-muted-foreground">customer{i}@example.com</td>
                <td className="py-3 px-4 text-foreground">{i}</td>
                <td className="py-3 px-4 text-foreground">${(100 + i * 50).toFixed(2)}</td>
                <td className="py-3 px-4 text-muted-foreground">2024-01-{i * 5}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SettingsPanel() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold font-serif text-foreground">Settings</h2>

      <div className="p-6 bg-card rounded-lg border border-border shadow-soft space-y-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Store Name</label>
          <input
            type="text"
            defaultValue="PikaVibe Kitchenware"
            className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Store Email</label>
          <input
            type="email"
            defaultValue="contact@pikavibe.com"
            className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Currency</label>
          <select className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground">
            <option>USD ($)</option>
            <option>EUR (€)</option>
            <option>GBP (£)</option>
          </select>
        </div>

        <button className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
          Save Changes
        </button>
      </div>
    </div>
  );
}
