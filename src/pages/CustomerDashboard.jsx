import { useEffect, useRef, useState } from "react";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";

const CustomerDashboard = () => {
  const [name, setName] = useState("");
  const [points, setPoints] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [redeemAmount, setRedeemAmount] = useState("");
  const [message, setMessage] = useState("");

  // 🔔 Track previous points for notifications
  const prevPointsRef = useRef(null);

  /* ---------------- NOTIFICATION HELPERS ---------------- */
  const requestNotificationPermission = async () => {
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
  };

  const showNotification = (title, body) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body });
    }
  };

  /* ---------------- FETCH DASHBOARD ---------------- */
  const fetchDashboard = async (uid, isFirstLoad = false) => {
    const res = await fetch(
      `https://yash-loyalty-backend.onrender.com/api/dashboard/${uid}`
    );
    const data = await res.json();

    // 🔔 Notify on points change
    if (prevPointsRef.current !== null) {
      const diff = data.loyaltyPoints - prevPointsRef.current;

      if (diff !== 0) {
        const sign = diff > 0 ? "+" : "";
        showNotification(
          diff > 0 ? "🎉 Points Added" : "💸 Points Redeemed",
          `${sign}${diff.toFixed(2)} pts • Total: ${data.loyaltyPoints.toFixed(
            2
          )}`
        );
      }
    }

    // 🔔 First login notification
    if (isFirstLoad) {
      showNotification(
        `Hi ${name || "there"} 👋`,
        `You have ${data.loyaltyPoints.toFixed(2)} loyalty points`
      );
    }

    prevPointsRef.current = data.loyaltyPoints;
    setPoints(data.loyaltyPoints);
    setTransactions(data.transactions);
  };

  /* ---------------- AUTH LISTENER ---------------- */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        window.location.href = "/";
        return;
      }

      await requestNotificationPermission();

      try {
        // Fetch customer profile (name)
        const userRes = await fetch(
          `https://yash-loyalty-backend.onrender.com/api/users/${user.uid}`
        );
        const userData = await userRes.json();
        setName(userData.name);

        // Fetch dashboard data
        await fetchDashboard(user.uid, true);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [name]);

  /* ---------------- REDEEM ---------------- */
  const redeemPoints = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const res = await fetch("https://yash-loyalty-backend.onrender.com/api/redeem", {
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

      setMessage(`Redeemed ₹${data.redeemValue.toFixed(2)} successfully`);
      await fetchDashboard(auth.currentUser.uid);
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
