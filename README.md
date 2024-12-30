# LLM Text Document Embeddings

Parse and Load text files into Postges Vector DB which can be used as part of a RAG setup.

- [LLM Text Document Embeddings](#llm-text-document-embeddings)
  - [Set up Instructions](#set-up-instructions)
    - [1. Set up Docker environment](#1-set-up-docker-environment)
    - [2. Connect to the database using a PostgreSQL GUI client](#2-connect-to-the-database-using-a-postgresql-gui-client)
    - [3. Set up Ollama and Configure Env Vars](#3-set-up-ollama-and-configure-env-vars)
    - [4. Install Node Depdencies](#4-install-node-depdencies)
  - [Usage](#usage)
    - [Index Document](#index-document)
    - [Index Directory of Documents](#index-directory-of-documents)
    - [Search Indexed Database for Relevent Documents](#search-indexed-database-for-relevent-documents)
    - [Use AI to Generate Response from Search Results](#use-ai-to-generate-response-from-search-results)
    - [Start Web Server](#start-web-server)
      - [View Swagger Docs](#view-swagger-docs)

## Set up Instructions

### 1. Set up Docker environment

Create a `docker-compose.yml` file with the following content:

```yaml
services:
  timescaledb:
    image: timescale/timescaledb-ha:pg16
    container_name: timescaledb
    environment:
      - POSTGRES_DB=postgres
      - POSTGRES_PASSWORD=password
    ports:
      - "5432:5432"
    volumes:
      - timescaledb_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  timescaledb_data:
```

Run the Docker container:

```bash
docker compose up -d
```

### 2. Connect to the database using a PostgreSQL GUI client

- Open client
- Create a new connection with the following details:
  - Host: localhost
  - Port: 5432
  - User: postgres
  - Password: password
  - Database: postgres

### 3. Set up Ollama and Configure Env Vars

Install ollama locally or point to a managed ollama instance by setting OLLAMA_BASE_URL in the [example.env](example/.env).

1. Optional if ollama is different than http://127.0.0.1:11434/ or have different postgres url, etc:

```bash
cp example.env .env
```

**Example .env**
```
TIMESCALE_SERVICE_URL=postgres://postgres:password@127.0.0.1:5432/postgres
VECTOR_DATABASE_EMBEDDING_TABLE_NAME=text_chunks
VECTOR_DATABASE_EMBEDDING_DIMENSIONS=1024

# Uses https://github.com/jparkerweb/semantic-chunking when true and langchain/document_loaders/fs/text when false.
USE_SEMANTIC_CHUNKING=false

OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_CHAT_MODEL=llama3.2

# If this is changed, the VECTOR_DATABASE_EMBEDDING_DIMENSIONS may also need to be updated.
OLLAMA_EMBEDDING_MODEL=mxbai-embed-large

WEBSERVER_PORT=3000
```

2. For linux based on the env config docs described [here](https://github.com/ollama/ollama/blob/main/docs/faq.md#setting-environment-variables-on-linux
) edit /etc/systemd/system/ollama.service.d/override.conf or make sure the env vars are set, OLLAMA_HOST=0.0.0.0 and OLLAMA_ORIGINS=*:

```
[Service]
Environment="OLLAMA_HOST=0.0.0.0"
Environment="OLLAMA_ORIGINS=*"

systemctl daemon-reload
systemctl restart ollama
```

3. Make sure ollama is running on http://127.0.0.1:11434/ (or by loading OLLAMA_BASE_URL), should return:

```
Ollama is running
```

4. Finally load the following models:

```bash
ollama pull llama3.2
ollama pull mxbai-embed-large
```

### 4. Install Node Depdencies

```bash
npm ci
```

## Usage

### Index Document

```bash
npm run insert-file /path-to-text-document
```

### Index Directory of Documents

```bash
npm run insert-dir /path-to-directory
```

### Search Indexed Database for Relevent Documents

```bash
npm run search "What's an LLM"
```

### Use AI to Generate Response from Search Results

```bash
npm run ai-search "What's an LLM"
```

### Start Web Server

```bash
npm start
```

Then load a search using: http://localhost:3000/ai-search?searchText=what%20is%20an%20llm&dbResultLimit=5.

#### View Swagger Docs

[![Swagger Docs](swagger.png)](https://paulb896.github.io/llm-doc-embeddings/)

Local Swagger docs will be available here: **http://localhost:3000/docs**, and an example can be seen here: https://paulb896.github.io/llm-doc-embeddings/.
