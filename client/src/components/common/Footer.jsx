
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import {
  FaInstagram as Instagram,
  FaLinkedin as Linkedin,
  FaGithub as Github
} from "react-icons/fa";

function Footer() {
  return (
    <footer className="footer" id="about">
      <div className="footer-container">

        <div className="footer-main">

          <div className="footer-brand">
            <Link to="/#home" className="brand footer-logo">
              <span className="brand-icon">e</span>
              <span>
                ecoloop<span className="brand-dot">.</span>
              </span>
            </Link>

            <p>
              A better way to share, exchange and reuse.
              Making campus life more sustainable, one resource at a time.
            </p>

            <div className="footer-socials">
              <a
                href="https://www.instagram.com/"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
              >
                <Instagram size={16} />
              </a>

              <a
                href="https://www.linkedin.com/"
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
              >
                <Linkedin size={16} />
              </a>

              <a
                href="https://github.com/"
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub"
              >
                <Github size={16} />
              </a>
            </div>
          </div>

          <div className="footer-column">
            <h4>Explore</h4>
            <Link to="/explore">Browse resources</Link>
            <Link to="/#categories">Categories</Link>
            <Link to="/#how-it-works">How it works</Link>
          </div>

          <div className="footer-column">
            <h4>Community</h4>
            <Link to="/#about">About EcoLoop</Link>
            <Link to="/#about">Our mission</Link>
            <Link to="/#about">Contact</Link>
          </div>

          <div className="footer-column">
            <h4>Get started</h4>
            <Link to="/register">Create account</Link>
            <Link to="/login">Student login</Link>
            <Link to="/explore">Discover items</Link>
          </div>

        </div>

        <div className="footer-bottom">
          <p>© 2026 EcoLoop. Made for a greener campus.</p>

          <p className="footer-tagline">
            Reuse more. Waste less.
            <ArrowUpRight size={13} />
          </p>
        </div>

      </div>
    </footer>
  );
}

export default Footer;
