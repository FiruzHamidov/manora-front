export type HomeLocationOption = {
  id: number | string;
  name: string;
};

const LOCATION_PRIORITY = [
  { label: 'Душанбе', aliases: ['душанбе'] },
  { label: 'Худжанд', aliases: ['худжанд'] },
  { label: 'Бохтар', aliases: ['бохтар'] },
  { label: 'Вахдат', aliases: ['вахдат'] },
  { label: 'Хисор', aliases: ['хисор', 'гиссар', 'ҳисор'] },
  { label: 'Рудаки', aliases: ['рудаки', 'рӯдакӣ', 'рудакӣ'] },
] as const;

const normalizeLocationName = (name: string): string =>
  name
    .trim()
    .toLocaleLowerCase('ru-RU')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');

const findPriorityIndex = (name: string): number => {
  const normalized = normalizeLocationName(name);
  return LOCATION_PRIORITY.findIndex((entry) =>
    entry.aliases.some((alias) => normalized.includes(normalizeLocationName(alias)))
  );
};

export const orderHomeLocationOptions = (
  options: HomeLocationOption[]
): HomeLocationOption[] => {
  const renamed = options.map((option) => {
    const priorityIndex = findPriorityIndex(option.name);
    return priorityIndex >= 0
      ? { ...option, name: LOCATION_PRIORITY[priorityIndex].label }
      : option;
  });

  const unique = renamed.filter(
    (option, index, list) =>
      list.findIndex(
        (candidate) =>
          normalizeLocationName(candidate.name) === normalizeLocationName(option.name)
      ) === index
  );

  return unique.sort((left, right) => {
    const leftPriority = findPriorityIndex(left.name);
    const rightPriority = findPriorityIndex(right.name);

    if (leftPriority >= 0 || rightPriority >= 0) {
      if (leftPriority < 0) return 1;
      if (rightPriority < 0) return -1;
      return leftPriority - rightPriority;
    }

    return left.name.localeCompare(right.name, 'ru-RU');
  });
};
