import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { EllipsisHorizontalIcon } from '@heroicons/react/24/outline';

// "⋯" button that opens a small menu of less-used actions.
// items: [{ label, icon: Icon, onClick, danger }]
// The menu is drawn at the page level (portal) so tables that scroll sideways don't clip it.
const RowActionsMenu = ({ items, label = 'More actions' }) => {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  useLayoutEffect(() => {
    if (!open || !btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    const width = 208;
    const left = Math.min(Math.max(8, r.right - width), window.innerWidth - width - 8);
    const menuHeight = items.length * 44 + 8;
    const below = r.bottom + 6;
    const top = below + menuHeight > window.innerHeight - 8 ? Math.max(8, r.top - menuHeight - 6) : below;
    setPos({ left, top, width });
  }, [open, items.length]);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const openedAt = Date.now();
    // a scroll right after opening is the page settling, not the user leaving
    const onScroll = () => {
      if (Date.now() - openedAt > 300) close();
    };
    const onDown = (e) => {
      if (menuRef.current?.contains(e.target) || btnRef.current?.contains(e.target)) return;
      close();
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        close();
        btnRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        title={label}
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 sm:h-9 sm:w-9"
      >
        <EllipsisHorizontalIcon className="h-5 w-5" />
      </button>
      {open &&
        pos &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width }}
            className="z-[70] rounded-xl border border-gray-200 bg-white p-1 shadow-xl"
          >
            {items.map(({ label: text, icon: Icon, onClick, danger }) => (
              <button
                key={text}
                type="button"
                role="menuitem"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  onClick();
                }}
                className={`flex min-h-[44px] w-full items-center gap-2 rounded-lg px-3 text-left text-sm transition ${
                  danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {Icon && <Icon className="h-4 w-4" />}
                {text}
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  );
};

export default RowActionsMenu;
