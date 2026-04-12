-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER,
    "project" TEXT,
    "category" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "storagePath" TEXT NOT NULL,
    "extractedText" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "QueryHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "query" TEXT NOT NULL,
    "answer" TEXT,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "QuerySource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "queryHistoryId" TEXT NOT NULL,
    "documentId" TEXT,
    "snippet" TEXT NOT NULL,
    "score" REAL,
    CONSTRAINT "QuerySource_queryHistoryId_fkey" FOREIGN KEY ("queryHistoryId") REFERENCES "QueryHistory" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "QuerySource_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SavedQuery" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
