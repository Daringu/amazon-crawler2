import * as dayjs from "dayjs";

export function getDatesBetween(startDate: string, endDate: string) {
  const start = dayjs(startDate);
  const end = dayjs(endDate);

  // Ensure the start date is before or the same as the end date
  if (start.isAfter(end)) {
    throw new Error("Start date must be before or equal to end date.");
  }

  const dates: string[] = [];

  let currentDate = start;
  while (currentDate.isBefore(end) || currentDate.isSame(end)) {
    dates.push(currentDate.format("YYYY-MM-DD"));
    currentDate = currentDate.add(1, "day"); // Move to the next day
  }

  return dates;
}
