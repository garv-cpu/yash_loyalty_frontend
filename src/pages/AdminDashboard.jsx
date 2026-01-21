import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "../firebase";

const logSection = (title) => {
  console.log(
    "%c" + title,
    "background:#111;color:#0f0;padding:4px 8px;border-radius:4px"
  );
};

const logError = (title, err) => {
  console.error(
    "%c" + title,
    "background:#600;color:#fff;padding:4px 8px;border-radius:4px"
  );
  console.error(err);
};

const AdminDashboard = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  const [customerEmail, setCustomerEmail] = useState("");
  const [saleAmount, setSaleAmount] = useState("");

  /* ---------------- CREATE CUSTOMER ---------------- */
  const createCustomer = async (e) => {
    e.preventDefault();
    setMessage("");

    logSection("CREATE CUSTOMER START");

    try {
      console.log("Input values:", {
        name,
        email,
        passwordLength: password.length,
      });

      if (password.length < 6) {
        console.warn("Password too short");
        setMessage("Password must be at least 6 characters");
        return;
      }

      /* -------- FIREBASE STEP -------- */
      logSection("FIREBASE: createUserWithEmailAndPassword");

      const userCredential =
        await createUserWithEmailAndPassword(auth, email, password);

      console.log("Firebase user created:", {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
      });

      /* -------- BACKEND STEP -------- */
      logSection("BACKEND: POST /api/users");

      const payload = {
        firebaseUid: userCredential.user.uid,
        name,
        email,
        role: "customer",
        loyaltyPoints: 0,
      };

      console.log("Request payload:", payload);

      const res = await fetch("https://yash-loyalty-backend.onrender.com/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log("Response status:", res.status, res.statusText);

      const data = await res.json();
      console.log("Response body:", data);

      if (!res.ok) {
        logError("BACKEND ERROR", data);
        throw new Error(
          data.message || "Backend rejected customer creation"
        );
      }

      console.log("Customer successfully saved in DB");

      setMessage("Customer created successfully ✅");
      setEmail("");
      setPassword("");
      setName("");

    } catch (err) {
      logError("CREATE CUSTOMER FAILED", err);

      /* Detect Firebase errors specifically */
      if (err.code) {
        console.error("Firebase error code:", err.code);
        console.error("Firebase error message:", err.message);
      }

      setMessage(err.message || "Error creating customer");
    } finally {
      logSection("CREATE CUSTOMER END");
    }
  };


  /* ---------------- ADD SALE (EMAIL BASED) ---------------- */
  const addSale = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const res = await fetch("https://yash-loyalty-backend.onrender.com/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: customerEmail,
          amount: Number(saleAmount),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Error adding sale");
        return;
      }

      setMessage(
        `Sale added for ${data.customer} (${data.email}) — ₹${data.amount} → +${data.pointsEarned.toFixed(
          2
        )} pts`
      );

      setCustomerEmail("");
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
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">
            Admin Dashboard
          </h1>

          <button
            onClick={logout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
          >
            Logout
          </button>
        </div>

        {/* CREATE CUSTOMER */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">
            Create Customer
          </h2>

          <form
            onSubmit={createCustomer}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <input
              type="text"
              placeholder="Customer Name"
              className="border rounded px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <input
              type="email"
              placeholder="Customer Email"
              className="border rounded px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder="Temporary Password"
              className="border rounded px-3 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div className="md:col-span-3">
              <button className="w-full bg-blue-600 text-white py-2 rounded">
                Create Customer
              </button>
            </div>
          </form>
        </div>

        {/* ADD SALE */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">
            Add Sale (by Email)
          </h2>

          <form
            onSubmit={addSale}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <input
              type="email"
              placeholder="Customer Email"
              className="border rounded px-3 py-2"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              required
            />

            <input
              type="number"
              placeholder="Sale Amount (₹)"
              className="border rounded px-3 py-2"
              value={saleAmount}
              onChange={(e) => setSaleAmount(e.target.value)}
              required
            />

            <div className="md:col-span-2">
              <button className="w-full bg-green-600 text-white py-2 rounded">
                Add Sale
              </button>
            </div>
          </form>
        </div>

        {/* MESSAGE */}
        {message && (
          <div className="bg-white rounded-xl shadow p-4 text-center text-sm">
            {message}
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;
