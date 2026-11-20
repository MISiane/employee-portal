import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon, PrinterIcon } from '@heroicons/react/24/outline';
import QrCode from '../Common/QrCode';

const LOGO_URL = 'https://lemonethotel.ph/wp-content/uploads/2025/12/le-monet-logo-1024x909.png';
const CONTACT_KEY = 'portal_card_contact';

const printCss = `
@media screen {
  .credcard-preview { zoom: 1.5; }
}
@media print {
  body > *:not(.credcard-portal) { display: none !important; }
  html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
  .credcard-portal { position: static !important; display: block !important; background: none !important; padding: 0 !important; overflow: visible !important; }
  .credcard-panel { margin: 0 !important; box-shadow: none !important; background: none !important; border: 0 !important; padding: 0 !important; max-width: none !important; width: auto !important; }
  .credcard-noprint { display: none !important; }
  .credcard-preview { margin: 0 !important; }
  .credcard-wrap { padding: 0 !important; display: block !important; }
  .credcard-card { box-shadow: none !important; break-inside: avoid; page-break-after: avoid; }
  @page { size: 85.6mm 54mm; margin: 0; }
}
.credcard-card, .credcard-card * { -webkit-print-color-adjust: exact; print-color-adjust: exact; box-sizing: border-box; }
`;

const readContact = () => {
  try {
    return localStorage.getItem(CONTACT_KEY) || '';
  } catch {
    return '';
  }
};

// ID-card sized (85.6 x 54 mm) account card. The QR code only opens the login page;
// the temporary password is printed as text and is never put inside the QR code.
const CredentialCard = ({ isOpen, onClose, employee, password }) => {
  const [contact, setContact] = useState(readContact);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen || !employee) return null;

  const loginUrl = `${window.location.origin}/login`;
  const shownUrl = `${window.location.host}/login`;
  const font = "'Inter','Segoe UI',Arial,sans-serif";

  const saveContact = (value) => {
    setContact(value);
    try {
      localStorage.setItem(CONTACT_KEY, value);
    } catch {
      /* ignore */
    }
  };

  const row = (label, value, mono = false, big = false) => (
    <div style={{ marginTop: '1.1mm' }}>
      <div style={{ fontSize: '4.6pt', letterSpacing: '0.4pt', textTransform: 'uppercase', color: '#6b7280' }}>{label}</div>
      <div
        style={{
          fontSize: big ? '9.5pt' : '6.6pt',
          fontWeight: big || mono ? 700 : 600,
          fontFamily: mono ? "'Courier New',monospace" : font,
          color: '#111827',
          lineHeight: 1.15,
          wordBreak: 'break-all',
        }}
      >
        {value}
      </div>
    </div>
  );

  return createPortal(
    <div
      className="credcard-portal"
      style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.55)', overflowY: 'auto', padding: '16px' }}
      onClick={onClose}
    >
      <style>{printCss}</style>
      <div
        className="credcard-panel"
        onClick={(e) => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: 16, maxWidth: 560, margin: '24px auto', padding: 20, boxShadow: '0 20px 50px rgba(0,0,0,.3)', color: '#111827', fontFamily: font }}
      >
        <div className="credcard-noprint" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Credential card</h3>
          <button type="button" onClick={onClose} aria-label="Close" style={{ background: 'none', border: 0, cursor: 'pointer', color: '#6b7280' }}>
            <XMarkIcon style={{ width: 22, height: 22 }} />
          </button>
        </div>

        <div className="credcard-wrap" style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 20px' }}>
          <div className="credcard-preview">
            <div
              className="credcard-card"
              style={{ width: '85.6mm', height: '54mm', background: '#fff', border: '0.2mm solid #d1d5db', borderRadius: '3mm', overflow: 'hidden', display: 'flex', flexDirection: 'column', fontFamily: font, color: '#111827', boxShadow: '0 2px 8px rgba(0,0,0,.18)' }}
            >
              <div style={{ background: '#800080', color: '#fff', height: '10mm', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 3.5mm' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2mm' }}>
                  <img src={LOGO_URL} alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} style={{ height: '7mm', width: 'auto', background: '#fff', borderRadius: '1mm', padding: '0.4mm' }} />
                  <span style={{ fontSize: '8pt', fontWeight: 700 }}>Employee Portal</span>
                </div>
                <span style={{ fontSize: '5pt', letterSpacing: '0.8pt', opacity: 0.9 }}>ACCOUNT CARD</span>
              </div>

              <div style={{ flex: 1, display: 'flex', padding: '2.2mm 3.5mm 0', gap: '3mm', minHeight: 0 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '9pt', fontWeight: 800, lineHeight: 1.1 }}>{employee.name}</div>
                  <div style={{ fontSize: '5.8pt', color: '#4b5563', marginTop: '0.6mm' }}>
                    {[employee.department, employee.employee_code].filter(Boolean).join(' • ')}
                  </div>
                  {row('Email / username', employee.email)}
                  {row('Temporary password', password || '—', true, true)}
                </div>
                <div style={{ width: '24mm', flexShrink: 0, textAlign: 'center' }}>
                  <QrCode value={loginUrl} style={{ width: '24mm', height: '24mm' }} quietZone={1} />
                  <div style={{ fontSize: '4.8pt', marginTop: '0.6mm', color: '#374151' }}>Scan to open the portal</div>
                  <div style={{ fontSize: '4.6pt', color: '#6b7280', wordBreak: 'break-all' }}>{shownUrl}</div>
                </div>
              </div>

              <div style={{ padding: '0 3.5mm 2mm', fontSize: '4.6pt', color: '#6b7280', lineHeight: 1.25 }}>
                Keep this card private. You will be asked to create your own password the first time you log in.
                {contact ? ` ${contact}` : ''}
              </div>
            </div>
          </div>
        </div>

        <div className="credcard-noprint">
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Contact line (optional, printed on the card)</label>
          <input
            value={contact}
            onChange={(e) => saveContact(e.target.value)}
            placeholder="e.g. Need help? MIS Department, local 123"
            maxLength={80}
            style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, marginBottom: 12 }}
          />
          <p style={{ fontSize: 12, color: '#92400e', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 10px', margin: '0 0 14px' }}>
            The QR code only opens the login page. The password is printed as text and works until the employee sets their own.
            {!password && ' No password is available here, so reset the password to print one.'}
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, background: '#fff', color: '#374151', cursor: 'pointer' }}>
              Close
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              style={{ flex: 1, padding: '9px 12px', border: 0, borderRadius: 8, background: '#800080', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <PrinterIcon style={{ width: 18, height: 18 }} /> Print / Save as PDF
            </button>
          </div>
          <p style={{ fontSize: 11, color: '#6b7280', marginTop: 8, textAlign: 'center' }}>
            In the print window choose “Save as PDF” to export, or print on card stock at 100% size.
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CredentialCard;
