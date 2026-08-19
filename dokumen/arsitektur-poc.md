flowchart TB
    classDef ext   fill:#EAEFF5,stroke:#5A6B7B,color:#1E2A38
    classDef ing   fill:#20618B,stroke:#12324F,color:#fff
    classDef proc  fill:#2C8C99,stroke:#12324F,color:#fff
    classDef store fill:#F4F7FA,stroke:#2C8C99,color:#1E2A38
    classDef be    fill:#3AA6B9,stroke:#12324F,color:#fff
    classDef fe    fill:#F4A259,stroke:#B5651D,color:#12324F
    classDef user  fill:#12324F,stroke:#12324F,color:#fff
    classDef note  fill:#FFF6E9,stroke:#F4A259,color:#7A4A12

    %% ---------- External sources ----------
    subgraph EXT["External Data Sources"]
        direction LR
        SDI["Satu Data Indonesia / Jakarta<br/><i>REST API + Spreadsheet · primer</i>"]:::ext
        WEB["Situs / Portal Publik<br/><i>HTML · sumber sekunder (GCI/restoran)</i>"]:::ext
    end

    %% ---------- Operator (manual trigger, ganti cron) ----------
    ADMIN(["Operator / Admin<br/><i>tombol Refresh — on-demand</i>"]):::user

    %% ---------- Semua di Vercel ----------
    subgraph VERCEL["Vercel — Next.js (Node / Fluid Compute)"]
        direction TB

        subgraph INGEST["Ingestion — Route Handler (di-trigger manual)"]
            direction LR
            APIF["API Client → SDI<br/>+ retry/backoff"]:::ing
            SHEET["Spreadsheet<br/>Parser"]:::ing
            CRAWL["Crawler per-target<br/><i>1 request = 1 target</i>"]:::ing
        end

        subgraph PIPE["Processing Pipeline"]
            direction LR
            NORM["Clean · Normalize<br/>· Dedup · Validate"]:::proc
            KPICALC["KPI Engine +<br/>Indicator Mapper<br/>(GCI / GPCI)"]:::proc
        end

        subgraph API["Backend / API Layer"]
            direction LR
            REST["Route Handlers /<br/>Server Actions"]:::be
            SVC["Query · KPI ·<br/>Filter/Search Svc"]:::be
            CACHE[["Vercel Cache<br/>ISR / Runtime Cache"]]:::be
        end
    end

    %% ---------- DB: Neon dari Marketplace ----------
    subgraph DATA["Persistence — Vercel Marketplace"]
        direction LR
        DB[("Neon Postgres · free tier<br/>raw · cleaned · KPI · metadata")]:::store
    end

    %% ---------- Dashboard ----------
    subgraph CLIENT["Web Dashboard (browser)"]
        direction LR
        UI["KPI Cards · Tabel · Chart<br/>· Readiness GCI/GPCI View"]:::fe
    end

    %% ---------- Catatan POC ----------
    N1["POC: cron di-skip → refresh manual<br/>crawl berat dipindah ke worker/offline saat prod"]:::note

    %% ---------- Edges ----------
    ADMIN -->|klik Refresh| REST
    REST -.->|trigger sync| INGEST

    SDI -->|HTTPS| APIF
    SDI -->|export| SHEET
    WEB -->|HTTPS| CRAWL

    APIF --> NORM
    SHEET --> NORM
    CRAWL --> NORM
    NORM -->|raw records| DB
    NORM --> KPICALC
    KPICALC -->|cleaned + KPI| DB

    REST --> SVC
    SVC -->|SQL| DB
    SVC <-->|read/write| CACHE
    UI -->|HTTPS / JSON| REST

    N1 -.- VERCEL
