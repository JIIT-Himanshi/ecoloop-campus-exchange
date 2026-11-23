
import { useEffect, useState } from "react";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import ListingGrid from "../components/listings/ListingGrid";
import { getListings } from "../services/listingService";
import "../App.css";

import {
  BookOpen,
  Laptop,
  Pencil,
  Recycle as OtherIcon,
  ArrowUpRight,
  ArrowDown,
  Search,
  Handshake,
  Recycle,
  Sprout
} from "lucide-react";

const categories = [
  {
    name: "Books & Notes",
    icon: BookOpen
  },
  {
    name: "Electronics",
    icon: Laptop
  },
  {
    name: "Stationery",
    icon: Pencil
  },
  {
    name: "Other",
    icon: OtherIcon
  }
];

function Home() {
  const [featuredListings, setFeaturedListings] = useState([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [featuredError, setFeaturedError] = useState("");

  useEffect(() => {
    let active = true;

    getListings({ sort: "newest" })
      .then((response) => {
        if (active) setFeaturedListings(response.listings || []);
      })
      .catch((error) => {
        if (active) {
          setFeaturedError(
            error.response?.data?.message || "Unable to load featured listings."
          );
        }
      })
      .finally(() => {
        if (active) setFeaturedLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="home-page">
      <Navbar />

      {/* HERO SECTION */}
      <section className="hero-section" id="home">
        <div className="hero-container">

          <div className="hero-content">
            <div className="hero-tag">
              <span className="status-dot"></span>
              A smarter campus community
            </div>

            <h1>
              Give your unused
              <br />
              things a <span>new life.</span>
            </h1>

            <p className="hero-description">
              Buy, exchange or donate resources within your campus.
              Discover what you need and pass on what you no longer use.
            </p>

            <div className="hero-buttons">
              <a href="#explore" className="btn btn-primary hero-primary">
                Explore resources
                <ArrowUpRight size={17} strokeWidth={2.2} />
              </a>

              <a href="/register" className="hero-secondary">
                Join the community
                <ArrowUpRight size={16} />
              </a>
            </div>

            <div className="hero-trust">
              <div className="avatar-stack">
                <span>H</span>
                <span>M</span>
                <span>A</span>
                <span>R</span>
              </div>

              <p>
                <strong>Made for students.</strong>
                <br />
                Built around sharing.
              </p>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-image-wrapper">
              <img
                src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1000&q=90"
                alt="A bright and welcoming student workspace"
                className="hero-image"
              />

              <div className="hero-image-overlay"></div>

              <div className="floating-note">
                <span className="floating-icon">
                  <ArrowUpRight size={19} />
                </span>

                <div>
                  <strong>Give things another story.</strong>
                  <p>Small exchanges. Big impact.</p>
                </div>
              </div>
            </div>

            <div className="hero-stamp">
              <span>REUSE</span>
              <span>•</span>
              <span>RETHINK</span>
              <span>•</span>
              <span>REPEAT</span>
            </div>
          </div>

        </div>

        <div className="hero-bottom">
          <span>01 / A CAMPUS THAT SHARES</span>

          <a href="#introduction" className="hero-scroll-cue">
            <span>SCROLL TO DISCOVER</span>
            <span className="scroll-icon">
              <ArrowDown size={15} strokeWidth={2} />
            </span>
          </a>
        </div>
      </section>

      {/* INTRODUCTION */}
      <section className="intro-section" id="introduction">
        <div className="container intro-container">
          <p className="eyebrow">THE IDEA BEHIND ECOLOOP</p>

          <h2>
            One student's unused resource
            <br />
            could be <span>another's next favourite find.</span>
          </h2>

          <p className="intro-description">
            EcoLoop brings students together to make sharing easier.
            Instead of letting useful things go to waste, give them
            another chance to be useful.
          </p>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="category-section" id="categories">
        <div className="container">
          <div className="section-top">
            <div>
              <p className="eyebrow">FIND YOUR NEXT FAVOURITE</p>
              <h2 className="section-heading">
                Explore by category<span>.</span>
              </h2>
            </div>

            <a href="/explore" className="text-link">
              View all categories
              <ArrowUpRight size={16} />
            </a>
          </div>

          <div className="category-grid">
            {categories.map((category, index) => {
              const Icon = category.icon;

              return (
                <a
                  href={`/explore?category=${encodeURIComponent(category.name)}`}
                  className="category-card"
                  key={category.name}
                  style={{ "--card-index": index }}
                >
                  <div className="category-icon">
                    <Icon size={27} strokeWidth={1.7} />
                  </div>

                  <div>
                    <h3>{category.name}</h3>
                    <p>Browse listings</p>
                  </div>

                  <span className="category-arrow">
                    <ArrowUpRight size={18} />
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* FEATURED LISTINGS */}
      <section className="featured-section" id="explore">
        <div className="container">
          <div className="section-top">
            <div>
              <p className="eyebrow">GOOD THINGS, SECOND CHANCES</p>
              <h2 className="section-heading">
                Fresh finds on campus<span>.</span>
              </h2>
              <p className="featured-subtitle">
                Discover useful things shared by your campus community.
              </p>
            </div>

            <a href="/explore" className="text-link">
              Explore everything
              <ArrowUpRight size={16} />
            </a>
          </div>

          {featuredError ? (
            <p className="page-error" role="alert">{featuredError}</p>
          ) : featuredLoading ? (
            <p role="status">Loading featured listings...</p>
          ) : (
            <ListingGrid listings={featuredListings.slice(0, 3)} />
          )}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how-section" id="how-it-works">
        <div className="container">
          <div className="how-heading">
            <p className="eyebrow">SIMPLE BY NATURE</p>

            <h2 className="section-heading">
              Good things happen in <span>three steps.</span>
            </h2>

            <p>
              Getting started with a more resourceful campus
              has never been easier.
            </p>
          </div>

          <div className="steps-grid">
            <div className="step-card">
              <span className="step-number">01</span>

              <div className="step-icon">
                <Search size={25} strokeWidth={1.7} />
              </div>

              <h3>Discover</h3>
              <p>
                Browse resources shared by students.
                Find something you need or have been looking for.
              </p>
            </div>

            <div className="step-card">
              <span className="step-number">02</span>

              <div className="step-icon">
                <Handshake size={25} strokeWidth={1.7} />
              </div>

              <h3>Connect</h3>
              <p>
                Send a request to the student and
                coordinate your exchange within campus.
              </p>
            </div>

            <div className="step-card">
              <span className="step-number">03</span>

              <div className="step-icon">
                <Recycle size={25} strokeWidth={1.7} />
              </div>

              <h3>Reuse</h3>
              <p>
                Give useful things another life and
                help build a more sustainable community.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-card">
            <div className="cta-content">
              <p className="eyebrow">BE PART OF THE CHANGE</p>

              <h2>
                Your next great find
                <br />
                is already <span>on campus.</span>
              </h2>

              <p>
                Join your student community. Share what you have.
                Discover what you need.
              </p>

              <a href="/register" className="btn cta-button">
                Get started today
                <ArrowUpRight size={17} />
              </a>
            </div>

            <div className="cta-decoration">
              <div className="cta-circle circle-one"></div>
              <div className="cta-circle circle-two"></div>

              <div className="cta-leaf">
                <Sprout size={105} strokeWidth={1} />
              </div>

              <span className="cta-word">
                REUSE
                <br />
                REPEAT.
              </span>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default Home;