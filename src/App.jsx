import { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Routes, Route, Link, useNavigate } from "react-router-dom";
import { Menu, ShoppingBag, Users, Receipt, LayoutDashboard, Package, LogOut, Plus, Search } from "lucide-react";

const API_BASE = import.meta.env.VITE_BACKEND_URL || "";

function useAuth() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(null);
  const isAuthed = !!token;

  useEffect(() => {
    if (token) {
      fetch(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((u) => setUser(u))
        .catch(() => setUser(null));
    }
  }, [token]);

  const login = async (email, password) => {
    const body = new URLSearchParams({ username: email, password });
    const res = await fetch(`${API_BASE}/auth/login`, { method: "POST", body, headers: { "Content-Type": "application/x-www-form-urlencoded" } });
    if (!res.ok) throw new Error("Login failed");
    const data = await res.json();
    localStorage.setItem("token", data.access_token);
    setToken(data.access_token);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
    setUser(null);
  };

  return { token, user, isAuthed, login, logout };
}

function Layout({ children, onLogout, user }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <aside className={`bg-slate-900/70 border-r border-slate-800 p-4 transition-all ${open ? "w-64" : "w-16"}`}>
        <button className="mb-6 flex items-center gap-2 text-slate-300 hover:text-white" onClick={() => setOpen(!open)}>
          <Menu size={20} /> {open && <span>Menu</span>}
        </button>
        <nav className="space-y-2">
          <NavItem to="/" icon={<LayoutDashboard size={18} />} label="Dashboard" open={open} />
          <NavItem to="/bags" icon={<Package size={18} />} label="Bags" open={open} />
          <NavItem to="/customers" icon={<Users size={18} />} label="Customers" open={open} />
          <NavItem to="/orders" icon={<Receipt size={18} />} label="Orders" open={open} />
        </nav>
        <div className="absolute bottom-4 left-4 right-4">
          <div className="text-xs text-slate-400 mb-2">{user?.email}</div>
          <button onClick={onLogout} className="w-full inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2 rounded-md">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  );
}

function NavItem({ to, icon, label, open }) {
  return (
    <Link to={to} className="flex items-center gap-3 text-slate-300 hover:text-white px-2 py-2 rounded-md hover:bg-slate-800">
      {icon} {open && <span>{label}</span>}
    </Link>
  );
}

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await onLogin(email, password);
    } catch (err) {
      setError("Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-slate-950 to-slate-900">
      <div className="w-full max-w-md bg-slate-900/70 border border-slate-800 rounded-2xl p-8 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-blue-600/20 text-blue-300"><ShoppingBag /></div>
          <div>
            <h1 className="text-xl font-semibold">Bag Shop Billing</h1>
            <p className="text-xs text-slate-400">Sign in to continue</p>
          </div>
        </div>
        {error && <div className="mb-4 text-red-400 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="Email" className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600" />
          <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Password" className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600" />
          <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md">{loading?"Signing in...":"Sign In"}</button>
        </form>
        <p className="text-xs text-slate-400 mt-4">Tip: Use the seed endpoint first if you haven't created an admin.</p>
      </div>
    </div>
  );
}

function Dashboard({ token }) {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch(`${API_BASE}/dashboard`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r=>r.json()).then(setData);
  }, [token]);
  if (!data) return <div className="text-slate-300">Loading...</div>;
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Bags" value={data.cards.bags} />
        <StatCard title="Customers" value={data.cards.customers} />
        <StatCard title="Orders" value={data.cards.orders} />
        <StatCard title="Revenue" value={`$${data.cards.revenue.toFixed(2)}`} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Panel title="Recent Orders">
          <div className="space-y-2">
            {data.recent_orders.map(o => (
              <div key={o.id} className="bg-slate-900/60 border border-slate-800 rounded-md p-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{o.invoice_number}</div>
                  <div className="text-xs text-slate-400">Items: {o.items.length} • Total: ${o.total.toFixed(2)}</div>
                </div>
                <Link to={`/orders/${o.id}`} className="text-blue-400 text-sm">View</Link>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Low Stock">
          <div className="space-y-2">
            {data.low_stock.map(b => (
              <div key={b.id} className="bg-slate-900/60 border border-slate-800 rounded-md p-3 flex items-center justify-between">
                <div className="text-sm">{b.name}</div>
                <div className="text-xs text-yellow-400">{b.stock} left</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
      <div className="text-slate-400 text-sm">{title}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}

function Panel({ title, children, actions }) {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">{title}</h3>
        {actions}
      </div>
      {children}
    </div>
  );
}

function BagsPage({ token }) {
  const [bags, setBags] = useState([]);
  const [q, setQ] = useState("");
  const [form, setForm] = useState({ sku: "", name: "", brand: "", category: "", cost_price: 0, sale_price: 0, stock: 0, description: "" });
  const [editing, setEditing] = useState(null);

  const load = async () => {
    const r = await fetch(`${API_BASE}/bags?q=${encodeURIComponent(q)}`, { headers: { Authorization: `Bearer ${token}` } });
    setBags(await r.json());
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    const method = editing ? "PUT" : "POST";
    const url = editing ? `${API_BASE}/bags/${editing}` : `${API_BASE}/bags`;
    await fetch(url, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(form) });
    setForm({ sku: "", name: "", brand: "", category: "", cost_price: 0, sale_price: 0, stock: 0, description: "" });
    setEditing(null);
    load();
  };
  const remove = async (id) => {
    await fetch(`${API_BASE}/bags/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Bags</h2>
        <button onClick={save} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"><Plus size={16}/> Save</button>
      </div>
      <Panel title="Add / Edit Bag" >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            ["sku","SKU"], ["name","Name"], ["brand","Brand"], ["category","Category"], ["cost_price","Cost Price"], ["sale_price","Sale Price"], ["stock","Stock"], ["description","Description"],
          ].map(([k,label]) => (
            <input key={k} value={form[k]} onChange={(e)=>setForm({ ...form, [k]: k==="cost_price"||k==="sale_price"||k==="stock"? Number(e.target.value): e.target.value })} placeholder={label} className="bg-slate-800 border border-slate-700 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600" />
          ))}
        </div>
      </Panel>
      <Panel title="Inventory" actions={<div className="flex items-center gap-2"><input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search" className="bg-slate-800 border border-slate-700 rounded-md px-3 py-2"/><button onClick={load} className="bg-slate-800 border border-slate-700 px-3 py-2 rounded-md"><Search size={16}/></button></div>}>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-slate-400">
              <tr>
                <th className="text-left p-2">SKU</th>
                <th className="text-left p-2">Name</th>
                <th className="text-left p-2">Brand</th>
                <th className="text-left p-2">Price</th>
                <th className="text-left p-2">Stock</th>
                <th className="text-left p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bags.map(b => (
                <tr key={b.id} className="border-t border-slate-800">
                  <td className="p-2">{b.sku}</td>
                  <td className="p-2">{b.name}</td>
                  <td className="p-2">{b.brand}</td>
                  <td className="p-2">${b.sale_price?.toFixed?.(2) ?? b.sale_price}</td>
                  <td className="p-2">{b.stock}</td>
                  <td className="p-2 space-x-2">
                    <button onClick={()=>{setForm({ sku:b.sku, name:b.name, brand:b.brand||"", category:b.category||"", cost_price:b.cost_price, sale_price:b.sale_price, stock:b.stock, description:b.description||""}); setEditing(b.id);}} className="text-blue-400">Edit</button>
                    <button onClick={()=>remove(b.id)} className="text-red-400">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function CustomersPage({ token }) {
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "" });

  const load = async () => {
    const r = await fetch(`${API_BASE}/customers`, { headers: { Authorization: `Bearer ${token}` } });
    setCustomers(await r.json());
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    await fetch(`${API_BASE}/customers`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(form) });
    setForm({ name: "", email: "", phone: "", address: "" });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Customers</h2>
        <button onClick={save} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"><Plus size={16}/> Save</button>
      </div>
      <Panel title="Add Customer">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {[["name","Name"],["email","Email"],["phone","Phone"],["address","Address"]].map(([k,label]) => (
            <input key={k} value={form[k]} onChange={(e)=>setForm({ ...form, [k]: e.target.value })} placeholder={label} className="bg-slate-800 border border-slate-700 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600" />
          ))}
        </div>
      </Panel>
      <Panel title="All Customers">
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-slate-400"><tr><th className="text-left p-2">Name</th><th className="text-left p-2">Email</th><th className="text-left p-2">Phone</th></tr></thead>
            <tbody>
              {customers.map(c => (
                <tr key={c.id} className="border-t border-slate-800"><td className="p-2">{c.name}</td><td className="p-2">{c.email}</td><td className="p-2">{c.phone}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function OrdersPage({ token }) {
  const [bags, setBags] = useState([]);
  const [items, setItems] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [discount, setDiscount] = useState(0);
  const [taxRate, setTaxRate] = useState(0.0);
  const [orders, setOrders] = useState([]);

  useEffect(() => { (async()=>{
    const [b, o] = await Promise.all([
      fetch(`${API_BASE}/bags`, { headers: { Authorization: `Bearer ${token}` } }).then(r=>r.json()),
      fetch(`${API_BASE}/orders`, { headers: { Authorization: `Bearer ${token}` } }).then(r=>r.json()),
    ]);
    setBags(b); setOrders(o);
  })(); }, [token]);

  const addItem = (bag) => {
    const existing = items.find(i => i.bag_id === bag.id);
    if (existing) {
      setItems(items.map(i => i.bag_id === bag.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setItems([...items, { bag_id: bag.id, quantity: 1, unit_price: bag.sale_price }]);
    }
  };

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);
    const tax = subtotal * taxRate;
    const total = Math.max(0, subtotal + tax - discount);
    return { subtotal, tax, total };
  }, [items, discount, taxRate]);

  const placeOrder = async () => {
    const payload = { customer_name: customerName, items, discount, tax_rate: taxRate, payment_method: "cash" };
    const res = await fetch(`${API_BASE}/orders`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
    const order = await res.json();
    setItems([]); setCustomerName(""); setDiscount(0); setTaxRate(0);
    const o = await fetch(`${API_BASE}/orders`, { headers: { Authorization: `Bearer ${token}` } }).then(r=>r.json());
    setOrders(o);
    window.open(`${API_BASE}/orders/${order.id}/invoice`, "_blank");
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Orders</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Panel title="Select Bags">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {bags.map(b => (
              <button key={b.id} onClick={()=>addItem(b)} className="bg-slate-800 border border-slate-700 rounded-md p-3 text-left hover:ring-2 hover:ring-blue-600">
                <div className="font-medium">{b.name}</div>
                <div className="text-xs text-slate-400">{b.sku} • ${b.sale_price?.toFixed?.(2) ?? b.sale_price}</div>
              </button>
            ))}
          </div>
        </Panel>
        <Panel title="Cart">
          <div className="space-y-2">
            {items.map((i, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-slate-800/60 border border-slate-700 rounded-md p-2">
                <select value={i.bag_id} onChange={(e)=>setItems(items.map((x,ii)=> ii===idx?{...x, bag_id:e.target.value}:x))} className="bg-slate-900 border border-slate-700 rounded px-2 py-1">
                  {bags.map(b=> <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <input type="number" value={i.quantity} onChange={(e)=>setItems(items.map((x,ii)=> ii===idx?{...x, quantity:Number(e.target.value)}:x))} className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-1" />
                <input type="number" value={i.unit_price} onChange={(e)=>setItems(items.map((x,ii)=> ii===idx?{...x, unit_price:Number(e.target.value)}:x))} className="w-24 bg-slate-900 border border-slate-700 rounded px-2 py-1" />
                <div className="ml-auto text-sm">${(i.quantity*i.unit_price).toFixed(2)}</div>
              </div>
            ))}
            <button onClick={()=>setItems([...items, { bag_id: bags[0]?.id, quantity: 1, unit_price: bags[0]?.sale_price || 0 }])} className="text-blue-400 text-sm">+ Add line</button>
          </div>
        </Panel>
        <Panel title="Summary">
          <div className="space-y-3">
            <input value={customerName} onChange={(e)=>setCustomerName(e.target.value)} placeholder="Customer Name" className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2" />
            <div className="grid grid-cols-3 gap-3">
              <div>
                <div className="text-xs text-slate-400">Subtotal</div>
                <div className="text-lg font-semibold">${totals.subtotal.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Tax Rate</div>
                <input type="number" step="0.01" value={taxRate} onChange={(e)=>setTaxRate(Number(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded-md px-2 py-1" />
              </div>
              <div>
                <div className="text-xs text-slate-400">Discount</div>
                <input type="number" step="0.01" value={discount} onChange={(e)=>setDiscount(Number(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded-md px-2 py-1" />
              </div>
            </div>
            <div className="flex items-center justify-between text-lg font-semibold">
              <span>Total</span>
              <span>${totals.total.toFixed(2)}</span>
            </div>
            <button onClick={placeOrder} className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-md">Place Order & Print Invoice</button>
          </div>
        </Panel>
      </div>
      <Panel title="Recent Orders">
        <div className="space-y-2">
          {orders.map(o => (
            <div key={o.id} className="bg-slate-900/60 border border-slate-800 rounded-md p-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">{o.invoice_number}</div>
                <div className="text-xs text-slate-400">Items: {o.items.length} • Total: ${o.total.toFixed(2)}</div>
              </div>
              <a className="text-blue-400 text-sm" href={`${API_BASE}/orders/${o.id}/invoice`} target="_blank">Invoice</a>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function App() {
  const auth = useAuth();
  useEffect(() => {
    // Try to seed an admin account silently for demo convenience
    fetch(`${API_BASE}/seed/admin`, { method: "POST" }).catch(()=>{});
  }, []);

  if (!auth.isAuthed) {
    return <LoginPage onLogin={auth.login} />
  }
  return (
    <BrowserRouter>
      <Layout onLogout={auth.logout} user={auth.user}>
        <Routes>
          <Route path="/" element={<Dashboard token={auth.token} />} />
          <Route path="/bags" element={<BagsPage token={auth.token} />} />
          <Route path="/customers" element={<CustomersPage token={auth.token} />} />
          <Route path="/orders" element={<OrdersPage token={auth.token} />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
