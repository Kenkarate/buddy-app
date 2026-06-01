import { QRCodeCanvas } from "qrcode.react";
import { Copy, MessageCircle, Send, Share2, X } from "lucide-react";

function ShareModal({ open, onClose }) {
  if (!open) return null;

  const appLink = window.location.origin;
  const shareText = "Check out Buddy Fitness app";

  const copyLink = async () => {
    await navigator.clipboard.writeText(appLink);
    alert("Link copied");
  };

  const shareNative = async () => {
    if (navigator.share) {
      await navigator.share({
        title: "Buddy Fitness",
        text: shareText,
        url: appLink,
      });
    } else {
      copyLink();
    }
  };

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
    `${shareText}: ${appLink}`
  )}`;

  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(
    appLink
  )}&text=${encodeURIComponent(shareText)}`;

  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
    appLink
  )}`;

  return (
    <div className="share-modal-overlay" onClick={onClose}>
      <div className="share-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="share-modal-top">
          <div>
            <p>Share Buddy</p>
            <h2>Invite Friends</h2>
          </div>

          <button onClick={onClose}>
            <X size={22} />
          </button>
        </div>

        <div className="qr-box">
          <QRCodeCanvas
            value={appLink}
            size={180}
            bgColor="#ffffff"
            fgColor="#050605"
            level="H"
            includeMargin
          />
        </div>

        <div className="share-link-box">
          <span>{appLink}</span>
          <button onClick={copyLink}>
            <Copy size={18} />
          </button>
        </div>

        <div className="share-social-grid">
          <a href={whatsappUrl} target="_blank" rel="noreferrer">
            <MessageCircle size={24} />
            <span>WhatsApp</span>
          </a>

          <a href={telegramUrl} target="_blank" rel="noreferrer">
            <Send size={24} />
            <span>Telegram</span>
          </a>

          <a href={facebookUrl} target="_blank" rel="noreferrer">
  <span className="facebook-letter">f</span>
  <span>Facebook</span>
</a>

          <button onClick={shareNative}>
            <Share2 size={24} />
            <span>Share</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ShareModal;