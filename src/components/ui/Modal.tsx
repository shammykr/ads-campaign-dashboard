import { useEffect, useId, useRef, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import { Button } from './Button';

export interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  description?: string;
  /** Element to focus when the dialog opens; defaults to the first focusable element. */
  initialFocusRef?: RefObject<HTMLElement | null>;
  width?: number;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 100;
  display: grid;
  place-items: center;
  padding: ${({ theme }) => theme.space(4)};
  background: rgba(16, 24, 40, 0.5);
`;

const Dialog = styled.div<{ $width: number }>`
  width: 100%;
  max-width: ${({ $width }) => $width}px;
  max-height: calc(100vh - 32px);
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: ${({ theme }) => theme.shadow.lg};
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space(4)};
  padding: ${({ theme }) => `${theme.space(5)} ${theme.space(6)} ${theme.space(2)}`};
  h2 { font-size: ${({ theme }) => theme.font.size.xl}; }
  p { margin: ${({ theme }) => theme.space(1)} 0 0; color: ${({ theme }) => theme.colors.textMuted}; }
`;

const Body = styled.div`
  padding: ${({ theme }) => `${theme.space(3)} ${theme.space(6)}`};
  overflow-y: auto;
`;

const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.space(2)};
  padding: ${({ theme }) => `${theme.space(4)} ${theme.space(6)}`};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

/**
 * Accessible modal dialog: role="dialog" + aria-modal, labelled by its title,
 * traps Tab focus, closes on Escape, makes the app root inert, and returns
 * focus to the element that opened it.
 */
export function Modal({ open, title, onClose, children, footer, description, initialFocusRef, width = 640 }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const root = document.getElementById('root');
    root?.setAttribute('inert', '');
    root?.setAttribute('aria-hidden', 'true');

    const dialog = dialogRef.current!;
    const first = initialFocusRef?.current ?? dialog.querySelector<HTMLElement>(FOCUSABLE) ?? dialog;
    first.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (!items.length) return;
      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      if (e.shiftKey && document.activeElement === firstItem) {
        e.preventDefault();
        lastItem.focus();
      } else if (!e.shiftKey && document.activeElement === lastItem) {
        e.preventDefault();
        firstItem.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      root?.removeAttribute('inert');
      root?.removeAttribute('aria-hidden');
      previouslyFocused?.focus();
    };
  }, [open, initialFocusRef]);

  if (!open) return null;

  return createPortal(
    <Backdrop
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <Dialog
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        $width={width}
      >
        <Header>
          <div>
            <h2 id={titleId}>{title}</h2>
            {description && <p id={descId}>{description}</p>}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close dialog">
            ✕
          </Button>
        </Header>
        <Body>{children}</Body>
        {footer && <Footer>{footer}</Footer>}
      </Dialog>
    </Backdrop>,
    document.body,
  );
}
