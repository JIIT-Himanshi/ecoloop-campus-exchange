
import { Link } from "react-router-dom";
import { MoveLeft } from "lucide-react";

function NotFound() {
  return (
    <div className="not-found-page">
      <span>404</span>
      <h1>Page not found</h1>
      <p>
        The page you are looking for does not exist or may have been moved.
      </p>

      <Link to="/">
        <MoveLeft size={17} />
        Back to Home
      </Link>
    </div>
  );
}

export default NotFound;
