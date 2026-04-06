export function toCamelCase(str: string): string {
  return str.replace(/([-_][a-z])/ig, ($1) => {
    return $1.toUpperCase()
      .replace('-', '')
      .replace('_', '');
  });
}

export function mapToCamelCase<T>(obj: Record<string, unknown>): T {
  const newObj: Record<string, unknown> = {};
  for (const key in obj) {
    newObj[toCamelCase(key)] = obj[key];
  }
  return newObj as T;
}
