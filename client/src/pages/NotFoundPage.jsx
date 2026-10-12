import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="page not-found-page">
      <h1>Page not found</h1>
      <p>That path does not lead anywhere in this garden.</p>
      <Link to="/">Back home</Link>
    </div>
  );
}
