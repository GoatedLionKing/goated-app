create table if not exists owners (
  id uuid primary key,
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists games (
  id uuid primary key,
  slug text not null unique,
  title text not null,
  description text not null default '',
  cover_url text,
  platform_name text,
  project_type_name text,
  status_name text,
  version text,
  developer text,
  original_release date,
  localization_release date,
  youtube_video_url text,
  featured boolean not null default false,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists game_versions (
  id uuid primary key,
  game_id uuid not null references games(id) on delete cascade,
  name text not null,
  version_number text not null,
  description text not null default '',
  release_date date,
  created_at timestamptz not null default now()
);

create table if not exists game_files (
  id uuid primary key,
  version_id uuid not null references game_versions(id) on delete cascade,
  name text not null,
  description text not null default '',
  external_url text,
  file_size bigint,
  download_count bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint game_files_source_check
    check (external_url is not null)
);

create index if not exists games_published_idx
  on games(published);

create index if not exists games_featured_idx
  on games(featured);

create index if not exists games_created_at_idx
  on games(created_at desc);

create index if not exists game_versions_game_id_idx
  on game_versions(game_id);

create index if not exists game_files_version_id_idx
  on game_files(version_id);
