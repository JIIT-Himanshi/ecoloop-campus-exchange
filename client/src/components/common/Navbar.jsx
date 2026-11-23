import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowUpRight, Menu, X } from "lucide-react";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      document.getElementById(location.hash.slice(1))?.scrollIntoView({
        behavior: "smooth",
      });
    } else {
      window.scrollTo(0, 0);
    }
  }, [location.pathname, location.hash]);

  return (
    <nav className="navbar">
      <div className="nav-container">

        <Link to="/#home" className="brand" onClick={() => setMenuOpen(false)}>
          <span className="brand-icon">e</span>
          <span>
            ecoloop<span className="brand-dot">.</span>
          </span>
        </Link>

        <div className={`nav-links ${menuOpen ? "nav-active" : ""}`}>
          <Link to="/#home" onClick={() => setMenuOpen(false)}>Home</Link>
          <Link to="/explore" onClick={() => setMenuOpen(false)}>Explore</Link>
          <Link to="/#how-it-works" onClick={() => setMenuOpen(false)}>How it works</Link>
          <Link to="/#about" onClick={() => setMenuOpen(false)}>About</Link>
        </div>

        <div className="nav-actions">
          <Link to="/login" className="nav-login">Log in</Link>

          <Link to="/register" className="nav-signup">
            Get started
            <ArrowUpRight size={15} />
          </Link>
        </div>

        <button
          className="menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          type="button"
        >
          {menuOpen ? <X size={23} /> : <Menu size={23} />}
        </button>

      </div>
    </nav>
  );
}

export default Navbar;
