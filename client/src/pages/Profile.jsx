import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Headphones,
  KeyRound,
  Mail,
  Shield,
  Download
} from "lucide-react";
import api from "../api/api";

function Profile() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [openFaq, setOpenFaq] = useState(0);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstallModal, setShowInstallModal] = useState(false);

  const [queryForm, setQueryForm] = useState({
    type: "Query",
    subject: "",
    message: "",
  });

  const [trainerForm, setTrainerForm] = useState({
    businessName: "",
    experience: "",
    phone: "",
    message: "",
  });

  const storedUser = JSON.parse(localStorage.getItem("buddyUser") || "{}");
const userEmail = profile?.email || storedUser?.email || "";
const userName = profile?.name || storedUser?.name || "Buddy User";
const membershipTier =
  profile?.subscriptionStatus === "paid"
    ? "Premium"
    : profile?.subscriptionStatus === "trial"
    ? "Trial"
    : "Basic";

const loadProfile = async () => {
  try {
    const res = await api.get("/auth/profile");
    setProfile(res.data);
  } catch (error) {
    console.error("Failed to load profile:", error);

    const savedUser = JSON.parse(localStorage.getItem("buddyUser") || "{}");

    if (savedUser?.email) {
      setProfile(savedUser);
      return;
    }

    navigate("/login");
  }
};

  useEffect(() => {
    loadProfile();
  }, []);

  const logout = () => {
  localStorage.removeItem("buddyToken");
  localStorage.removeItem("buddyUser");
  localStorage.removeItem("buddySelectedProgram");
  localStorage.removeItem("buddyPaymentStatus");

  navigate("/", { replace: true });
};

  const submitQuery = (e) => {
    e.preventDefault();

    alert("Your query has been submitted.");

    setQueryForm({
      type: "Query",
      subject: "",
      message: "",
    });
  };

  const submitTrainerRequest = (e) => {
    e.preventDefault();

    alert("Trainer partnership request submitted.");

    setTrainerForm({
      businessName: "",
      experience: "",
      phone: "",
      message: "",
    });
  };

  const upgradePremium = () => {
    navigate("/payment/personal-training");
  };

  const faqs = [
    {
      question: "What is Buddy Elite?",
      answer:
        "Buddy Elite is a premium fitness platform that provides curated workout programs, exercise libraries, diet guidance and personalized training support to help you reach your fitness goals.",
    },
    {
      question: "What does Premium membership include?",
      answer:
        "Premium membership can include advanced workout plans, trainer-assigned diet plans, progress tracking, body metrics and access to premium workout sections.",
    },
    {
      question: "How do I upgrade to Premium?",
      answer:
        "Tap the Upgrade to Premium button below and choose your training plan. You can start with a trial before moving to a paid plan.",
    },
    {
      question: "Can I cancel my Premium subscription?",
      answer:
        "Yes. Once real payments are connected, cancellation options can be added from the payment provider dashboard or inside the app.",
    },
  ];
  useEffect(() => {
  const dismissed = localStorage.getItem("buddyInstallDismissed");

  const handleBeforeInstallPrompt = (e) => {
    e.preventDefault();
    setInstallPrompt(e);

    if (dismissed !== "true") {
      setShowInstallModal(true);
    }
  };

  if (!profile) {
    return <p className="muted">Loading profile...</p>;
  }


  window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

  return () => {
    window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  };
}, []);
const installApp = async () => {
  if (!installPrompt) {
    alert("Install option is not available yet. Use browser menu → Add to Home Screen.");
    return;
  }

  installPrompt.prompt();

  const result = await installPrompt.userChoice;

  if (result.outcome === "accepted") {
    setShowInstallModal(false);
    localStorage.setItem("buddyInstallDismissed", "true");
  }

  setInstallPrompt(null);
};

const dismissInstallModal = () => {
  setShowInstallModal(false);
  localStorage.setItem("buddyInstallDismissed", "true");
};

  return (
    <div className="elite-profile-page">
      <div className="elite-profile-topbar">
        <div className="elite-brand">
          <div className="elite-avatar" />
          <span>Buddy</span>
        </div>

        <Bell size={25} />
      </div>

      <h1 className="profile-title">Your Profile</h1>

      <section className="elite-profile-card">
        <div className="profile-info-block">
          <p>Email</p>
          <h2>{userEmail}</h2>
        </div>

        <div className="profile-info-block">
          <p>Membership Tier</p>
        <span className="membership-pill">{membershipTier}</span>
        </div>

        <div className="profile-info-block">
          <p>Device ID Bound</p>
          <h3>dev_5y12d6wk4e6</h3>
        </div>
      </section>

      <section className="faq-section">
        <div className="section-heading-row">
          <HelpCircle size={26} />
          <h2>FAQ</h2>
        </div>

        <div className="faq-list">
          {faqs.map((faq, index) => (
            <div className="faq-item" key={faq.question}>
              <button
                className="faq-question"
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
              >
                <span>{faq.question}</span>
                {openFaq === index ? (
                  <ChevronUp size={22} />
                ) : (
                  <ChevronDown size={22} />
                )}
              </button>

              {openFaq === index && <p>{faq.answer}</p>}
            </div>
          ))}
        </div>
      </section>

      <section className="support-section">
        <div className="section-heading-row complaint">
          <Headphones size={26} />
          <h2>Complaints & Queries</h2>
        </div>

        <p className="support-subtext">
          Have an issue or a question? Let us know and we&apos;ll get back to
          you.
        </p>

        <form className="elite-form-card" onSubmit={submitQuery}>
          <label>
            <span>Your Email</span>
            <div className="readonly-input">
              <Mail size={22} />
              {userEmail}
            </div>
          </label>

          <label>
            <span>Type</span>
            <div className="radio-row">
              <label>
                <input
                  type="radio"
                  checked={queryForm.type === "Query"}
                  onChange={() =>
                    setQueryForm({ ...queryForm, type: "Query" })
                  }
                />
                Query
              </label>

              <label>
                <input
                  type="radio"
                  checked={queryForm.type === "Complaint"}
                  onChange={() =>
                    setQueryForm({ ...queryForm, type: "Complaint" })
                  }
                />
                Complaint
              </label>
            </div>
          </label>

          <label>
            <span>Subject</span>
            <input
              placeholder="Brief description of your issue"
              value={queryForm.subject}
              onChange={(e) =>
                setQueryForm({
                  ...queryForm,
                  subject: e.target.value,
                })
              }
              required
            />
          </label>

          <label>
            <span>Message</span>
            <textarea
              placeholder="Describe your issue or question in detail..."
              value={queryForm.message}
              onChange={(e) =>
                setQueryForm({
                  ...queryForm,
                  message: e.target.value,
                })
              }
              required
            />
          </label>

          <button className="complaint-submit-btn">Submit</button>
        </form>
      </section>

      <section className="trainer-section">
        <div className="section-heading-row trainer">
          <KeyRound size={27} />
          <h2>Trainer Partnership</h2>
        </div>

        <div className="trainer-note-card">
          <Shield size={26} />
          <div>
            <h3>Are you a gym trainer?</h3>
            <p>
              Want to provide <strong>Buddy</strong> to your clients and offer
              your own custom exercises? Partner with us and reach more
              athletes. Fill out the form below and our team will contact you.
            </p>
          </div>
        </div>

        <form className="elite-form-card" onSubmit={submitTrainerRequest}>
          <label>
            <span>Your Email</span>
            <div className="readonly-input">{userEmail}</div>
          </label>

          <label>
            <span>Trainer / Business Name</span>
            <input
              placeholder="e.g. FitPro Academy"
              value={trainerForm.businessName}
              onChange={(e) =>
                setTrainerForm({
                  ...trainerForm,
                  businessName: e.target.value,
                })
              }
              required
            />
          </label>

          <label>
            <span>Experience</span>
            <input
              placeholder="e.g. 5 years, Certified PT, Gym Owner"
              value={trainerForm.experience}
              onChange={(e) =>
                setTrainerForm({
                  ...trainerForm,
                  experience: e.target.value,
                })
              }
              required
            />
          </label>

          <label>
            <span>Phone Optional</span>
            <input
              placeholder="+91 98765 43210"
              value={trainerForm.phone}
              onChange={(e) =>
                setTrainerForm({
                  ...trainerForm,
                  phone: e.target.value,
                })
              }
            />
          </label>

          <label>
            <span>Message</span>
            <textarea
              placeholder="Tell us about your training style, the exercises you want to offer, and how you plan to use Buddy for your clients..."
              value={trainerForm.message}
              onChange={(e) =>
                setTrainerForm({
                  ...trainerForm,
                  message: e.target.value,
                })
              }
              required
            />
          </label>

          <button className="trainer-submit-btn">Contact Us</button>
        </form>
      </section>

      <button className="upgrade-premium-btn" onClick={upgradePremium}>
        Upgrade to Premium
      </button>

     <button onClick={logout}>Sign Out</button>
      {showInstallModal && (
  <div className="install-app-modal">
    <div className="install-app-card">
      <div className="install-icon">
        <Download size={26} />
      </div>

      <div>
        <h3>Install Buddy App</h3>
        <p>
          Add Buddy to your home screen for a faster app-like experience.
        </p>
      </div>

      <button onClick={installApp}>Install</button>

      <button className="install-dismiss-btn" onClick={dismissInstallModal}>
        Later
      </button>
    </div>
  </div>
)}
    </div>
  );
}

export default Profile;