flowchart TB
    classDef ext  fill:#EAEFF5,stroke:#5A6B7B,color:#1E2A38
    classDef ing  fill:#20618B,stroke:#12324F,color:#fff
    classDef proc fill:#2C8C99,stroke:#12324F,color:#fff
    classDef store fill:#F4F7FA,stroke:#2C8C99,color:#1E2A38
    classDef be   fill:#3AA6B9,stroke:#12324F,color:#fff
    classDef fe   fill:#F4A259,stroke:#B5651D,color:#12324F
    classDef job  fill:#12324F,stroke:#12324F,color:#fff

    subgraph EXT["External Data Sources"]
        direction LR
        SDI["Satu Data Indonesia / Jakarta<br/><i>REST API + Spreadsheet · primer</i>"]:::ext
        WEB["Situs / Portal Publik<br/><i>HTML · sumber sekunder</i>"]:::ext
    end

    SCHED(["Scheduler (cron)"]):::job

    subgraph APP["Aplikasi — Next.js + Bun runtime"]
        direction TB

        subgraph INGEST["Ingestion Layer"]
            direction LR
            APIF["API Client<br/>+ retry/backoff"]:::ing
            SHEET["Spreadsheet<br/>Parser"]:::ing
            CRAWL["Crawler /<br/>Scraper"]:::ing
        end

        subgraph PIPE["Processing Pipeline"]
            direction LR
            NORM["Clean · Normalize<br/>· Dedup · Validate"]:::proc
            KPICALC["KPI Engine +<br/>Indicator Mapper<br/>(GCI / GPCI)"]:::proc
        end

        subgraph API["Backend / API Layer"]
            direction LR
            REST["API Routes /<br/>Server Actions"]:::be
            SVC["Query · KPI ·<br/>Filter/Search Svc"]:::be
            CACHE[["Cache"]]:::be
        end
    end

    subgraph DATA["Persistence"]
        direction LR
        DB[("Primary DB<br/>raw · cleaned · KPI · metadata")]:::store
    end

    subgraph CLIENT["Web Dashboard (browser)"]
        direction LR
        UI["KPI Cards · Tabel · Chart<br/>· Readiness GCI/GPCI View"]:::fe
    end

    SDI -->|HTTPS| APIF
    SDI -->|export| SHEET
    WEB -->|HTTPS| CRAWL
    SCHED -.->|trigger| INGEST

    APIF & SHEET & CRAWL -->|raw records| NORM
    NORM --> KPICALC
    INGEST -.->|persist raw| DB
    KPICALC -->|cleaned + KPI| DB

    REST --> SVC
    SVC -->|SQL| DB
    SVC <-->|read/write| CACHE
    UI -->|HTTPS / JSON| REST