import { PrismaService } from '../../prisma.service';

export async function findProductIdsByFullText(
  prisma: PrismaService,
  term: string
): Promise<number[]> {
  const rows = await prisma.$queryRaw<Array<{ id: number }>>`
    SELECT id
    FROM products
    WHERE search_vector @@ plainto_tsquery('simple', ${term})
  `;
  return rows.map((row) => row.id);
}
