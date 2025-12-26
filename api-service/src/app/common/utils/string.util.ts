export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD') // split accented letters into base letter and diacritical mark
    .replace(/[\u0300-\u036f]/g, '') // remove diacritical marks
    .replace(/\s+/g, '-') // replace spaces with hyphens
    .replace(/[^\w\-]+/g, '') // remove special characters
    .replace(/\-\-+/g, '-') // replace multiple hyphens with a single hyphen
    .replace(/^-+/, '') // remove hyphens from the start
    .replace(/-+$/, ''); // remove hyphens from the end
}
