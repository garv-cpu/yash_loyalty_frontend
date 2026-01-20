import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "../firebase";

const AdminDashboard = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  const [customerUid, setCustomerUid] = useState("");
  const [saleAmount, setSaleAmount] = useState("");

  /* ---------------- CREATE CUSTOMER ---------------- */
  const createCustomer = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      if (password.length < 6) {
        setMessage("Password must be at least 6 characters");
        return;
      }

      const userCredential =
        await createUserWithEmailAndPassword(auth, email, password);

      const res = await fetch("http://localhost:5000/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firebaseUid: userCredential.user.uid,
          name,
          email,
          role: "customer",
          loyaltyPoints: 0,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save customer");
      }

      setMessage("Customer created successfully ✅");

      setEmail("");
      setPassword("");
      setName("");
    } catch (err) {
      console.error(err);
      setMessage("Error creating customer");
    }
  };

  /* ---------------- ADD SALE ---------------- */
  const addSale = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const res = await fetch("http://localhost:5000/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firebaseUid: customerUid,
          amount: Number(saleAmount),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Error adding sale");
        return;
      }

      setMessage(
        `Sale added: ₹${data.amount} → +${data.pointsEarned.toFixed(
          2
        )} points`
      );

      setCustomerUid("");
      setSaleAmount("");
    } catch (err) {
      console.error(err);
      setMessage("Server error");
    }
  };

  const logout = async () => {
    await signOut(auth);
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-800">
            Admin Dashboard
          </h1>

          <button
            onClick={logout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm"
          >
            Logout
          </button>
        </div>

        {/* CREATE CUSTOMER CARD */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Create Customer
          </h2>

          <form
            onSubmit={createCustomer}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <input
              type="text"
              placeholder="Customer Name"
              className="border rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <input
              type="email"
              placeholder="Customer Email"
              className="border rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder="Temp Password (min 6 chars)"
              className="border rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div className="md:col-span-3">
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-medium">
                Create Customer
              </button>
            </div>
          </form>
        </div>

        {/* ADD SALE CARD */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Add Sale (₹100 = 1 Point)
          </h2>

          <form
            onSubmit={addSale}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <input
              type="text"
              placeholder="Customer Firebase UID"
              className="border rounded px-3 py-2 focus:outline-none focus:ring focus:ring-green-200"
              value={customerUid}
              onChange={(e) => setCustomerUid(e.target.value)}
              required
            />

            <input
              type="number"
              placeholder="Sale Amount (₹)"
              className="border rounded px-3 py-2 focus:outline-none focus:ring focus:ring-green-200"
              value={saleAmount}
              onChange={(e) => setSaleAmount(e.target.value)}
              required
            />

            <div className="md:col-span-3">
              <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded font-medium">
                Add Sale
              </button>
            </div>
          </form>
        </div>

        {/* MESSAGE */}
        {message && (
          <div className="bg-white rounded-xl shadow p-4 text-center text-sm text-gray-700">
            {message}
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;
