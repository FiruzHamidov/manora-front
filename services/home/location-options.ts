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

const orderLocationOptions = (
  options: HomeLocationOption[],
  priorityCount: number
): HomeLocationOption[] => {
  const priority = LOCATION_PRIORITY.slice(0, priorityCount);
  const findScopedPriorityIndex = (name: string): number => {
    const normalized = normalizeLocationName(name);
    return priority.findIndex((entry) =>
      entry.aliases.some((alias) => normalized.includes(normalizeLocationName(alias)))
    );
  };

  const renamed = options.map((option) => {
    const priorityIndex = findScopedPriorityIndex(option.name);
    return priorityIndex >= 0
      ? { ...option, name: priority[priorityIndex].label }
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
    const leftPriority = findScopedPriorityIndex(left.name);
    const rightPriority = findScopedPriorityIndex(right.name);

    if (leftPriority >= 0 || rightPriority >= 0) {
      if (leftPriority < 0) return 1;
      if (rightPriority < 0) return -1;
      return leftPriority - rightPriority;
    }

    return left.name.localeCompare(right.name, 'ru-RU');
  });
};

export const orderHomeLocationOptions = (
  options: HomeLocationOption[]
): HomeLocationOption[] => orderLocationOptions(options, LOCATION_PRIORITY.length);

export const orderListingLocationOptions = (
  options: HomeLocationOption[]
): HomeLocationOption[] => orderLocationOptions(options, 5);
