import { Link } from 'react-router-dom';

export function LandingPage() {
  return (
    <div className="page landing-page">
      <h1>Grow a habit, one checkin at a time</h1>
      <p>
        Streak Garden turns every habit into a plant. Check in and it grows.
        Miss a day and it wilts. No points, no pressure, just a garden that
        shows you what you have been consistent with.
      </p>
      <div className="landing-actions">
        <Link to="/signup">Start your garden</Link>
        <Link to="/login">Log in</Link>
      </div>
    </div>
  );
}
