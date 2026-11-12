
import { useEffect, useState } from "react";

import {
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp
} from "firebase/firestore";

import { db } from "../services/firebase";

export default function ExpenseTracker({
  tripId,
  members = [],
  currentUser
}) {
  const [expenses, setExpenses] = useState([]);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  // LOAD SHARED EXPENSES
  useEffect(() => {
    if (!tripId) return;

    const expensesRef = collection(
      db,
      "trips",
      tripId,
      "expenses"
    );

    const unsubscribe = onSnapshot(
      expensesRef,
      (snapshot) => {
        const expenseList = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data()
        }));

        expenseList.sort((a, b) => {
          const timeA = a.createdAt?.toMillis?.() || 0;
          const timeB = b.createdAt?.toMillis?.() || 0;
          return timeB - timeA;
        });

        setExpenses(expenseList);
      },
      (error) => {
        console.error("Expense loading error:", error);
      }
    );

    return unsubscribe;
  }, [tripId]);

  // ADD EXPENSE
  async function handleAddExpense(e) {
    e.preventDefault();

    const cleanDescription = description.trim();
    const expenseAmount = Number(amount);

    if (!cleanDescription || !Number.isFinite(expenseAmount) ||
        expenseAmount <= 0) {
      alert("Enter a valid description and amount.");
      return;
    }

    if (!members.includes(currentUser.uid)) {
      alert("You are not a member of this trip.");
      return;
    }

    setLoading(true);

    try {
      await addDoc(
        collection(db, "trips", tripId, "expenses"),
        {
          description: cleanDescription,
          amount: Math.round(expenseAmount * 100) / 100,
          paidBy: currentUser.uid,
          paidByName:
            currentUser.displayName || currentUser.email,
          createdBy: currentUser.uid,
          participantIds: members,
          createdAt: serverTimestamp()
        }
      );

      setDescription("");
      setAmount("");
    } catch (error) {
      console.error("Expense adding error:", error);
      alert("Unable to add expense. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // CALCULATE MEMBER BALANCES IN PAISE
  const balances = {};

  members.forEach((memberId) => {
    balances[memberId] = 0;
  });

  expenses.forEach((expense) => {
    const participants = (expense.participantIds || [])
      .filter((memberId) => members.includes(memberId));

    if (participants.length === 0) return;

    const totalPaise = Math.round(Number(expense.amount) * 100);
    const baseShare = Math.floor(
      totalPaise / participants.length
    );
    const remainder = totalPaise % participants.length;

    // The person who paid gets credit for the full amount.
    if (balances[expense.paidBy] !== undefined) {
      balances[expense.paidBy] += totalPaise;
    }

    // Each participant is charged an equal share.
    participants.forEach((memberId, index) => {
      const share = baseShare + (index < remainder ? 1 : 0);
      balances[memberId] -= share;
    });
  });

  const totalExpenses = expenses.reduce(
    (total, expense) => total + Number(expense.amount || 0),
    0
  );

  const myBalance = balances[currentUser.uid] || 0;

  function formatCurrency(value) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2
    }).format(value);
  }

  function memberLabel(memberId) {
    return memberId === currentUser.uid
      ? "You"
      : `Member ${memberId.slice(0, 6)}`;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      <div>
        <h2 className="text-2xl font-bold text-slate-800">
          Shared Expenses 💰
        </h2>
        <p className="text-slate-500 mt-1">
          Track spending and split costs with your trip members.
        </p>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        <div className="bg-white rounded-xl shadow p-5">
          <p className="text-sm text-slate-500">
            Total Trip Expenses
          </p>
          <h3 className="text-2xl font-bold text-slate-800 mt-2">
            {formatCurrency(totalExpenses)}
          </h3>
        </div>

        <div className="bg-white rounded-xl shadow p-5">
          <p className="text-sm text-slate-500">
            Number of Expenses
          </p>
          <h3 className="text-2xl font-bold text-slate-800 mt-2">
            {expenses.length}
          </h3>
        </div>

        <div className="bg-white rounded-xl shadow p-5">
          <p className="text-sm text-slate-500">
            Your Balance
          </p>
          <h3
            className={`text-2xl font-bold mt-2 ${
              myBalance >= 0
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {formatCurrency(Math.abs(myBalance) / 100)}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {myBalance > 0
              ? "You are owed this amount"
              : myBalance < 0
                ? "Your share to pay"
                : "You are settled"}
          </p>
        </div>

      </div>

      {/* ADD EXPENSE FORM */}
      <form
        onSubmit={handleAddExpense}
        className="bg-white rounded-xl shadow p-5 space-y-4"
      >
        <h3 className="text-lg font-bold text-slate-800">
          Add New Expense
        </h3>

        <input
          type="text"
          placeholder="Expense description (e.g. Dinner)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={100}
          required
          className="w-full border rounded-lg p-3"
        />

        <input
          type="number"
          placeholder="Amount in ₹"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min="0.01"
          step="0.01"
          required
          className="w-full border rounded-lg p-3"
        />

        <p className="text-sm text-slate-500">
          Paid by: You
        </p>

        <p className="text-sm text-slate-500">
          Split equally among {members.length} trip member(s).
        </p>

        <button
          type="submit"
          disabled={loading || members.length === 0}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Saving..." : "+ Add Expense"}
        </button>
      </form>

      {/* MEMBER BALANCES */}
      <div className="bg-white rounded-xl shadow p-5">
        <h3 className="text-lg font-bold text-slate-800 mb-4">
          Member Balances
        </h3>

        {members.map((memberId) => {
          const balance = balances[memberId] || 0;

          return (
            <div
              key={memberId}
              className="flex justify-between items-center border-b last:border-0 py-3"
            >
              <span className="text-slate-700">
                {memberLabel(memberId)}
              </span>

              <span
                className={`font-semibold ${
                  balance > 0
                    ? "text-green-600"
                    : balance < 0
                      ? "text-red-600"
                      : "text-slate-500"
                }`}
              >
                {balance > 0
                  ? `Gets ${formatCurrency(balance / 100)}`
                  : balance < 0
                    ? `Owes ${formatCurrency(Math.abs(balance) / 100)}`
                    : "Settled"}
              </span>
            </div>
          );
        })}
      </div>

      {/* EXPENSE HISTORY */}
      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-4">
          Expense History
        </h3>

        {expenses.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-slate-500">
            No expenses yet. Add your first trip expense!
          </div>
        ) : (
          <div className="space-y-3">
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className="bg-white rounded-xl shadow p-5 flex justify-between items-center gap-4"
              >
                <div>
                  <h4 className="font-bold text-slate-800">
                    {expense.description}
                  </h4>
                  <p className="text-sm text-slate-500 mt-1">
                    Paid by {expense.paidBy === currentUser.uid
                      ? "You"
                      : expense.paidByName || "A trip member"}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Split among {(expense.participantIds || []).length} members
                  </p>
                </div>

                <p className="font-bold text-lg text-slate-800">
                  {formatCurrency(Number(expense.amount))}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
