// Declarações de tipos para React, Next, Lucide e JSX no ambiente de desenvolvimento
/* eslint-disable @typescript-eslint/no-explicit-any */

declare module 'react' {
  export type ReactNode =
    | React.ReactElement<any, any>
    | string
    | number
    | Iterable<React.ReactNode>
    | React.ReactPortal
    | boolean
    | null
    | undefined;

  export interface ReactElement<P = any, T extends string | React.JSXElementConstructor<any> = string | React.JSXElementConstructor<any>> {
    type: T;
    props: P;
    key: string | null;
  }

  export type JSXElementConstructor<P> =
    | ((props: P) => ReactElement<any, any> | null)
    | (new (props: P) => any);

  export function useState<T>(initialState: T | (() => T)): [T, (newState: T | ((prevState: T) => T)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: readonly any[]): void;
  export function useMemo<T>(factory: () => T, deps: readonly any[] | undefined): T;
  export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: readonly any[]): T;
  export function useRef<T>(initialValue?: T): { current: T };

  export interface ChangeEvent<T = any> {
    target: T & { value: string };
  }

  export interface MouseEvent<T = any> {
    preventDefault(): void;
    stopPropagation(): void;
  }

  const React: {
    useState: typeof useState;
    useEffect: typeof useEffect;
    useMemo: typeof useMemo;
    useCallback: typeof useCallback;
    useRef: typeof useRef;
  };

  export default React;
}

declare module 'next' {
  export interface Metadata {
    title?: string;
    description?: string;
    [key: string]: any;
  }
}

declare module 'lucide-react' {
  import * as React from 'react';
  export interface LucideProps {
    color?: string;
    size?: string | number;
    strokeWidth?: string | number;
    className?: string;
    [key: string]: any;
  }
  export type LucideIcon = React.FC<LucideProps>;

  export const Home: LucideIcon;
  export const LineChart: LucideIcon;
  export const TrendingUp: LucideIcon;
  export const ArrowUpRight: LucideIcon;
  export const ArrowDownRight: LucideIcon;
  export const Receipt: LucideIcon;
  export const FolderUp: LucideIcon;
  export const Tag: LucideIcon;
  export const Tags: LucideIcon;
  export const GraduationCap: LucideIcon;
  export const Bell: LucideIcon;
  export const Eye: LucideIcon;
  export const EyeOff: LucideIcon;
  export const Search: LucideIcon;
  export const Zap: LucideIcon;
  export const AlertTriangle: LucideIcon;
  export const CheckCircle2: LucideIcon;
  export const ChevronRight: LucideIcon;
  export const Copy: LucideIcon;
  export const FileText: LucideIcon;
  export const FileDown: LucideIcon;
  export const MessageCircle: LucideIcon;
  export const MessageSquare: LucideIcon;
  export const Lightbulb: LucideIcon;
  export const Scissors: LucideIcon;
  export const Waves: LucideIcon;
  export const Rocket: LucideIcon;
  export const Plus: LucideIcon;
  export const X: LucideIcon;
  export const Building2: LucideIcon;
  export const ShieldCheck: LucideIcon;
  export const Calendar: LucideIcon;
  export const ArrowLeftRight: LucideIcon;
}

declare namespace JSX {
  interface Element {
    type: any;
    props: any;
    key: any;
  }
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}
