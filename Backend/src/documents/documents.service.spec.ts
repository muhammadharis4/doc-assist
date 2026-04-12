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
      where: {},
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
      where: {},
      orderBy: { createdAt: 'desc' },
    });
  });

  it('filters documents by project, category, and keyword', async () => {
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

    await service.findAll(0, 20, {
      project: 'DocAssist',
      category: 'Setup',
      keyword: 'install',
    });

    expect(prismaMock.document.findMany).toHaveBeenCalledWith({
      skip: 0,
      take: 20,
      where: {
        project: 'DocAssist',
        category: 'Setup',
        OR: [
          { filename: { contains: 'install' } },
          { extractedText: { contains: 'install' } },
          { project: { contains: 'install' } },
          { category: { contains: 'install' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  });
});
