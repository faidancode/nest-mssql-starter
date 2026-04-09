import { Test, TestingModule } from '@nestjs/testing';
import { PositionController } from './position.controller';
import { PositionService } from './position.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

describe('PositionController', () => {
  let controller: PositionController;
  let service: jest.Mocked<PositionService>;

  beforeEach(async () => {
    const serviceMock: Partial<Record<keyof PositionService, any>> = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PositionController],
      providers: [
        {
          provide: PositionService,
          useValue: serviceMock,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<PositionController>(PositionController);
    service = module.get(PositionService) as jest.Mocked<PositionService>;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('parses list query params before delegating to service', async () => {
    const payload = {
      items: [],
      meta: { page: 2, limit: 5, total: 0, totalPages: 0 },
    };
    service.findAll.mockResolvedValue(payload as any);

    const result = await controller.findAll({
      page: '2',
      limit: '5',
      sort: 'name:asc',
    });

    expect(service.findAll).toHaveBeenCalledWith({
      page: 2,
      limit: 5,
      q: undefined,
      search: undefined,
      sort: 'name:asc',
      isActive: undefined,
    });
    expect(result).toBe(payload);
  });

  it('passes search and isActive param to service', async () => {
    service.findAll.mockResolvedValue({ items: [], meta: {} } as any);

    await controller.findAll({
      page: '1',
      limit: '10',
      sort: 'createdAt:desc',
      search: 'man',
      isActive: 'false',
    });

    expect(service.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'man', isActive: false }),
    );
  });

  it('returns position by id', async () => {
    service.findOne.mockResolvedValue({ id: '1' } as any);

    const result = await controller.findOne('1');

    expect(service.findOne).toHaveBeenCalledWith('1');
    expect(result).toEqual({ id: '1' });
  });

  it('validates payload when creating position', async () => {
    const dto = { name: 'Manager', slug: 'manager', isActive: true };
    service.create.mockResolvedValue({ id: '1', ...dto } as any);

    const result = await controller.create(dto);

    expect(service.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ id: '1', ...dto });
  });

  it('passes id and payload to update', async () => {
    const dto = { name: 'Updated' };
    service.update.mockResolvedValue({ id: '1', ...dto } as any);

    const result = await controller.update('1', dto);

    expect(service.update).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({ name: 'Updated' }),
    );
    expect(result).toEqual({ id: '1', ...dto });
  });

  it('removes position and returns service response', async () => {
    service.remove.mockResolvedValue({ message: 'ok' } as any);

    const result = await controller.remove('1');

    expect(service.remove).toHaveBeenCalledWith('1');
    expect(result).toEqual({ message: 'ok' });
  });
});
