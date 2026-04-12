import { RagService } from './rag.service';

describe('RagService', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    delete process.env.RAG_SERVICE_URL;
  });

  it('returns a local match when no external service is configured', async () => {
    const prismaMock = {
      document: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'doc-1',
            filename: 'auth-guide.md',
            project: 'core',
            category: 'security',
            extractedText:
              'Use the authorization header with a bearer token for API access.',
            updatedAt: new Date(),
          },
        ]),
      },
    };

    const service = new RagService(prismaMock as never);

    const result = await service.query('How do I authenticate?');

    expect(result.sources).toHaveLength(1);
    expect(result.sources[0].documentId).toBe('doc-1');
    expect(result.answer).toContain('auth-guide.md');
  });
});
