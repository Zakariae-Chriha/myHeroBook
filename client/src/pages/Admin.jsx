import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Users, BookOpen, ShoppingCart, TrendingUp,
  RefreshCw, Eye, ChevronLeft, ChevronRight,
  Search, CheckCircle, Loader2, LayoutDashboard,
  Tag, Trash2, Plus, ToggleLeft, ToggleRight,
} from 'lucide-react'
import { adminService } from '../services/adminService.js'
import toast from 'react-hot-toast'

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmt(iso) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso))
}

function euros(n) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n || 0)
}

const STATUS_COLOR = {
  draft:             'text-muted bg-white/5',
  generating_story:  'text-amber-400 bg-amber-400/10',
  generating_images: 'text-amber-400 bg-amber-400/10',
  generating_voice:  'text-purple-400 bg-purple-400/10',
  assembling_pdf:    'text-blue-400 bg-blue-400/10',
  ready:             'text-green-400 bg-green-400/10',
  failed:            'text-red-400 bg-red-400/10',
  pending:           'text-muted bg-white/5',
  paid:              'text-green-400 bg-green-400/10',
  shipped:           'text-gold bg-gold/10',
  delivered:         'text-green-400 bg-green-400/10',
  refunded:          'text-muted bg-white/5',
}

function Badge({ status, label }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[status] || 'text-muted bg-white/5'}`}>
      {label || status}
    </span>
  )
}

function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <Loader2 className="w-8 h-8 text-gold animate-spin" />
    </div>
  )
}

function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-center gap-3 pt-4">
      <button onClick={() => onChange(page - 1)} disabled={page <= 1} className="p-2.5 rounded-lg border border-white/10 text-muted hover:text-white disabled:opacity-30 transition-colors">
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="text-muted text-sm">Page {page} / {totalPages}</span>
      <button onClick={() => onChange(page + 1)} disabled={page >= totalPages} className="p-2.5 rounded-lg border border-white/10 text-muted hover:text-white disabled:opacity-30 transition-colors">
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}

// ── Stats tab ─────────────────────────────────────────────────────────────────

function StatsTab() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminService.getStats()
      .then((res) => {
        console.log('[Admin] stats raw response:', res)
        setData(res.data)
      })
      .catch((err) => {
        console.error('[Admin] stats error:', err?.response?.data || err)
        toast.error('Failed to load stats')
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />
  if (!data) return <p className="text-muted text-center py-16">No data available</p>

  const stats = data.stats || {}
  const recentUsers = data.recentUsers || []
  const bs = stats.booksByStatus || {}

  const cards = [
    { label: 'Total Users',  value: stats.totalUsers,  icon: Users,        color: 'text-blue-400'   },
    { label: 'Total Books',  value: stats.totalBooks,  icon: BookOpen,     color: 'text-gold'       },
    { label: 'Total Orders', value: stats.totalOrders, icon: ShoppingCart, color: 'text-purple-400' },
    { label: 'Revenue',      value: euros(stats.totalRevenue), icon: TrendingUp, color: 'text-green-400' },
  ]

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-5 border border-white/8">
            <Icon className={`w-5 h-5 ${color} mb-3`} />
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-muted text-sm mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5 border border-white/8">
          <h3 className="text-white font-semibold mb-4">Books by status</h3>
          <div className="space-y-2">
            {[
              { key: 'ready', label: 'Ready' },
              { key: 'generating_images', label: 'Illustrating' },
              { key: 'generating_story', label: 'Writing' },
              { key: 'assembling_pdf', label: 'Assembling' },
              { key: 'failed', label: 'Failed' },
              { key: 'draft', label: 'Draft' },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <Badge status={key} label={label} />
                <span className="text-white font-medium">{bs[key] || 0}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5 border border-white/8">
          <h3 className="text-white font-semibold mb-4">Recent sign-ups</h3>
          <div className="space-y-3">
            {(recentUsers || []).map((u) => (
              <div key={u._id} className="flex items-center justify-between">
                <div>
                  <p className="text-cream text-sm font-medium">{u.firstName} {u.lastName}</p>
                  <p className="text-muted text-xs">{u.email}</p>
                </div>
                <p className="text-muted text-xs">{fmt(u.createdAt)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Books tab ─────────────────────────────────────────────────────────────────

function BooksTab() {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [retrying, setRetrying] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await adminService.getBooks(page, statusFilter)
      setBooks(data.books)
      setTotalPages(data.pagination.totalPages)
    } catch {
      toast.error('Failed to load books')
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter])

  useEffect(() => { load() }, [load])

  const handleRetry = async (bookId) => {
    setRetrying(bookId)
    try {
      await adminService.retryBook(bookId)
      toast.success('Book queued for regeneration')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Retry failed')
    } finally {
      setRetrying(null)
    }
  }

  const statuses = ['', 'draft', 'generating_story', 'generating_images', 'assembling_pdf', 'ready', 'failed']

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {statuses.map((s) => (
          <button key={s || 'all'} onClick={() => { setStatusFilter(s); setPage(1) }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${statusFilter === s ? 'bg-gold text-bg-primary border-gold' : 'border-white/15 text-muted hover:border-white/30 hover:text-white'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8 text-muted text-xs">
                <th className="text-left py-2 pr-4 font-medium">Title</th>
                <th className="text-left py-2 pr-4 font-medium hidden sm:table-cell">User</th>
                <th className="text-left py-2 pr-4 font-medium">Status</th>
                <th className="text-left py-2 pr-4 font-medium hidden md:table-cell">Lang</th>
                <th className="text-left py-2 pr-4 font-medium hidden sm:table-cell">Created</th>
                <th className="text-left py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {books.map((b) => (
                <tr key={b._id} className="hover:bg-white/2 transition-colors">
                  <td className="py-3 pr-4 text-cream max-w-[140px] sm:max-w-[180px] truncate">{b.title}</td>
                  <td className="py-3 pr-4 text-muted text-xs hidden sm:table-cell">{b.userId?.email}</td>
                  <td className="py-3 pr-4"><Badge status={b.status} /></td>
                  <td className="py-3 pr-4 text-muted hidden md:table-cell">{b.language}</td>
                  <td className="py-3 pr-4 text-muted text-xs hidden sm:table-cell">{fmt(b.createdAt)}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <Link to={`/preview/${b._id}`} className="p-2 rounded-lg border border-white/10 text-muted hover:text-white transition-colors" title="Preview">
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                      {b.status === 'failed' && (
                        <button onClick={() => handleRetry(b._id)} disabled={retrying === b._id}
                          className="p-2 rounded-lg border border-amber-400/30 text-amber-400 hover:border-amber-400 disabled:opacity-50 transition-colors" title="Retry">
                          {retrying === b._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {books.length === 0 && <tr><td colSpan={6} className="py-10 text-center text-muted">No books found</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  )
}

// ── Users tab ─────────────────────────────────────────────────────────────────

function UsersTab() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [togglingId, setTogglingId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await adminService.getUsers(page, query)
      setUsers(data.users)
      setTotalPages(data.pagination.totalPages)
    } catch {
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [page, query])

  useEffect(() => { load() }, [load])

  const handleToggleAdmin = async (u) => {
    if (!confirm(`${u.isAdmin ? 'Remove' : 'Grant'} admin for ${u.email}?`)) return
    setTogglingId(u._id)
    try {
      const { data } = await adminService.toggleAdmin(u._id)
      setUsers((prev) => prev.map((x) => x._id === u._id ? { ...x, isAdmin: data.isAdmin } : x))
      toast.success(data.isAdmin ? `${u.email} is now admin` : `${u.email} admin removed`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to toggle admin')
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={(e) => { e.preventDefault(); setPage(1); setQuery(search) }} className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email…" className="input-field pl-9 text-sm py-2" />
        </div>
        <button type="submit" className="btn-secondary px-4 py-2 text-sm">Search</button>
      </form>

      {loading ? <Spinner /> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8 text-muted text-xs">
                <th className="text-left py-2 pr-4 font-medium">Name</th>
                <th className="text-left py-2 pr-4 font-medium hidden sm:table-cell">Email</th>
                <th className="text-left py-2 pr-4 font-medium hidden md:table-cell">Books</th>
                <th className="text-left py-2 pr-4 font-medium hidden md:table-cell">Plan</th>
                <th className="text-left py-2 pr-4 font-medium hidden sm:table-cell">Joined</th>
                <th className="text-left py-2 font-medium">Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-white/2 transition-colors">
                  <td className="py-3 pr-4 text-cream font-medium">
                    <p>{u.firstName} {u.lastName}</p>
                    <p className="text-muted text-xs sm:hidden truncate max-w-[140px]">{u.email}</p>
                  </td>
                  <td className="py-3 pr-4 text-muted text-xs hidden sm:table-cell">{u.email}</td>
                  <td className="py-3 pr-4 text-white hidden md:table-cell">{u.bookCount}</td>
                  <td className="py-3 pr-4 hidden md:table-cell"><span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-muted">{u.subscription?.plan || 'free'}</span></td>
                  <td className="py-3 pr-4 text-muted text-xs hidden sm:table-cell">{fmt(u.createdAt)}</td>
                  <td className="py-3">
                    <button
                      onClick={() => handleToggleAdmin(u)}
                      disabled={togglingId === u._id}
                      title={u.isAdmin ? 'Remove admin' : 'Make admin'}
                      className="flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      {togglingId === u._id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-muted" />
                      ) : u.isAdmin ? (
                        <ToggleRight className="w-5 h-5 text-gold" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-white/25 hover:text-white/50" />
                      )}
                      {u.isAdmin && <span className="text-xs text-gold hidden sm:inline">admin</span>}
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan={6} className="py-10 text-center text-muted">No users found</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  )
}

// ── Orders tab ────────────────────────────────────────────────────────────────

function OrdersTab() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await adminService.getOrders(page, statusFilter)
      setOrders(data.orders)
      setTotalPages(data.pagination.totalPages)
    } catch {
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter])

  useEffect(() => { load() }, [load])

  const statuses = ['', 'pending', 'paid', 'generating', 'shipped', 'delivered', 'failed', 'refunded']

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {statuses.map((s) => (
          <button key={s || 'all'} onClick={() => { setStatusFilter(s); setPage(1) }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${statusFilter === s ? 'bg-gold text-bg-primary border-gold' : 'border-white/15 text-muted hover:border-white/30 hover:text-white'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8 text-muted text-xs">
                <th className="text-left py-2 pr-4 font-medium hidden sm:table-cell">Order ID</th>
                <th className="text-left py-2 pr-4 font-medium hidden md:table-cell">User</th>
                <th className="text-left py-2 pr-4 font-medium">Book</th>
                <th className="text-left py-2 pr-4 font-medium">Amount</th>
                <th className="text-left py-2 pr-4 font-medium">Status</th>
                <th className="text-left py-2 font-medium hidden sm:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {orders.map((o) => (
                <tr key={o._id} className="hover:bg-white/2 transition-colors">
                  <td className="py-3 pr-4 text-white/40 text-xs font-mono hidden sm:table-cell">{o._id.toString().slice(-8)}</td>
                  <td className="py-3 pr-4 text-muted text-xs hidden md:table-cell">{o.userId?.email}</td>
                  <td className="py-3 pr-4 text-cream text-xs max-w-[120px] sm:max-w-[160px] truncate">{o.bookId?.title || '—'}</td>
                  <td className="py-3 pr-4 text-white font-medium">{euros(o.price)}</td>
                  <td className="py-3 pr-4"><Badge status={o.status} /></td>
                  <td className="py-3 text-muted text-xs hidden sm:table-cell">{fmt(o.createdAt)}</td>
                </tr>
              ))}
              {orders.length === 0 && <tr><td colSpan={6} className="py-10 text-center text-muted">No orders found</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  )
}

// ── Promo codes tab ───────────────────────────────────────────────────────────

function PromoCodesTab() {
  const [codes, setCodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ code: '', discountType: 'percentage', discountValue: '', maxUses: '', expiresAt: '', note: '' })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await adminService.getPromoCodes()
      setCodes(data.codes)
    } catch { toast.error('Failed to load promo codes') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.code || !form.discountValue) return
    setSaving(true)
    try {
      await adminService.createPromoCode({
        code: form.code,
        discountType: form.discountType,
        discountValue: parseFloat(form.discountValue),
        maxUses: form.maxUses ? parseInt(form.maxUses) : null,
        expiresAt: form.expiresAt || null,
        note: form.note,
      })
      toast.success('Promo code created!')
      setForm({ code: '', discountType: 'percentage', discountValue: '', maxUses: '', expiresAt: '', note: '' })
      setShowForm(false)
      load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create') }
    finally { setSaving(false) }
  }

  const handleToggle = async (id, active) => {
    try {
      await adminService.updatePromoCode(id, { active: !active })
      setCodes((prev) => prev.map((c) => c._id === id ? { ...c, active: !active } : c))
    } catch { toast.error('Failed to update') }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this promo code?')) return
    try {
      await adminService.deletePromoCode(id)
      setCodes((prev) => prev.filter((c) => c._id !== id))
      toast.success('Deleted')
    } catch { toast.error('Failed to delete') }
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button onClick={() => setShowForm((v) => !v)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${showForm ? 'bg-gold text-bg-primary border-gold' : 'border-white/15 text-muted hover:text-white'}`}>
          <Plus className="w-4 h-4" /> New code
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card p-5 border border-gold/20 space-y-3">
          <p className="text-white font-semibold text-sm">New promo code</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-muted text-xs mb-1 block">Code *</label>
              <input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="SUMMER20" required className="input-field text-sm py-2 uppercase" />
            </div>
            <div>
              <label className="text-muted text-xs mb-1 block">Type *</label>
              <select value={form.discountType} onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value }))}
                className="input-field text-sm py-2">
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed (€)</option>
              </select>
            </div>
            <div>
              <label className="text-muted text-xs mb-1 block">Value * {form.discountType === 'percentage' ? '(%)' : '(€)'}</label>
              <input value={form.discountValue} onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))}
                placeholder={form.discountType === 'percentage' ? '20' : '5'} type="number" min="0" required className="input-field text-sm py-2" />
            </div>
            <div>
              <label className="text-muted text-xs mb-1 block">Max uses (blank = unlimited)</label>
              <input value={form.maxUses} onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value }))}
                placeholder="100" type="number" min="1" className="input-field text-sm py-2" />
            </div>
            <div>
              <label className="text-muted text-xs mb-1 block">Expires (blank = never)</label>
              <input value={form.expiresAt} onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                type="date" className="input-field text-sm py-2" />
            </div>
            <div>
              <label className="text-muted text-xs mb-1 block">Note (internal)</label>
              <input value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                placeholder="Summer campaign" className="input-field text-sm py-2" />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary px-4 py-2 text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary px-5 py-2 text-sm disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
            </button>
          </div>
        </form>
      )}

      {loading ? <Spinner /> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8 text-muted text-xs">
                <th className="text-left py-2 pr-4 font-medium">Code</th>
                <th className="text-left py-2 pr-4 font-medium">Discount</th>
                <th className="text-left py-2 pr-4 font-medium hidden sm:table-cell">Uses</th>
                <th className="text-left py-2 pr-4 font-medium hidden md:table-cell">Expires</th>
                <th className="text-left py-2 pr-4 font-medium hidden md:table-cell">Note</th>
                <th className="text-left py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {codes.map((c) => (
                <tr key={c._id} className="hover:bg-white/2 transition-colors">
                  <td className="py-3 pr-4">
                    <span className="font-mono text-white font-medium">{c.code}</span>
                    {!c.active && <span className="ml-2 text-xs text-muted">(off)</span>}
                  </td>
                  <td className="py-3 pr-4 text-cream">
                    {c.discountType === 'percentage' ? `${c.discountValue}%` : `€${c.discountValue}`}
                  </td>
                  <td className="py-3 pr-4 text-muted text-xs hidden sm:table-cell">
                    {c.usedCount}{c.maxUses ? ` / ${c.maxUses}` : ''}
                  </td>
                  <td className="py-3 pr-4 text-muted text-xs hidden md:table-cell">{c.expiresAt ? fmt(c.expiresAt) : '—'}</td>
                  <td className="py-3 pr-4 text-muted text-xs max-w-[120px] truncate hidden md:table-cell">{c.note || '—'}</td>
                  <td className="py-3 flex items-center gap-2">
                    <button onClick={() => handleToggle(c._id, c.active)} title={c.active ? 'Deactivate' : 'Activate'}
                      className={`p-1 transition-colors ${c.active ? 'text-green-400 hover:text-muted' : 'text-muted hover:text-green-400'}`}>
                      {c.active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                    </button>
                    <button onClick={() => handleDelete(c._id)} title="Delete"
                      className="p-1 text-muted hover:text-error transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {codes.length === 0 && (
                <tr><td colSpan={6} className="py-10 text-center text-muted">No promo codes yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'stats',  label: 'Stats',  icon: TrendingUp  },
  { id: 'books',  label: 'Books',  icon: BookOpen    },
  { id: 'users',  label: 'Users',  icon: Users       },
  { id: 'orders', label: 'Orders', icon: ShoppingCart },
  { id: 'promos', label: 'Promos', icon: Tag         },
]

export default function Admin() {
  const [tab, setTab] = useState('stats')

  return (
    <div className="pt-20 min-h-screen bg-bg-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-heading font-bold text-white">
                Admin <span className="gold-text">Panel</span>
              </h1>
              <p className="text-muted mt-1 text-sm hidden sm:block">Manage users, books, orders and promo codes</p>
            </div>
            <Link to="/dashboard" className="flex-shrink-0 flex items-center gap-1.5 text-muted hover:text-white text-sm transition-colors mt-1">
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
          </div>
        </motion.div>

        <div className="mb-6 overflow-x-auto scrollbar-hide -mx-4 sm:mx-0 px-4 sm:px-0">
          <div className="flex gap-1 bg-bg-secondary rounded-xl p-1 w-max sm:w-fit">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${tab === id ? 'bg-gold text-bg-primary shadow-sm' : 'text-muted hover:text-white'}`}>
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          {tab === 'stats'  && <StatsTab />}
          {tab === 'books'  && <BooksTab />}
          {tab === 'users'  && <UsersTab />}
          {tab === 'orders' && <OrdersTab />}
          {tab === 'promos' && <PromoCodesTab />}
        </motion.div>
      </div>
    </div>
  )
}
