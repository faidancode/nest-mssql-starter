import { Test, TestingModule } from '@nestjs/testing';
import { PositionService } from './position.service';
import { NotFoundException } from '@nestjs/common';

describe('PositionService', () => {
  let service: PositionService;
  let db: any;

  const createSelectBuilder = (rows: any[]) => ({
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    fetch: jest.fn().mockResolvedValue(rows),
  });

  const createCountBuilder = (total: number) => ({
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockResolvedValue([{ total }]),
  });

  const createFindOneBuilder = (rows: any[]) => ({
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockResolvedValue(rows),
  });

  beforeEach(async () => {
    db = {
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      _query: {
        positions: {
          findFirst: jest.fn(),
        },
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PositionService,
        {
          provide: 'DRIZZLE',
          useValue: db,
        },
      ],
    }).compile();

    service = module.get<PositionService>(PositionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns paginated positions', async () => {
    const rows = [
      {
        id: '1',
        name: 'Manager',
        slug: 'manager',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    db.select
      .mockReturnValueOnce(createSelectBuilder(rows))
      .mockReturnValueOnce(createCountBuilder(rows.length));

    const result = await service.findAll({
      page: 1,
      limit: 5,
      q: undefined,
      search: undefined,
      sort: 'name:asc',
      isActive: undefined,
    });

    expect(result).toEqual({
      items: rows,
      meta: {
        page: 1,
        limit: 5,
        total: rows.length,
        totalPages: 1,
      },
    });
    expect(db.select).toHaveBeenCalledTimes(2);
  });

  it('applies search term when listing positions', async () => {
    const rows: any[] = [];
    db.select
      .mockReturnValueOnce(createSelectBuilder(rows))
      .mockReturnValueOnce(createCountBuilder(0));

    const buildWhereSpy = jest.spyOn(
      PositionService.prototype as any,
      'buildWhere',
    );

    await service.findAll({
      page: 1,
      limit: 10,
      q: undefined,
      search: 'man',
      sort: 'name:asc',
      isActive: undefined,
    });

    expect(buildWhereSpy).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'man' }),
    );
    buildWhereSpy.mockRestore();
  });

  it('throws when position not found', async () => {
    db.select.mockReturnValueOnce(createFindOneBuilder([]));

    await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
  });

  it('creates a position and derives slug from name when missing', async () => {
    const insertValues = jest.fn().mockResolvedValue(undefined);
    db.insert.mockReturnValue({ values: insertValues });
    db._query.positions.findFirst.mockResolvedValue(null);

    const created = await service.create({
      name: 'Senior Manager',
      slug: undefined,
      isActive: true,
    });

    expect(insertValues).toHaveBeenCalledWith(
      expect.objectContaining({ slug: 'senior-manager' }),
    );
    expect(created).toEqual(
      expect.objectContaining({
        name: 'Senior Manager',
        slug: 'senior-manager',
        isActive: true,
      }),
    );
    expect(created.id).toEqual(expect.any(String));
  });

  it('removes a position', async () => {
    const findOneSpy = jest
      .spyOn(service, 'findOne')
      .mockResolvedValue({ id: 'pos-1' } as any);

    const whereMock = jest.fn().mockResolvedValue(undefined);
    db.delete.mockReturnValue({ where: whereMock });

    const result = await service.remove('pos-1');

    expect(whereMock).toHaveBeenCalled();
    expect(result).toEqual({
      message: 'Position dengan ID pos-1 berhasil dihapus',
    });

    findOneSpy.mockRestore();
  });
});
