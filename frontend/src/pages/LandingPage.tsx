import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

type Faq = { q: string; a: string };

function IconSparkle() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2l1.2 4.2L17.4 8 13.2 9.2 12 13.4 10.8 9.2 6.6 8l4.2-1.8L12 2z" />
      <path d="M20 12l.7 2.4L23 15l-2.3.6L20 18l-.7-2.4L17 15l2.3-.6L20 12z" />
      <path d="M4 14l.9 3.1L8 18l-3.1.9L4 22l-.9-3.1L0 18l3.1-.9L4 14z" />
    </svg>
  );
}

function IconBody() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 7a3 3 0 1 0-3-3 3 3 0 0 0 3 3z" />
      <path d="M8 22l1-7-2-4a4 4 0 0 1 4-3h2a4 4 0 0 1 4 3l-2 4 1 7" />
    </svg>
  );
}

function IconWand() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 21L21 3" />
      <path d="M7 17l-2 2" />
      <path d="M10 14l-2 2" />
      <path d="M13 11l-2 2" />
      <path d="M16 8l-2 2" />
      <path d="M20 4l-2 2" />
      <path d="M15 3l1.1 2.9L19 7l-2.9 1.1L15 11l-1.1-2.9L11 7l2.9-1.1L15 3z" />
    </svg>
  );
}

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function LandingPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add("landingBody");
    return () => document.body.classList.remove("landingBody");
  }, []);

  const [openFaq, setOpenFaq] = useState<number>(0);

  const faqs = useMemo<Faq[]>(
    () => [
      {
        q: "How does the AI generate outfits?",
        a: "You upload a clear photo. Our model keeps your identity and generates multiple outfit variations and matching environments based on style prompts."
      },
      {
        q: "What kind of photo should I upload?",
        a: "Use a well-lit photo where you are fully visible. Neutral background works best. Avoid heavy filters and extreme angles."
      },
      {
        q: "How long does generation take?",
        a: "Usually 15 to 60 seconds, depending on the model and load. You can keep browsing while your looks are being generated."
      },
      {
        q: "Is my photo stored?",
        a: "Your uploads and generated looks are saved to your account so you can revisit them in “My styles”. You can delete any project anytime."
      }
    ],
    []
  );

  const primaryCta = () => {
    if (loading) return;
    if (!user) navigate("/login");
    else navigate("/generate");
  };

  return (
    <div className="landing">
      <section className="landingHero">
        <div className="landingHeroBg" aria-hidden="true" />
        <div className="landingContainer landingHeroInner">
          <div className="heroCenter">
            <div className="heroBadge">
              <span className="dot" /> AI Fashion Stylist
            </div>
            <h1 className="heroTitle">Discover your best looks with AI.</h1>
            <p className="heroSub">
              Upload your photo and instantly see yourself in multiple outfit styles, tailored to your appearance, body type,
              and lifestyle, with matching environments.
            </p>
            <div className="heroActions">
              <button className="lbtn primary" onClick={primaryCta}>
                Try the AI Stylist
              </button>

            </div>
            <div className="heroNote">
              Built for women 25–50. Minimal steps. Premium results. <span className="sep">•</span> No styling quizzes.
            </div>
          </div>
        </div>
      </section>

      <section id="metrics" className="landingSection">
        <div className="landingContainer">
          <div className="sectionHead">
            <h2 className="sectionTitle">Results that feel real</h2>
            <p className="sectionSub">A fast, visual styling experience that makes outfit decisions easier.</p>
          </div>
          <div className="statsGrid">
            <div className="statCard">
              <div className="statNum">120k+</div>
              <div className="statLabel">Outfits generated</div>
            </div>
            <div className="statCard">
              <div className="statNum">18k</div>
              <div className="statLabel">Active users</div>
            </div>
            <div className="statCard">
              <div className="statNum">94%</div>
              <div className="statLabel">Positive feedback</div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="landingSection">
        <div className="landingContainer">
          <div className="sectionSplit">
            <div>
              <h2 className="sectionTitle">One photo in. Multiple styles out.</h2>
              <p className="sectionSub">
                See how different fashion directions actually look on you. Each look is generated on the same person, with an
                environment that matches the vibe: office, city, evening event, and more.
              </p>
              <div className="miniList">
                <div className="miniItem">
                  <IconWand /> Identity-preserving generation
                </div>
                <div className="miniItem">
                  <IconBody /> Full-body looks with silhouette focus
                </div>
                <div className="miniItem">
                  <IconSparkle /> Premium editorial lighting and composition
                </div>
              </div>
              <div className="sectionActions">
                <button className="lbtn primary" onClick={primaryCta}>
                  Generate my looks
                </button>
                <button className="lbtn subtle" onClick={() => scrollToId("faq")}>
                  Read FAQ
                </button>
              </div>
            </div>

            <div className="lookCards">
              <div className="lookCard" style={{ ["--tint" as never]: "rgba(212, 158, 109, 0.35)" }}>
                <div className="lookImg lookImgOffice" />
                <div className="lookMeta">
                  <div className="lookTitle">Office smart</div>
                  <div className="lookTag">clean lines • soft neutrals</div>
                </div>
              </div>
              <div className="lookCard" style={{ ["--tint" as never]: "rgba(91, 140, 196, 0.35)" }}>
                <div className="lookImg lookImgCity" />
                <div className="lookMeta">
                  <div className="lookTitle">Casual city</div>
                  <div className="lookTag">streetwear • cinematic</div>
                </div>
              </div>
              <div className="lookCard" style={{ ["--tint" as never]: "rgba(120, 94, 166, 0.32)" }}>
                <div className="lookImg lookImgEvening" />
                <div className="lookMeta">
                  <div className="lookTitle">Evening event</div>
                  <div className="lookTag">elegant • glossy light</div>
                </div>
              </div>
              <div className="lookCard" style={{ ["--tint" as never]: "rgba(84, 163, 134, 0.32)" }}>
                <div className="lookImg lookImgMinimal" />
                <div className="lookMeta">
                  <div className="lookTitle">Minimal aesthetic</div>
                  <div className="lookTag">monochrome • gallery vibe</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="benefits" className="landingSection">
        <div className="landingContainer">
          <div className="sectionHead">
            <h2 className="sectionTitle">Why women use it</h2>
            <p className="sectionSub">Less guesswork. More confidence. Looks that fit your real life.</p>
          </div>
          <div className="benefitsGrid">
            <div className="benefitCard">
              <div className="benefitIcon">
                <IconSparkle />
              </div>
              <div className="benefitTitle">Personalized styling</div>
              <div className="benefitText">Tailored suggestions based on your appearance, proportions, and vibe.</div>
            </div>
            <div className="benefitCard">
              <div className="benefitIcon">
                <IconBody />
              </div>
              <div className="benefitTitle">Body-type friendly</div>
              <div className="benefitText">AI explores silhouettes that flatter you, not just trending outfits.</div>
            </div>
            <div className="benefitCard">
              <div className="benefitIcon">
                <IconWand />
              </div>
              <div className="benefitTitle">Simple, pleasant flow</div>
              <div className="benefitText">Upload, choose styles, generate. Clean UI with a premium feel.</div>
            </div>
          </div>
        </div>
      </section>

      <section id="testimonials" className="landingSection">
        <div className="landingContainer">
          <div className="sectionHead">
            <h2 className="sectionTitle">Testimonials</h2>
            <p className="sectionSub">Short, honest feedback from women who tested the AI stylist.</p>
          </div>
          <div className="testGrid">
            <div className="testCard">
              <div className="testTop">
                <div className="avatar">I</div>
                <div>
                  <div className="testName">Iryna, 31</div>
                  <div className="testMeta">Kyiv</div>
                </div>
              </div>
              <div className="testQuote">
                “I finally saw which silhouettes work on me. The office looks were spot-on, and the city outfits felt realistic.”
              </div>
            </div>
            <div className="testCard">
              <div className="testTop">
                <div className="avatar">N</div>
                <div>
                  <div className="testName">Natalia, 45</div>
                  <div className="testMeta">Warsaw</div>
                </div>
              </div>
              <div className="testQuote">
                “No long quiz, just results. I used it before a business dinner and saved 3 looks to repeat later.”
              </div>
            </div>
            <div className="testCard">
              <div className="testTop">
                <div className="avatar">O</div>
                <div>
                  <div className="testName">Olha, 28</div>
                  <div className="testMeta">Berlin</div>
                </div>
              </div>
              <div className="testQuote">“The environments make it feel like a real photoshoot. I shared the set with friends immediately.”</div>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="landingSection">
        <div className="landingContainer">
          <div className="sectionHead">
            <h2 className="sectionTitle">FAQ</h2>
            <p className="sectionSub">Everything you need before trying the AI stylist.</p>
          </div>
          <div className="faq">
            {faqs.map((f, idx) => {
              const open = idx === openFaq;
              return (
                <button
                  key={f.q}
                  className={open ? "faqItem open" : "faqItem"}
                  onClick={() => setOpenFaq((p) => (p === idx ? -1 : idx))}
                  type="button"
                >
                  <div className="faqQ">
                    <span>{f.q}</span>
                    <span className="faqChevron" aria-hidden="true">
                      {open ? "−" : "+"}
                    </span>
                  </div>
                  {open ? <div className="faqA">{f.a}</div> : null}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <footer className="landingFooter">
        <div className="landingContainer footerInner">
          <div className="footerCol">
            <div className="footerLogo">Mate9</div>
            <div className="footerText">AI-powered fashion styling, built to help you choose outfits with confidence.</div>
          </div>
          <div className="footerCol">
            <div className="footerHead">Product</div>
            <button className="footerLink" onClick={() => scrollToId("features")}>
              Features
            </button>
            <button className="footerLink" onClick={() => scrollToId("metrics")}>
              Metrics
            </button>
            <Link className="footerLink" to={user ? "/generate" : "/login"}>
              Try it
            </Link>
          </div>
          <div className="footerCol">
            <div className="footerHead">Company</div>
            <a className="footerLink" href="#" onClick={(e) => e.preventDefault()}>
              Privacy policy
            </a>
            <a className="footerLink" href="#" onClick={(e) => e.preventDefault()}>
              Contact: hello@mate9.local
            </a>
            <div className="footerSocial">
              <a className="footerSocialLink" href="#" onClick={(e) => e.preventDefault()}>
                Instagram
              </a>
              <a className="footerSocialLink" href="#" onClick={(e) => e.preventDefault()}>
                TikTok
              </a>
              <a className="footerSocialLink" href="#" onClick={(e) => e.preventDefault()}>
                X
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

