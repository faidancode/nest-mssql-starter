import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import * as schema from '../drizzle/schema'; 
import { and, asc, desc, eq, like, or, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import {
  CreatePositionInput,
  ListPositionsQuery,
  UpdatePositionInput,
} from './position.schema';
import { NodeMsSqlDatabase } from 'drizzle-orm/node-mssql';

// Tipe data database disesuaikan untuk MSSQL
type Db = NodeMsSqlDatabase<typeof schema>;

@Injectable()
export class PositionService {
  constructor(@Inject('DRIZZLE') private readonly db: Db) {}

  private buildWhere(query: ListPositionsQuery) {
    const { q, search, isActive } = query;
    let where: any = sql`1 = 1`;

    const term = (search ?? q)?.trim();
    if (term && term.length > 0) {
      where = and(
        where,
        or(
          like(schema.positions.name, `%${term}%`),
          like(schema.positions.slug, `%${term}%`),
        ),
      );
    }

    if (typeof isActive === 'boolean') {
      where = and(where, eq(schema.positions.isActive, isActive));
    }

    return where;
  }

  async create(dto: CreatePositionInput) {
    const slug =
      dto.slug ??
      dto.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

    // MSSQL mendukung Query API dari Drizzle secara identik
    const existing = await this.db._query.positions.findFirst({
      where: or(
        eq(schema.positions.name, dto.name),
        eq(schema.positions.slug, slug),
      ),
    });

    if (existing) {
      throw new ConflictException('Nama jabatan sudah digunakan');
    }

    const id = randomUUID();

    await this.db.insert(schema.positions).values({
      id,
      name: dto.name,
      slug,
      isActive: dto.isActive ?? true,
    });

    return { id, ...dto, slug };
  }

  async findAll(query: ListPositionsQuery) {
    const { page, limit, sort } = query;

    const [sortField, sortDirRaw] = sort.split(':');
    const sortDir = sortDirRaw?.toLowerCase() === 'asc' ? 'asc' : 'desc';

    const allowedSortFields = {
      createdAt: schema.positions.createdAt,
      updatedAt: schema.positions.updatedAt,
      name: schema.positions.name,
      slug: schema.positions.slug,
    } as const;

    const column =
      allowedSortFields[sortField as keyof typeof allowedSortFields] ??
      schema.positions.createdAt;

    const orderBy = sortDir === 'desc' ? desc(column) : asc(column);
    const where = this.buildWhere(query);
    const offset = (page - 1) * limit;

    const [rows, [{ total }]] = await Promise.all([
      this.db
        .select()
        .from(schema.positions)
        .where(where)
        .orderBy(orderBy)
        .offset(offset)
        .fetch(limit),
      this.db
        .select({ total: sql<number>`COUNT(*)` })
        .from(schema.positions)
        .where(where),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      items: rows,
      meta: { page, limit, total, totalPages },
    };
  }

  async findOne(id: string) {
    const [position] = await this.db
      .select()
      .from(schema.positions)
      .where(eq(schema.positions.id, id));

    if (!position) {
      throw new NotFoundException(`Position dengan ID ${id} tidak ditemukan`);
    }
    return position;
  }

  async update(id: string, dto: UpdatePositionInput) {
    await this.findOne(id); // Validasi eksistensi

    await this.db
      .update(schema.positions)
      .set(dto)
      .where(eq(schema.positions.id, id));

    return { id, ...dto };
  }

  async remove(id: string) {
    await this.findOne(id); // Validasi eksistensi

    await this.db.delete(schema.positions).where(eq(schema.positions.id, id));

    return { message: `Position dengan ID ${id} berhasil dihapus` };
  }
}
