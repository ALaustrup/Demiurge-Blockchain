'use client';

export default function FormattedDate({ dateString, options }: { dateString: string, options?: Intl.DateTimeFormatOptions }) {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };

  const formattingOptions = options || defaultOptions;

  return <>{new Date(dateString).toLocaleDateString(undefined, formattingOptions)}</>;
}
