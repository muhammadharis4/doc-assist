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
});
