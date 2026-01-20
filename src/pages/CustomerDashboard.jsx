import { useEffect, useState } from "react";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";

const CustomerDashboard = () => {
  const [name, setName] = useState("");
  const [points, setPoints] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [redeemAmount, setRedeemAmount] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        window.location.href = "/";
        return;
      }

      try {
        // Fetch dashboard data
        const res = await fetch(
          `http://localhost:5000/api/dashboard/${user.uid}`
        );
        const data = await res.json();

        setPoints(data.loyaltyPoints);
        setTransactions(data.transactions);

        // Fetch customer profile (name)
        const userRes = await fetch(
          `http://localhost:5000/api/users/${user.uid}`
        );
        const userData = await userRes.json();
        setName(userData.name);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const redeemPoints = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const res = await fetch("http://localhost:5000/api/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firebaseUid: auth.currentUser.uid,
          pointsToRedeem: Number(redeemAmount),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Redeem failed");
        return;
      }

      setPoints(data.remainingPoints);
      setMessage(`Redeemed ₹${data.redeemValue.toFixed(2)} successfully`);

      const dashRes = await fetch(
        `http://localhost:5000/api/dashboard/${auth.currentUser.uid}`
      );
      const dashData = await dashRes.json();
      setTransactions(dashData.transactions);

      setRedeemAmount("");
    } catch (err) {
      setMessage("Server error");
    }
  };

  const logout = async () => {
    await signOut(auth);
    window.location.href = "/";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-800">
            Hi, {name || "Customer"} 👋
          </h1>

          <button
            onClick={logout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm"
          >
            Logout
          </button>
        </div>

        {/* POINTS CARD */}
        <div className="bg-white rounded-xl shadow p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-gray-500 text-sm">
              Available Loyalty Points
            </p>
            <p className="text-4xl font-bold text-green-600">
              {points.toFixed(2)} pts
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Redeem value: ₹{points.toFixed(2)}
            </p>
          </div>

          <div className="w-full sm:w-72">
            <form onSubmit={redeemPoints} className="space-y-3">
              <input
                type="number"
                placeholder="Points to redeem"
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:ring-green-200"
                value={redeemAmount}
                onChange={(e) => setRedeemAmount(e.target.value)}
                step="0.01"
                min="0"
                required
              />

              <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded font-medium">
                Redeem Points
              </button>
            </form>

            {message && (
              <p className="mt-2 text-sm text-center text-gray-700">
                {message}
              </p>
            )}
          </div>
        </div>

        {/* TRANSACTIONS */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Transaction History
          </h2>

          {transactions.length === 0 ? (
            <p className="text-sm text-gray-500">
              No transactions yet
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="py-2">Amount (₹)</th>
                    <th className="py-2">Points</th>
                    <th className="py-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr
                      key={t._id}
                      className="border-b last:border-none"
                    >
                      <td className="py-2">₹{t.amount}</td>
                      <td
                        className={`py-2 ${
                          t.pointsEarned >= 0
                            ? "text-green-600"
                            : "text-red-500"
                        }`}
                      >
                        {t.pointsEarned > 0 && "+"}
                        {t.pointsEarned.toFixed(2)}
                      </td>
                      <td className="py-2 text-gray-500">
                        {new Date(t.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default CustomerDashboard;
