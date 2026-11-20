'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from './api';

export type Resource<T> = {
  data: T | undefined;
  error: ApiError | undefined;
  loading: boolean;
  reload: () => Promise<void>;
};

function asApiError(err: unknown): ApiError {
  return err instanceof ApiError
    ? err
    : new ApiError(0, 'network_error', 'Não foi possível falar com o servidor.');
}

// Carrega um recurso da API; `key` muda quando o recurso deve ser lido de novo.
export function useResource<T>(load: () => Promise<T>, key: unknown[]): Resource<T> {
  const [data, setData] = useState<T>();
  const [error, setError] = useState<ApiError>();
  const [loading, setLoading] = useState(true);
  const loadRef = useRef(load);
  loadRef.current = load;
  const serial = useRef(0);

  const reload = useCallback(async () => {
    const current = ++serial.current;
    setLoading(true);
    try {
      const value = await loadRef.current();
      if (current === serial.current) {
        setData(value);
        setError(undefined);
      }
    } catch (err) {
      if (current === serial.current) {
        setData(undefined);
        setError(asApiError(err));
      }
    } finally {
      if (current === serial.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, key);

  return { data, error, loading, reload };
}

export function errorMessage(err: unknown): string {
  return asApiError(err).message;
}
