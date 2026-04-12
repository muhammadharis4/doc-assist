import { QueriesService } from './queries.service';

describe('QueriesService', () => {
  it('persists a query result with its sources', async () => {
    const historyRecord = {
      id: 'history-1',
      query: 'How do I authenticate?',
      answer: 'Answer text',
      userId: null,
      createdAt: new Date(),
      sources: [
        {
          id: 'source-1',
          queryHistoryId: 'history-1',
          documentId: 'doc-1',
          snippet: 'Use bearer tokens.',
          score: 2,
        },
      ],
    };

    const prismaMock = {
      queryHistory: {
        create: jest.fn().mockResolvedValue(historyRecord),
      },
      savedQuery: {
        findMany: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
    };

    const ragMock = {
      query: jest.fn().mockResolvedValue({
        answer: 'Answer text',
        sources: [
          {
            documentId: 'doc-1',
            filename: 'auth-guide.md',
            snippet: 'Use bearer tokens.',
            score: 2,
          },
        ],
      }),
    };

    const service = new QueriesService(prismaMock as never, ragMock as never);

    const result = await service.executeQuery({
      query: 'How do I authenticate?',
    });

    expect(ragMock.query).toHaveBeenCalledWith('How do I authenticate?');
    expect(prismaMock.queryHistory.create).toHaveBeenCalledWith({
      data: {
        query: 'How do I authenticate?',
        answer: 'Answer text',
        userId: null,
        sources: {
          create: [
            {
              documentId: 'doc-1',
              snippet: 'Use bearer tokens.',
              score: 2,
            },
          ],
        },
      },
      include: {
        sources: true,
      },
    });
    expect(result).toBe(historyRecord);
  });

  it('trims and persists a saved query', async () => {
    const savedRecord = {
      id: 'saved-1',
      title: 'Run tests',
      query: 'How do I run tests?',
      userId: null,
      createdAt: new Date(),
    };

    const prismaMock = {
      queryHistory: {
        create: jest.fn(),
      },
      savedQuery: {
        findMany: jest.fn(),
        create: jest.fn().mockResolvedValue(savedRecord),
        delete: jest.fn(),
      },
    };

    const ragMock = {
      query: jest.fn(),
    };

    const service = new QueriesService(prismaMock as never, ragMock as never);

    const result = await service.createSaved({
      title: '  Run tests  ',
      query: '  How do I run tests?  ',
    });

    expect(prismaMock.savedQuery.create).toHaveBeenCalledWith({
      data: {
        title: 'Run tests',
        query: 'How do I run tests?',
        userId: null,
      },
    });
    expect(result).toBe(savedRecord);
  });

  it('rejects invalid saved query payloads', async () => {
    const prismaMock = {
      queryHistory: {
        create: jest.fn(),
      },
      savedQuery: {
        findMany: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
    };

    const ragMock = {
      query: jest.fn(),
    };

    const service = new QueriesService(prismaMock as never, ragMock as never);

    await expect(
      service.createSaved({ title: '   ', query: 'valid query' }),
    ).rejects.toThrow('title and query are required');

    await expect(
      service.createSaved({
        title: 'A'.repeat(121),
        query: 'valid query',
      }),
    ).rejects.toThrow('title must be at most 120 characters');

    await expect(
      service.createSaved({
        title: 'Valid title',
        query: 'A'.repeat(2001),
      }),
    ).rejects.toThrow('query must be at most 2000 characters');
  });
});
