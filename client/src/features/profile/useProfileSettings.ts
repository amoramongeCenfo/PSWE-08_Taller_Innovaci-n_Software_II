import { useCallback, useMemo } from 'react';
import { fetchBusinessProfile } from '../business';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { saveProfile } from './saveProfile';
import { normalizeProfile, type ProfileValues } from './validation';

/**
 * Une los datos de la persona (auth) y del negocio (business) en un solo perfil editable.
 * Guardar actualiza el store, así que la barra superior y el menú cambian al instante.
 */
export function useProfileSettings() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const business = useAppSelector((state) => state.business.profile);
  const status = useAppSelector((state) => state.business.status);

  const initialValues = useMemo<ProfileValues>(
    () => ({
      businessName: business?.name ?? '',
      address: business?.address ?? '',
      userName: user?.name ?? '',
      userRole: user?.role ?? '',
    }),
    [business, user],
  );

  const reload = useCallback(() => void dispatch(fetchBusinessProfile()), [dispatch]);

  /** Guarda todo junto. Lanza un error si algo falla, para que el formulario lo muestre. */
  const save = useCallback(
    async (values: ProfileValues) => {
      const { businessName, address, userName, userRole } = normalizeProfile(values);
      await dispatch(
        saveProfile({
          user: { name: userName, role: userRole },
          business: { name: businessName, address: address || null },
        }),
      ).unwrap();
    },
    [dispatch],
  );

  return {
    isLoading: status === 'idle' || status === 'loading',
    hasError: status === 'error',
    initialValues,
    reload,
    save,
  };
}
