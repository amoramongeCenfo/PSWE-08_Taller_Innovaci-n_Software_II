import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router';
import { Icon } from '../../components/Icon';
import { Avatar, Switch } from '../../components/ui';
import { useLargeText } from '../../hooks/useLargeText';
import { getInitials, orNotAvailable } from '../../lib/format';

interface UserMenuProps {
  userName: string | null;
  userRole: string | null;
  onLogout: () => void;
}

/** Nombre, puesto y avatar; al tocarlos se abre un menú con Mi negocio y Cerrar sesión. */
export function UserMenu({ userName, userRole, onLogout }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const largeText = useLargeText();

  useEffect(() => {
    if (!isOpen) return;
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [isOpen]);

  const close = () => setIsOpen(false);
  const itemClass =
    'flex w-full items-center gap-space-sm rounded-lg px-space-sm py-space-sm text-left font-body-md text-body-md text-on-surface hover:bg-surface-container-low';

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => setIsOpen((open) => !open)}
        className="flex items-center gap-space-sm rounded-xl p-1 text-left hover:bg-surface-container-low"
      >
        <span className="hidden flex-col text-right sm:flex">
          <span className="font-label-md text-label-md leading-tight font-semibold text-on-surface">
            {orNotAvailable(userName)}
          </span>
          <span className="font-label-sm text-label-sm leading-none text-on-surface-variant">
            {orNotAvailable(userRole)}
          </span>
        </span>
        <Avatar initials={getInitials(userName)} className="h-9 w-9" />
        <span className="sr-only">Abrir menú de la cuenta</span>
      </button>

      {isOpen && (
        <div
          id={menuId}
          className="absolute top-full right-0 z-50 mt-space-xs flex w-64 flex-col gap-1 rounded-2xl bg-surface-container-lowest p-space-sm shadow-card ring-1 ring-hairline"
        >
          <div className="px-space-sm pt-space-xs pb-space-sm sm:hidden">
            <p className="font-body-md text-body-md font-semibold text-on-surface">
              {orNotAvailable(userName)}
            </p>
            <p className="font-label-md text-label-md text-on-surface-variant">
              {orNotAvailable(userRole)}
            </p>
          </div>
          <Link to="/mi-negocio#perfil" onClick={close} className={itemClass}>
            <Icon name="storefront" size={20} className="text-on-surface-variant" />
            Mi negocio y perfil
          </Link>
          <Switch
            label="Texto grande"
            checked={largeText.enabled}
            onChange={largeText.toggle}
            className="justify-between px-space-sm py-space-sm font-body-md text-body-md text-on-surface md:hidden"
          />
          <hr className="my-1 border-hairline" />
          <button
            type="button"
            onClick={() => {
              close();
              onLogout();
            }}
            className={itemClass}
          >
            <Icon name="logout" size={20} className="text-on-surface-variant" />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
