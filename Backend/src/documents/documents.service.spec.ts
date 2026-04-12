import { DocumentsService } from './documents.service';

describe('DocumentsService', () => {
  it('applies pagination defaults when no values are provided', async () => {
    const prismaMock = {
      document: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    const ragMock = {
      indexDocument: jest.fn(),
      deleteDocumentIndex: jest.fn(),
    };

    const service = new DocumentsService(prismaMock as never, ragMock as never);

    await service.findAll();

    expect(prismaMock.document.findMany).toHaveBeenCalledWith({
      skip: 0,
      take: 20,
      orderBy: { createdAt: 'desc' },
    });
  });

  it('uses explicit pagination values when provided', async () => {
    const prismaMock = {
      document: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    const ragMock = {
      indexDocument: jest.fn(),
      deleteDocumentIndex: jest.fn(),
    };

    const service = new DocumentsService(prismaMock as never, ragMock as never);

    await service.findAll(10, 5);

    expect(prismaMock.document.findMany).toHaveBeenCalledWith({
      skip: 10,
      take: 5,
      orderBy: { createdAt: 'desc' },
    });
  });
});
