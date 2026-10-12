export function CheckinCalendar({ checkins }) {
  if (checkins.length === 0) {
    return <p>No checkins yet.</p>;
  }

  const sorted = [...checkins].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <ul className="checkin-calendar">
      {sorted.map((checkin) => (
        <li key={checkin.id}>{new Date(checkin.date).toLocaleDateString()}</li>
      ))}
    </ul>
  );
}
