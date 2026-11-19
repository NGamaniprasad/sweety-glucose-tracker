
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <main className="page-container">
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOUR DASHBOARD</span>
          <h1>Welcome, {user?.name || "User"}!</h1>
          <p>
            Your personal blood glucose tracker is ready.
          </p>
        </div>
      </div>

      <section className="dashboard-card">
        <div className="dashboard-icon">✓</div>

        <h2>Authentication successful!</h2>

        <p>
          You are signed in to your Sweety account.
          Your readings and reports will appear here.
        </p>

        <div className="account-info">
          <div>
            <strong>Name</strong>
            <span>{user?.name}</span>
          </div>

          <div>
            <strong>Email</strong>
            <span>{user?.email}</span>
          </div>
        </div>

        <p className="helper-text">
          Next: Part 7 — Add, view, edit and delete
          your blood glucose readings.
        </p>
      </section>
    </main>
  );
}
