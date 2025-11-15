import { useEffect, useMemo, useState } from 'react'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function useAuth() {
  const [token, setToken] = useState(localStorage.getItem('pc_token') || '')
  const [email, setEmail] = useState('admin@pabloscar.com')
  const [password, setPassword] = useState('admin123')
  const authedHeaders = useMemo(() => ({
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }), [token])

  async function login() {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) throw new Error('Login failed')
    const data = await res.json()
    localStorage.setItem('pc_token', data.access_token)
    setToken(data.access_token)
  }

  function logout() {
    localStorage.removeItem('pc_token')
    setToken('')
  }

  return { token, email, setEmail, password, setPassword, login, logout, authedHeaders }
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-xl shadow p-5 mb-6">
      <h2 className="font-semibold text-lg mb-3">{title}</h2>
      {children}
    </div>
  )
}

function App() {
  const { token, email, setEmail, password, setPassword, login, logout, authedHeaders } = useAuth()

  // Customers
  const [customers, setCustomers] = useState([])
  const [newCustomer, setNewCustomer] = useState({ full_name: '', passport_number: '', phone: '', email: '' })

  // Vehicles
  const [vehicles, setVehicles] = useState([])
  const [newVehicle, setNewVehicle] = useState({ customer_id: '', brand: '', model: '', vin: '' })

  // Payments
  const [payments, setPayments] = useState([])
  const [newPayment, setNewPayment] = useState({ customer_id: '', amount: 0, payment_type: 'advance', payment_status: 'pending' })

  // Shipping
  const [shipping, setShipping] = useState([])
  const [newShip, setNewShip] = useState({ vehicle_id: '', container_number: '', shipping_company: '', status: 'pending' })

  async function loadAll() {
    if (!token) return
    const [c, v, p, s] = await Promise.all([
      fetch(`${API_URL}/customers`, { headers: authedHeaders }).then(r => r.json()),
      fetch(`${API_URL}/vehicles`, { headers: authedHeaders }).then(r => r.json()),
      fetch(`${API_URL}/payments`, { headers: authedHeaders }).then(r => r.json()),
      fetch(`${API_URL}/shipping`, { headers: authedHeaders }).then(r => r.json()),
    ])
    setCustomers(c)
    setVehicles(v)
    setPayments(p)
    setShipping(s)
  }

  useEffect(() => { loadAll() }, [token])

  async function addCustomer() {
    await fetch(`${API_URL}/customers`, { method: 'POST', headers: authedHeaders, body: JSON.stringify(newCustomer) })
    setNewCustomer({ full_name: '', passport_number: '', phone: '', email: '' })
    loadAll()
  }

  async function addVehicle() {
    await fetch(`${API_URL}/vehicles`, { method: 'POST', headers: authedHeaders, body: JSON.stringify(newVehicle) })
    setNewVehicle({ customer_id: '', brand: '', model: '', vin: '' })
    loadAll()
  }

  async function addPayment() {
    await fetch(`${API_URL}/payments`, { method: 'POST', headers: authedHeaders, body: JSON.stringify(newPayment) })
    setNewPayment({ customer_id: '', amount: 0, payment_type: 'advance', payment_status: 'pending' })
    loadAll()
  }

  async function addShipping() {
    await fetch(`${API_URL}/shipping`, { method: 'POST', headers: authedHeaders, body: JSON.stringify(newShip) })
    setNewShip({ vehicle_id: '', container_number: '', shipping_company: '', status: 'pending' })
    loadAll()
  }

  async function downloadShippingSheet(vehicleId, fmt) {
    const res = await fetch(`${API_URL}/shipping-sheet/${vehicleId}?fmt=${fmt}`, { headers: authedHeaders })
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `shipping_sheet_${vehicleId}.${fmt === 'pdf' ? 'pdf' : 'xlsx'}`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function downloadReport() {
    const type = window.prompt('Report type: customers | vehicles | payments | shipping','customers')
    if (!type) return
    const res = await fetch(`${API_URL}/reports?report_type=${type}`, { headers: authedHeaders })
    if (!res.ok) {
      alert('Failed to download report')
      return
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${type}_report.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto p-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Pablo's Car - Sub-Customer Management</h1>
          {token ? (
            <button onClick={logout} className="px-3 py-1 rounded bg-gray-800 text-white">Logout</button>
          ) : (
            <div className="flex gap-2">
              <input className="border rounded px-2 py-1" placeholder="email" value={email} onChange={e=>setEmail(e.target.value)} />
              <input className="border rounded px-2 py-1" placeholder="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
              <button onClick={login} className="px-3 py-1 rounded bg-blue-600 text-white">Login</button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
        {!token && (
          <div className="text-gray-600">Login with the default admin to begin.</div>
        )}

        {!!token && (
          <>
            <Section title="Customers">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input className="border rounded px-2 py-1" placeholder="Full Name" value={newCustomer.full_name} onChange={e=>setNewCustomer(v=>({...v, full_name:e.target.value}))} />
                <input className="border rounded px-2 py-1" placeholder="Passport Number" value={newCustomer.passport_number} onChange={e=>setNewCustomer(v=>({...v, passport_number:e.target.value}))} />
                <input className="border rounded px-2 py-1" placeholder="Phone" value={newCustomer.phone} onChange={e=>setNewCustomer(v=>({...v, phone:e.target.value}))} />
                <input className="border rounded px-2 py-1" placeholder="Email" value={newCustomer.email} onChange={e=>setNewCustomer(v=>({...v, email:e.target.value}))} />
                <button className="col-span-full px-3 py-2 rounded bg-blue-600 text-white" onClick={addCustomer}>Add Customer</button>
              </div>
              <div className="mt-4 overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="py-2">Name</th>
                      <th>Passport</th>
                      <th>Phone</th>
                      <th>Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map(c => (
                      <tr key={c.id} className="border-b">
                        <td className="py-2">{c.full_name}</td>
                        <td>{c.passport_number}</td>
                        <td>{c.phone}</td>
                        <td>{c.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            <Section title="Vehicles">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <select className="border rounded px-2 py-1" value={newVehicle.customer_id} onChange={e=>setNewVehicle(v=>({...v, customer_id:e.target.value}))}>
                  <option value="">Select Customer</option>
                  {customers.map(c=> <option key={c.id} value={c.id}>{c.full_name}</option>)}
                </select>
                <input className="border rounded px-2 py-1" placeholder="Brand" value={newVehicle.brand} onChange={e=>setNewVehicle(v=>({...v, brand:e.target.value}))} />
                <input className="border rounded px-2 py-1" placeholder="Model" value={newVehicle.model} onChange={e=>setNewVehicle(v=>({...v, model:e.target.value}))} />
                <input className="border rounded px-2 py-1 md:col-span-2" placeholder="VIN" value={newVehicle.vin} onChange={e=>setNewVehicle(v=>({...v, vin:e.target.value}))} />
                <button className="px-3 py-2 rounded bg-blue-600 text-white" onClick={addVehicle}>Add Vehicle</button>
              </div>
              <div className="mt-4 overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="py-2">Customer</th>
                      <th>Brand</th>
                      <th>Model</th>
                      <th>VIN</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicles.map(v => (
                      <tr key={v.id} className="border-b">
                        <td className="py-2">{customers.find(c=>c.id===v.customer_id)?.full_name || v.customer_id}</td>
                        <td>{v.brand}</td>
                        <td>{v.model}</td>
                        <td>{v.vin}</td>
                        <td className="space-x-2">
                          <button className="px-2 py-1 text-xs rounded bg-emerald-600 text-white" onClick={()=>downloadShippingSheet(v.id, 'pdf')}>PDF</button>
                          <button className="px-2 py-1 text-xs rounded bg-indigo-600 text-white" onClick={()=>downloadShippingSheet(v.id, 'xlsx')}>Excel</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            <Section title="Payments">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <select className="border rounded px-2 py-1" value={newPayment.customer_id} onChange={e=>setNewPayment(v=>({...v, customer_id:e.target.value}))}>
                  <option value="">Select Customer</option>
                  {customers.map(c=> <option key={c.id} value={c.id}>{c.full_name}</option>)}
                </select>
                <input type="number" className="border rounded px-2 py-1" placeholder="Amount" value={newPayment.amount} onChange={e=>setNewPayment(v=>({...v, amount:parseFloat(e.target.value||'0')}))} />
                <select className="border rounded px-2 py-1" value={newPayment.payment_type} onChange={e=>setNewPayment(v=>({...v, payment_type:e.target.value}))}>
                  <option value="advance">Advance</option>
                  <option value="final">Final</option>
                  <option value="other">Other</option>
                </select>
                <button className="px-3 py-2 rounded bg-blue-600 text-white" onClick={addPayment}>Add Payment</button>
              </div>
              <div className="mt-4 overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="py-2">Customer</th>
                      <th>Amount</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map(p => (
                      <tr key={p.id} className="border-b">
                        <td className="py-2">{customers.find(c=>c.id===p.customer_id)?.full_name || p.customer_id}</td>
                        <td>${p.amount}</td>
                        <td>{p.payment_type}</td>
                        <td>{p.payment_status}</td>
                        <td>{p.payment_date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            <Section title="Shipping">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <select className="border rounded px-2 py-1" value={newShip.vehicle_id} onChange={e=>setNewShip(v=>({...v, vehicle_id:e.target.value}))}>
                  <option value="">Select Vehicle</option>
                  {vehicles.map(v=> <option key={v.id} value={v.id}>{v.brand} {v.model} ({v.vin})</option>)}
                </select>
                <input className="border rounded px-2 py-1" placeholder="Container Number" value={newShip.container_number} onChange={e=>setNewShip(v=>({...v, container_number:e.target.value}))} />
                <input className="border rounded px-2 py-1" placeholder="Shipping Company" value={newShip.shipping_company} onChange={e=>setNewShip(v=>({...v, shipping_company:e.target.value}))} />
                <select className="border rounded px-2 py-1" value={newShip.status} onChange={e=>setNewShip(v=>({...v, status:e.target.value}))}>
                  <option value="pending">Pending</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                </select>
                <button className="px-3 py-2 rounded bg-blue-600 text-white" onClick={addShipping}>Add Shipping</button>
              </div>
              <div className="mt-4 overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="py-2">Vehicle</th>
                      <th>Container</th>
                      <th>Company</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shipping.map(s => (
                      <tr key={s.id} className="border-b">
                        <td className="py-2">{vehicles.find(v=>v.id===s.vehicle_id)?.vin || s.vehicle_id}</td>
                        <td>{s.container_number}</td>
                        <td>{s.shipping_company}</td>
                        <td>{s.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            <Section title="Reports">
              <button className="px-3 py-2 rounded bg-emerald-600 text-white" onClick={downloadReport}>Download Report</button>
            </Section>
          </>
        )}
      </main>
    </div>
  )
}

export default App
