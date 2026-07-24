export const uniqueOptionsByName = <T extends { name: string }>(options: T[]): T[] => {
  const unique = new Map<string, T>();

  options.forEach((option) => {
    const key = option.name.trim().toLocaleLowerCase('ru-RU');
    if (key && !unique.has(key)) {
      unique.set(key, option);
    }
  });

  return Array.from(unique.values());
};
