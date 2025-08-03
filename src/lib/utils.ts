import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Nova função para calcular o intervalo de datas
export const calculateDateRange = (timeRange: string) => {
  const today = new Date();
  let startDate: Date;
  let endDate: Date;

  switch (timeRange) {
    case 'week':
      startDate = startOfWeek(today);
      endDate = endOfWeek(today);
      break;
    case 'last_30_days':
      startDate = subDays(today, 30);
      endDate = today;
      break;
    case 'month':
    default:
      startDate = startOfMonth(today);
      endDate = endOfMonth(today);
      break;
  }

  return {
    start: format(startDate, 'yyyy-MM-dd'),
    end: format(endDate, 'yyyy-MM-dd'),
  };
};
