import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckinCalendar } from '../components/CheckinCalendar';
import { PixelPlant } from '../components/PixelPlant';
import { useCheckins } from '../hooks/useCheckins';
import { useHabits } from '../hooks/useHabits';

// Checkins are stored and compared as UTC calendar dates (see habits.js and
// growth.js), so "today" on the client has to be computed the same way,
// not with the browser's local date, or a user west/east of UTC could see
// the button re-enable (or stay disabled) a day off from the server's own
// idea of today.
function todayUTCDateString() {
  return new Date().toISOString().slice(0, 10);
}

export function HabitDetailPage() {
  const { id } = useParams();
  const { checkins, isLoading, error, addCheckin } = useCheckins(id);
  const { habits } = useHabits();
  const [checkinError, setCheckinError] = useState(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  if (isLoading) return <p>Loading habit...</p>;
  if (error) return <p className="form-error">{error}</p>;

  const habit = habits.find((candidate) => candidate.id === id);

  const alreadyCheckedInToday = checkins.some(
    (checkin) => checkin.date === todayUTCDateString()
  );

  async function handleCheckin() {
    setIsCheckingIn(true);
    setCheckinError(null);
    try {
      await addCheckin();
    } catch (err) {
      setCheckinError(err.message);
    } finally {
      setIsCheckingIn(false);
    }
  }

  return (
    <div className="page habit-detail-page">
      <h1>Habit history</h1>
      {habit && (
        <div className="garden-bed garden-bed-hero">
          <PixelPlant species={habit.species} stage={habit.growth.stage} size={96} />
        </div>
      )}
      <button type="button" onClick={handleCheckin} disabled={alreadyCheckedInToday || isCheckingIn}>
        {alreadyCheckedInToday ? 'Checked in today' : 'Check in today'}
      </button>
      {checkinError && <p className="form-error">{checkinError}</p>}
      <CheckinCalendar checkins={checkins} />
    </div>
  );
}
